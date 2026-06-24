+++
title = "Does a multi-agent panel beat a single LLM at evolutionary code search? (We tested it. No.)"
date = 2026-06-25
description = "We replaced the single-LLM mutation step of an AlphaEvolve-style evolve loop (OpenEvolve) with a proposer→critic→aggregator panel and tested it rigorously across three problems. It never won — equal on easy optimization, significantly worse on hard optimization (p=0.01), and on correctness-gated ARC it cracked nothing a single call couldn't. A clean negative result — plus the lossy-transport and 'not rate-limited, just thinking' bugs we had to fix to trust it."
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["evolutionary-search", "multi-agent", "llm", "negative-result", "deployability-eval"]

[extra]
show_author = true
+++

**TL;DR.** We replaced the single-LLM mutation step of an AlphaEvolve-style evolutionary
code-search loop (OpenEvolve) with a 3-agent panel — *proposer → critic → aggregator* —
and tested whether the panel produces better mutations. Across four regimes it never won:
equal on easy optimization, **significantly worse** on hard optimization (p=0.01), equal on
easy correctness-gated tasks, and on the hard tasks a single call failed, the panel failed
too (0/2). **A single strong-model call is ≥ a 3-agent panel as an evolve-loop mutation
operator — better-or-equal, and 3× cheaper.** The interesting part wasn't the verdict; it
was everything we had to fix to *trust* it.

| regime | result |
|---|---|
| circle packing (easy optimization) | panel ≈ single (no significant difference) |
| Heilbronn triangle (hard optimization) | **panel significantly worse**, p=0.01 |
| ARC, easy tasks | both solve all (train-fit + held-out test) |
| ARC, hard tasks (where single fails) | panel also fails, **0/2** |

---

## The idea

OpenEvolve (an open-source AlphaEvolve) evolves a program: an LLM proposes a code mutation,
a programmatic evaluator scores it, MAP-Elites + islands keep a diverse population, repeat.
The mutation quality is bounded by *one* LLM call per step.

The obvious upgrade: don't ask one model — ask a **panel**. A *proposer* drafts a change, a
*critic* finds bugs and weaknesses, an *aggregator* folds the critique in and emits the final
mutation. Intuitively, the critic should catch the dud mutations a single call sometimes
emits, so the panel should be a more reliable — maybe better — mutation operator. (And it sets
up a fun two-level idea: later, *evolve the panel topology itself*.)

We wired the panel in as OpenEvolve's LLM (one module implementing its `generate` interface),
selectable as `single` / `no_critic` / `panel`, so all arms share the exact same machinery and
the only variable is the agent pipeline. Backend: a strong frontier model (Opus-class), driven
headlessly so the whole loop runs on a subscription rather than metered API.

## The part that actually mattered: making the comparison trustworthy

The first version produced a pretty curve (a random-search seed evolved into
simulated-annealing-with-restarts) and we almost called it a win. A review stopped that cold
with the right objection: **there was no baseline.** Every run was the panel; there was no
single-LLM arm and no ablation. A nice curve proves the *mechanism runs* — it says nothing
about whether the panel *helped*. That correction is the whole post: *a working demo plus an
honest caveat is not a tested claim — you need the control that isolates the variable.*

Building that control surfaced two failures worth their own war stories.

### War story 1 — a "free" transport that silently corrupts code

To run on the subscription, the first backend scraped an interactive coding-assistant TUI
through a pseudo-terminal. Great for prose; **lossy for code.** It stripped ```code-fence
backticks, added a left margin to wrapped lines, mangled `<<<`/`>>>` diff markers, and — the
nasty one — *ate paired markdown emphasis*: `__name__` rendered as `name`, silently breaking
every `if __name__ == "__main__":`. Worst of all, under big prompts it sometimes returned its
own wrapper-instruction text instead of the model's answer.

This didn't just add noise — it **confounded the comparison**. The panel's prompts are the
largest (proposer + critic context), so the panel arm hit the corruption hardest: in one run
the panel "scored" 0 on every iteration while single looked fine. Read naively, that's
"panel is terrible." It was actually "the transport breaks on long prompts." A confounded
free backend is worse than no result.

The fix was twofold: a per-line sentinel so the emitted code survives the TUI, plus — better —
switching to a **faithful** headless mode that returns structured JSON (byte-exact code,
dunders and all). With a faithful backend the sentinel hack became unnecessary; the model just
emits a normal fenced block.

### War story 2 — "rate-limited" was a lie; it was thinking

The faithful backend was *slow* — ~6 minutes for a single mutation inside the evolve worker,
vs ~10 seconds standalone. The easy explanation ("subscription rate-limit") was wrong. The
call's own timing told the truth: API-time ≈ wall-time, no retries, **time-to-first-token ≈
140 seconds.** It wasn't waiting on a quota — the model was *thinking* for 140s before the
first token. The fix wasn't a quota dance; it was one flag: drop the reasoning effort to
`low` → TTFT 140s → ~7s, with no loss of code quality. (A separate, real quota limit showed
up later: a full three-arm run simply exhausts a subscription's window — the panel arm's 3×
call volume is what blows it. A genuine deployability data point about subscription-backed
evolve loops.)

Only after both fixes was the comparison clean enough to believe.

## The clean A/Bs

All numbers below are `combined_score` (higher = better), faithful backend, 8 repeats × 12
iterations per arm, with 200k-permutation significance tests (no distributional assumptions).

**Easy optimization — circle packing (n=26):**

| arm | mean | std |
|---|---|---|
| single | 0.911 | 0.071 |
| no_critic | 0.920 | 0.033 |
| panel | 0.915 | 0.017 |

Means are statistically indistinguishable (single-vs-panel p=0.98). Variance *looks* lower for
the panel (0.071 → 0.017), but it isn't significant (p=0.096), and it's entirely **one dud**:
drop single's single bad run and its spread equals the panel's (p=0.65). No benefit.

**Hard optimization — Heilbronn triangle (n=11):** the seed is degenerate (score 0), so each
arm must build a good 11-point arrangement from scratch.

| arm | mean | std |
|---|---|---|
| single | **0.888** | 0.040 |
| no_critic | 0.796 | 0.072 |
| panel | 0.834 | 0.036 |

Here the panel is **significantly worse than single** (Δ=0.054, p=0.010); no_critic worse
still. Adding agents *hurt*.

**Correctness-gated — ARC-AGI.** This is where a critic should shine: a wrong transform is a
catchable error. On easy evaluation tasks both arms solve everything (train-fit *and* held-out
test). So we hunted for hard tasks: scanning a single LLM over 15 evaluation tasks, it solved
13 on the held-out test and **failed only two**. We ran the panel on exactly those two
single-failures — **the panel failed both too (0/2).** Where a single call fails ARC, the
bottleneck is "couldn't find the abstract pattern," not "buggy code a critic can fix" — and a
critic can't conjure a pattern the proposer never saw.

## Verdict and mechanism

Four regimes, zero wins for the panel; significantly worse on the hard optimization problem;
3× the LLM cost throughout. The likely mechanism is a **game of telephone**: the aggregator
re-synthesizes the final code from "the proposal + the critique" instead of writing it
directly. That indirection can only *lose* fidelity relative to a single strong call — it
washes out on easy problems and costs you on hard ones. And the panel cannot manufacture a
capability a single call lacks; it can only re-mix what the proposer already produced.

A single strong-model call is the better mutation operator here — and the cheaper one.

## Takeaways

1. **Build the baseline before you believe the demo.** A working mechanism plus an honest
   limitation note is not a tested claim. The control that isolates your variable is the
   experiment; everything else is a screenshot.
2. **A lossy "free" backend can confound the very thing you're measuring.** The panel's
   apparent catastrophic failure was a transport artifact, not a finding. Verify transport
   fidelity, and run on a backend whose failures are *loud*, not silent.
3. **Diagnose, don't guess.** "It's rate-limited" was wrong; the timing said "it's thinking."
   One flag (`effort=low`) fixed a 6-minute call.
4. **Negative results are results.** The reusable parts — a faithful headless backend, a
   baseline/ablation harness, an ARC held-out-test scorer — outlived the hypothesis. The
   honest answer ("the obvious multi-agent upgrade doesn't help, and here's why") is worth
   more than another plausible-but-untested win.
