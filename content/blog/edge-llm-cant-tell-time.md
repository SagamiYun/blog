+++
title = "Your edge LLM can't tell time — and a 40-line memory can fix it (for some models)"
date = 2026-06-15
description = "A tiny adversarial benchmark shows small local LLMs confuse token-distance for elapsed wall-clock time. A zero-dependency continuous-time memory fixes it for sub-millisecond cost — but whether a model will even accept that fix turns out to be a model-dependent deployability property that capability leaderboards don't measure."
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["edge-llm", "deployability", "on-prem", "eval", "ollama"]

[extra]
show_author = true
+++

Here's a question your locally-served LLM probably gets wrong: *an auth token was issued with a 60-second TTL; given this log, is it still valid?* Not because the timestamps aren't in the prompt — they are — but because the model quietly substitutes **how many tokens ago** the token appeared for **how much wall-clock time** has elapsed. Bury the "token acquired" line under 1,500 tokens of noise and ask 2 seconds later, and the model declares a perfectly valid token expired. Squeeze a `[elapsed: 300s]` gap into two adjacent tokens, and it waves an expired one through.

We built a tiny adversarial benchmark to make this concrete, found a near-free fix, and then — running it across seven small models on a $0.30 budget of rented GPU time — hit something more interesting than the fix itself: **whether a model will even *use* the fix is model-dependent, and it changed across a single model generation.**

## The Decoupling Trap

The benchmark (we call it **DT-Stale**) does one nasty thing: it **decouples token-distance from wall-clock time**, in two anti-correlated cases.

- **Storm** — ~1,500 tokens of (real) log noise between "token acquired" and "action requested", but only seconds of real time. Token-*far*, time-*valid* → should **APPROVE**.
- **Silent drift** — the two events are token-adjacent, but an explicit `[elapsed: 300s]` sits between them. Token-*near*, time-*expired* → should **REJECT**.

A model that conflates the two axes fails the storm (rejects a valid token, fooled by length). And four of the small models we tested — Qwen3.5-2B, Llama-3.2-3B, Phi-3.5, Gemma-3-4B — score right at **chance** (~50%) on the bare task. They're physically time-blind.

## The fix: a continuous-time memory, in stdlib

The fix isn't a bigger model or fine-tuning. It's an external store that decays each tracked state's validity on **real elapsed time** — `validity = exp(−Δt / τ)`, where Δt is read from the timestamps and τ is the token's TTL — and injects that readout into the prompt. No parameters, no GPU, sub-millisecond. We ship it as [`ltm_sidecar.py`](https://github.com/a2o-labs/dt-stale/blob/main/ltm_sidecar.py): a zero-dependency proxy you drop in front of Ollama. Send a normal request with a `temporal` block, and it computes the decay and injects it for you.

Two ablations make sure the *physical-time* signal is what's doing the work, not just "having a memory":
- Swap real Δt for a **token-step** decay (same mechanism, wrong axis) and the rescued models collapse — often *below* their bare score.
- Use a fixed τ instead of the per-state TTL and it degrades on mismatched TTLs.

Real time, and input-dependent τ, are both load-bearing.

## The surprise: models differ in whether they'll listen

Here's where it got interesting. The injected readout only helps if the model is actually *steered* by it. Across seven models:

| model | bare | +LTM | +wrong-memory | steered? |
|---|---|---|---|---|
| gemma3:4b | 50% | 50% | 50% | 🔴 unmoved |
| qwen3.5:2b | 50% | 81% | 0% | 🟡 partial |
| llama3.2:3b | 52% | **100%** | 0% | 🟢 yes |
| phi3.5 | 50% | 94% | 0% | 🟢 yes |
| gemma4:e2b | 90% | **100%** | 40% | 🟢 yes |
| gemma4:e4b | 77% | **100%** | 27% | 🟢 yes |
| gemma4:12b | 65% | **100%** | 0% | 🟢 yes |

The steerable models go to 93–100% with a correct readout — and get *dragged down* by a wrong one (which is the double-edged part: a model that trusts an injected status will also follow a buggy or stale one). But **Gemma-3-4b is unmoved**: under our prompt, every variant lands at exactly 50%. The external memory might as well not be there.

And then the kicker: **the entire Gemma-4 family reverses it.** e2b, e4b, 12b — all steered, all rescued to 100%. Whatever made Gemma-3-4b ignore an injected state readout, the next generation doesn't.

We're deliberately careful here: it's one prompt, one task, n=24, and vendor/size/generation are entangled — Gemma-3's flat result could even be an output-format quirk rather than "stubbornness" (the kind of control we flag as next-step, not a proven claim). So we're *not* declaring a new law. But it's a sharp, reproducible signal that **"injection-responsiveness" — will this model accept a cheap external correction at inference time? — is a real, model-dependent property that capability leaderboards don't measure.**

## Why this matters for edge deployment

On a constrained edge box you usually **can't** cheaply scale the model, but you **can** bolt on a millisecond external memory. So when you're picking a small model to serve a streaming, stateful workload — auth/session TTLs, sensor-calibration windows, cache freshness — *injection-responsiveness matters alongside raw capability*. A steerable small model behind the sidecar can be made time-current for free; an unmoved one can't be fixed this cheaply. (And the flip side belongs in the same sentence: a steerable model is only as correct as the memory you feed it.)

That's the whole study: one adversarial benchmark, one zero-overhead fix, and a probe for a deployability property nobody scores — run end to end on commodity rented GPUs for about thirty cents.

## Try it

Everything's in **[github.com/a2o-labs/dt-stale](https://github.com/a2o-labs/dt-stale)** — the benchmark, the cure + ablations, the drop-in sidecar, the raw run logs, and the longer write-ups ([`FINDING.md`](https://github.com/a2o-labs/dt-stale/blob/main/FINDING.md), [`DEPLOYABILITY-SCORECARD.md`](https://github.com/a2o-labs/dt-stale/blob/main/DEPLOYABILITY-SCORECARD.md)). Reproducing a model's row is one command against a local Ollama. We'd love to know how *your* model scores on injection-responsiveness — and whether the effect holds beyond TTL validity, on retrieval freshness and tool-result staleness, which is exactly where we're taking it next.

*— A2O Labs builds measurement + plumbing for cheap, sovereign, on-prem-deployable agent fleets.*
</content>
