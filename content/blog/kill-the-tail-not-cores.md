+++
title = "Kill the tail, not the cores: profiling the verifier under RL-with-verifiers"
date = 2026-06-20
description = "As RL-with-verifiers scales, the Lean verifier is both the reward source and the throughput bottleneck — a CPU/scheduling problem almost nobody benchmarks on commodity, on-prem hardware. We profiled it: on an 8-core box, ~4.5% of proofs run away and eat most of the single-thread wall, and a tuned per-proof deadline beats adding cores. The honest-measurer story (including the claim we had to retract) is the point."
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["deployability", "on-prem", "lean", "ai4math", "rl", "eval"]

[extra]
show_author = true
+++

Everyone training models with formal-verifier rewards — Lean provers, spec autoformalizers, verified code — quotes their GPU budget. Almost nobody quotes their *verifier* budget. But in an RL-with-verifiers loop the Lean server is doing double duty: it is the **reward signal** *and*, increasingly, the **rate limiter**. You can only take a gradient step as fast as you can check the rollouts, and checking a Lean proof is a CPU-and-scheduling problem that no capability leaderboard measures — least of all on the commodity, on-prem hardware a lot of sovereignty-constrained teams actually have to run on.

So we measured it. The short version: **the bottleneck is a small tail of runaway proofs, and the cheapest fix is a per-proof deadline — not more cores.** The longer version includes a claim we had to walk back, which is really the whole point.

## The setup

A prebuilt [Kimina Lean Server](https://arxiv.org/abs/2504.21230) (Mathlib baked in, Lean 4.26) on **a single 8-core commodity box** — deliberately the cheap, on-prem end of the curve; the paper's own numbers come from a 60-core Xeon. The corpus is the first slice of `Goedel-LM/Lean-workbook-proofs` (29.7K verified Lean proofs). We sweep client concurrency `C`, capture **per-proof** latency, and report proofs/second, the latency distribution, and the timeout rate.

One detail turns out to matter enormously: every proof in that corpus ships with `set_option maxHeartbeats 0` — Lean's compute limit *disabled*. Hold that thought.

## The tail eats everything

Run it single-threaded and the median proof is *fast* — **p50 ≈ 2.3 s**. But the mean is many times that, because a handful of proofs never meaningfully terminate: they run until the client gives up. Quantified over 1,000 proofs:

- **timeout rate = 4.5%** — 95% bootstrap CI **[3.2%, 5.8%]**;
- those ~4–5% of proofs **consume ~52% of the single-thread wall-clock.**

So on an 8-core box you get ~0.07 proofs/s single-threaded, and most of that "second" is spent waiting on proofs that were never going to finish. For an RL loop checking thousands of rollouts per step, that tail is the whole ballgame.

(How noisy is that 4.5%? At n=100 — a tempting sample size — it isn't trustworthy: ten disjoint 100-proof blocks ranged **0%–7%**, and the bootstrap CI is a wide **[1%, 9%]**. You have to go to n≈1000 before the tail rate is a number you can quote. We almost shipped the n=100 point estimate as a headline; don't.)

## Two cheap levers, both measured

The corpus's `maxHeartbeats 0` is what *lets* those proofs run away — so the two fixes are obvious in hindsight, and both are far cheaper than buying cores:

**1. A per-proof deadline.** Cut any proof off at 30 s (instead of letting it burn a multi-minute client timeout) and single-thread throughput goes **0.069 → 0.158 proofs/s — a 2.3× win**, on one core, for zero infrastructure. Tighter deadlines pay more (10 s → 0.26), trading recall on genuinely-slow proofs for throughput.

**2. A finite `maxHeartbeats`.** Set Lean's compute budget to a finite 200000 and runaway proofs fail *fast, in-kernel* — the timeout rate drops to **0** and peak throughput across the sweep roughly **doubles (≈0.18 → ≈0.34 proofs/s)**. This one isn't free, and we say so: pass-rate slips **96% → 93%**, because ~3 percentage points of *legitimately* expensive proofs need more than 200000 heartbeats and now get rejected. It's a knob, not a free lunch — tune the budget to your tolerance.

The punchline that reframes the whole exercise:

> **One thread with a 30 s deadline (0.158 proofs/s) ≈ the four-REPL pool (0.178 proofs/s).**

The gap you'd be tempted to close by quadrupling REPLs was *mostly the tail*. Kill the tail and one core nearly catches a four-way pool. With the tail removed, the concurrency curve is clean: near-linear to ~4 REPLs, a plateau at 4–6 (~0.34 proofs/s on 8 cores), and an honest **regression at 7** as the box over-subscribes. The deployable rule is `MAX_REPLS ≈ cores/2–¾`, never `= cores`.

## The part we got wrong

The first cut of this write-up claimed our per-core throughput was "in the same ballpark" as the paper's. It wasn't — that comparison quietly used **different denominators** (our number per-REPL, the paper's per physical core). On a consistent basis the commodity box is **~1.7× below** the paper per core after removing the tail, ~3.2× below as-corpus, and ~12× below at a single REPL. An external review caught it; we retracted the "same ballpark" line in place rather than letting a flattering-but-wrong number stand.

That correction *strengthens* the actual thesis — commodity on-prem verification is slow per core **and** saturates early, which is exactly why the tail and the deadline matter so much — but the discipline is the point. The only durable moat for a measurement project is being the neutral measurer, and the fastest way to lose it is to round a comparison in your own favor. (One caveat we kept: the 1.7× compares *our* tail-removed peak to the paper's as-reported number; the paper doesn't state its timeout/heartbeat policy, so its basis is unknown.)

## So what

These aren't just numbers in a post — they're the **defaults in two RL environments** we shipped to the Prime Intellect Environments Hub, where the reward is a real verifier rather than an LLM judge:

- [**`kit-kyo/lean-verifier`**](https://app.primeintellect.ai/dashboard/environments/kit-kyo/lean-verifier) — write a Lean proof; reward = Lean accepts it (with a structured `sorry`/`sorryAx` gate, because `exact sorryAx _` is a clean reward-hack against a naive severity-only check).
- [**`kit-kyo/spec-faithfulness`**](https://app.primeintellect.ai/dashboard/environments/kit-kyo/spec-faithfulness) — write a Verus specification; reward = a *differential* check (the spec must accept the correct implementation and reject the buggy ones).

Both default to a finite `maxHeartbeats` and a per-proof deadline because of the numbers above, and a thin stdlib gateway applies the same two levers in front of any Kimina server. The verifier-throughput study and the environments are halves of one bet: **the leverage in RL-with-verifiers, on the hardware most teams can actually own, is in the verifier infrastructure — and the first thing to fix there is the tail.**

*Honest limits: single backbone, single-run sweep (the tail rate is the one quantity we bootstrapped a CI for); Lean/Mathlib pinned by a movable image tag; the deadline-30 s number is a post-hoc cut over real captured latencies. The verifier-agnostic claim is only half-earned until the second backend (Verus) has the same treatment — that's next.*
