+++
title = "The moat in LLM chip design isn't the model — it's the environment"
date = 2026-06-24
description = "A field note on 2025–2026 agentic RTL generation: every result that moved the needle came from the verification loop wrapped around the LLM, not the LLM itself. For someone who builds compilers and ML infra, that loop is the product."
authors = ["Kit Kyo · A2O Labs"]
[taxonomies]
tags = ["llm", "chip-design", "rtl", "agents", "eda", "rl-environments", "verification"]
[extra]
show_author = true
+++

> *A field note from A2O Labs. Numbers are 2024–2026 snapshots in a fast field; treat the **relative** findings as durable and specific percentages as dated. Every claim below is checked against the primary paper or repo; the over-claimed ones are flagged in-line.*

There's a result from mid-2025 that should stop anyone building "AI for X" infra in their tracks: a **7-billion-parameter model beats a 671-billion-parameter one** at writing realistic RTL. CodeV-R1-7B ([arXiv:2505.24183](https://arxiv.org/abs/2505.24183)) outscores the 671B DeepSeek-R1 on RTLLM v1.1 (72.9% vs 64.8% pass@1) and v2 (68.0% vs 64.7%) — while being its *own distillation student*. The 100× smaller model wins not because it's smarter, but because it was trained inside a **verification environment** the giant never had.

That single fact is the whole story of where LLM chip design is in 2026. The hype framing — "AI writes Verilog now" — is wrong in both directions. It under-sells the engineering (the loops are real and they work) and over-sells the model (the model is the commodity). What's scarce, and what's actually moving the benchmarks, is the **environment**: the testbench generator, the simulator-in-the-loop, the reward computed from EDA logs, the execution-validated dataset. If you build compilers and ML infrastructure, that environment is not a side-quest. It's the product.

## The paradigm shift is real, but "one-shot fails 60% of the time" needs an asterisk

The summary going around — that the field moved from zero-shot RTL emission to closed-loop multi-agent workflows because naive generation fails most of the time — is **directionally correct and benchmark-dependent**.

- On the easier **VerilogEval v2** spec-to-RTL benchmark ([arXiv:2408.11053](https://arxiv.org/abs/2408.11053)), GPT-4o lands ~63% pass@1. So the strongest frontier model still fails ~37% of *easy* problems.
- On NVIDIA's harder **CVDP** ([arXiv:2506.14074](https://arxiv.org/abs/2506.14074)) — 783 problems across 13 categories, **written by ~35 hardware engineers with 4+ years of experience** — SOTA tops out at **≤34% pass@1** (Claude 3.7 Sonnet, 33.56%). That's a ~66% failure rate.

So: "fails ~40%+, often the majority, on realistic problems" is well-supported. "Always >60% fail" is too strong for the easy slice. The honest headline is that **difficulty, not capability, is the variable** — and the hardest slice is exactly the part you'd want to automate.

The CVDP category breakdown is the tell. RTL spec-to-code sits around 48%; debugging around 53%. But **testbench and verification generation collapse**: assertion generation ~19%, and *agentic* checker generation (cid13) drops to **0%**. The paper's own framing: models "consistently struggle to generate even syntactically valid testbench code, despite it being written in the same HDL as the RTL." The thing the industry most needs — verification — is the thing LLMs are worst at. Hold that thought.

## The pattern: every win came from the loop, not the model

Read five or six of the 2025 papers back to back and the same shape appears every time. The base LLM is interchangeable; the **execution-feedback loop** around it is where the gains live.

### CodeV-R1: the reward *is* a simulator

CodeV-R1's training is a "distill-then-RL" pipeline, but the interesting half is the reward. There is **no human-written testbench at RL time**. They parse the *golden* reference module with **Yosys** (extract I/O, widths, clock/reset polarity), auto-generate a SystemVerilog testbench, feed identical random stimulus to golden and candidate under **Icarus Verilog**, and compute an error rate. `ε = 0%` → functionally equivalent → reward 1, else 0. Format compliance is AND'd in; an overlong-output penalty is added.

The detail that matters for anyone building a reward model: their **rule-based** testbench generator has a **0.3% false-negative rate vs 7.6% for an LLM-generated testbench** — a 96% reduction in wrongly failing correct designs. *That* low-noise reward is what makes RL stable enough to add >10pp on RTLLM. The lesson isn't "use RL." It's "the reward function is a verification-engineering problem, and getting it right is most of the work."

"Adaptive DAPO," their named contribution, turns out to be a *sampling-efficiency* tweak (dynamically size the generation batch so dynamic-sampling discards don't waste rollouts; ~1.25–1.44× speedup) — not a new gradient. Useful, honest, and a good reminder that the algorithmic novelty is small next to the environment.

And the whole thing is **clonable**: Apache-2.0, open weights/code/data, and the reward harness (`codev_eval_toolkit/verify.py`) depends only on **Yosys + iverilog** — no Synopsys, no Cadence. The reproduction cost is GPU (~2,656 A100-hours end-to-end), not licensing.

### VeriPrefer vs VeriCoder: the same loop, used two ways

**VeriPrefer** ([arXiv:2504.15804](https://arxiv.org/abs/2504.15804)) uses the loop at *RL* time: generate a testbench (LLM-drafted, then **VCS**-graded for coverage and correctness, max 3 refinement passes), run two candidate solutions against it, and make the one passing *more* test cases the DPO "chosen." Its honest result is that DPO gains are *modest* (often <1pp on VerilogEval, ~2pp on RTLLM) — and it's gated behind **Synopsys VCS** with an unstated repo license. Rich signal, poor reproducibility.

**VeriCoder** ([arXiv:2504.15659](https://arxiv.org/abs/2504.15659)) uses the same loop at *data-curation* time: a teacher model writes unit tests, simulates the RTL against them under **open iverilog**, and iteratively revises design-or-test (up to 5 rounds) until passing — yielding **125,777 functionally-validated (spec, RTL, tests) triples** from OriGen's ~217k. It's Apache-2.0 and the curation script (`expand_dataset.py`) is a clean, re-runnable harness. ⚠️ One honesty flag I'll repeat because the summary I started from got it wrong: VeriCoder's "+71.7% / +27.4%" are *relative gains over OriGen*, **not** a benchmark crown — o3-mini and GPT-4o beat its absolute pass@1. Cite it for the **method**, not the leaderboard.

The contrast is the actionable bit: VeriPrefer is the *richer* signal (graded pass-counts) but VCS-locked; VeriCoder is the *more reproducible* moat (an open-iverilog assertion loop) shipped permissively. If you're building a self-hosted hardware-verification environment, VeriCoder's loop is the better template.

### CVDP: someone already shipped the environment — and left the hard part open

The most important artifact for an infra person isn't a model. It's **NVlabs/cvdp_benchmark** (Apache-2.0). CVDP ships problems in a **non-agentic** *and* an **agentic** format, and the agentic format is a genuine sandboxed tool-use environment:

- Your agent runs as a **Docker image**. It's dropped into a `/code` workspace (`prompt.json`, `docs/`, `rtl/`, `verif/`, `rundir/`), mutates files, and exits.
- The harness diffs the workspace, then a **separate verification container** compiles and simulates the result with real open-source EDA tools — **Icarus Verilog, Verilator, Yosys, cocotb** — and scores functional pass@k.
- That triple — *initial state → tool sandbox → simulation-checked reward* — is exactly an **RL environment with a verifiable reward**, which is rare for hardware. The example agent (`examples/agent/`) is the integration seam; `report.json` is a ready-made reward.

And the frontier it exposes is wide open: agentic verification/reuse is where SOTA collapses (checker-gen 0%, reuse ~24%). The environment exists; the agent and the RL loop on top of it mostly don't. That's the gap.

(NVIDIA's **CraftRTL**, [arXiv:2409.12993](https://arxiv.org/abs/2409.12993), is the data sibling — "learn from your own checkpoints' errors → synthesize targeted repair data," real +3.8/+10.9/+6.6pp gains — but it's half-open: pipeline yes, weights/data/permissive-license no, NIM-gated.)

### AIvril / Hey AI: the agentic EDA loop, and a number-hygiene warning

The multi-agent frameworks — **AIvril** ([2409.11411](https://arxiv.org/abs/2409.11411)), **AIvril2** ([2412.04485](https://arxiv.org/abs/2412.04485)), **"Hey AI"** ([2507.02660](https://arxiv.org/abs/2507.02660), Infineon + RPTU) — all implement the same engine at increasing sophistication: LLM emits RTL → an EDA tool executes it → a **critic/review agent distills the log** (line numbers, failed assertions, formal counterexamples) into a *targeted* corrective prompt → the coder regenerates. AIvril stops at compile+sim on open tools; AIvril2 adds dual-language via Vivado; Hey AI adds **lint (SpyGlass) + formal (JasperGold) + coverage closure** plus human-in-the-loop escalation.

The architectures are real and worth studying. The numbers need a cold shower, and this is where a careful reader earns their keep:

- **AIvril's "88.46% / 2×"** — the 88.46% is a *coverage-threshold hit-rate*, not functional pass@1, and the 2× is against RTLFixer (the weaker baseline).
- **AIvril2's "3.4×"** is measured against **ChipNeMo-13B (22.4%)**, the weakest entry in its own table. Against its *own* zero-shot Claude 3.5 Sonnet (60.23%), the real lift is **~1.28×**. The agentic loop adds modest value once you start from a strong model.
- **Hey AI's "95–98%"** is **HITL-assisted coverage**; the pure-autonomy average is ~86%, and coverage ≠ correctness.

None of the three released code. All numbers are self-reported, none third-party reproduced. This isn't a knock on the work — it's the reason an open, reproducible environment is worth more than another closed framework with a hero number.

## So where's the moat — and why does a compiler person own it?

Put the six systems side by side and the bottleneck every one of them names is the same: **verification-data scarcity**, solved by an **execution-feedback environment**. CodeV-R1's reward, VeriPrefer's DPO signal, VeriCoder's data filter, CVDP's grader, AIvril's review loop — these are all the same object wearing different hats: *a deterministic compilation/verification gatekeeper wrapped around a stochastic generator.*

If you've built an MLIR pass pipeline or worked inside TVM, that sentence should feel familiar, because it **is** that. A pass pipeline is a deterministic, composable sequence of analyses and transforms that constrain and lower an unstable input toward a correct, lower-level artifact. Swap "IR" for "RTL," swap "verifier passes" for "lint / sim / formal," and the agentic-RTL environment is a pass pipeline with an LLM in the generation slot. The same skills transfer: building fast, sandboxed, reproducible tool loops; parsing tool output into structured signal; making the whole thing deterministic enough to be a reward.

The concrete openings, ranked by how buildable they are today:

1. **Harden the reward.** CodeV-R1's `verify.py` uses random-simulation equivalence (probabilistic). Swap iverilog for **Verilator** (faster) and add **formal equivalence** (Yosys `eqy` / SymbiYosys) to kill false equivalences. Add coverage-directed stimulus to attack the residual runtime-error tail. This is pure compiler/EDA-infra work.
2. **Build the agent on CVDP.** The environment is shipped and Apache-2.0; the agent and the RL-loop-on-`report.json` are open. Agentic verification (the 0% category) is the highest-leverage target.
3. **Re-open the closed loops.** Hey AI's SpyGlass+JasperGold loop is gated; re-implement it on **Verilator + SymbiYosys + Yosys lint** and you have the first fully-open lint+formal agentic harness.

Honest caveats, because this is a field note and not a pitch: the academic ceiling (≤34% on CVDP) is far from tape-out-grade; the data is genuinely scarce (proprietary RTL doesn't leak); the headline numbers are mostly self-reported; and the strongest reproducible signal (open iverilog) is weaker than the proprietary VCS/formal stack the industrial papers lean on. This is early. But "early" plus "the bottleneck is exactly the infra you already know how to build" is the most interesting place a compiler/ML-infra engineer can stand.

The model is the commodity. The environment is the moat. Go build the environment.

---

### Read these (in order)
1. **CVDP** — [arXiv:2506.14074](https://arxiv.org/abs/2506.14074) · [github.com/NVlabs/cvdp_benchmark](https://github.com/NVlabs/cvdp_benchmark) (the buildable environment)
2. **CodeV-R1** — [arXiv:2505.24183](https://arxiv.org/abs/2505.24183) · [github.com/iprc-dip/CodeV-R1](https://github.com/iprc-dip/CodeV-R1) (7B>671B; the open reward harness)
3. **VeriPrefer** — [arXiv:2504.15804](https://arxiv.org/abs/2504.15804) · **VeriCoder** — [arXiv:2504.15659](https://arxiv.org/abs/2504.15659) (RL-reward vs data-filter, same loop)
4. **CraftRTL** — [arXiv:2409.12993](https://arxiv.org/abs/2409.12993) (errors→repair-data)
5. **AIvril2** — [arXiv:2412.04485](https://arxiv.org/abs/2412.04485) · **Hey AI** — [arXiv:2507.02660](https://arxiv.org/abs/2507.02660) (agentic EDA-log loops; read the architectures, distrust the hero numbers)
6. **Contamination check** — [arXiv:2503.13572](https://arxiv.org/abs/2503.13572) (read before trusting any single pass@1)
