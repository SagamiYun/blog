+++
title = "The Adam elevator: one recipe, three experiments, and three conclusions we almost published by mistake"
description = "A three-part study on rescuing Adam from proven spurious minima with certified SDP 'elevator' jumps: after a jump, leave Adam's state alone; escape traps with a conic solver, not a generic NLP one; and watch the traps themselves vanish past D≈16. Three times we almost published the wrong conclusion — and each time a measurement decision caught it."
date = 2026-08-04
[taxonomies]
tags = ["optimization", "sdp", "phase-retrieval", "adam", "experiments", "honest-measuring"]
[extra]
katex = true
+++

__TL;DR.__ Over three experiments we built and stress-tested the *elevator pipeline* — the recipe for rescuing Adam when it gets stuck in a spurious minimum: run to stagnation, lift the polynomial subproblem to a convex SDP, jump to the certified solution, resume training. **Act I:** after any discontinuous jump, Adam's optimizer state doesn't matter — across MNIST MLP ($n=56$) and TinyLlama-1.1B LoRA ($n=5$, ≈1.6 USD of A100 time), no reset strategy helps (best $p = 0.54$), and the one recipe that matters is *never* zero $v_t$ alone ($\alpha/\varepsilon \approx 10^5$ explosion). Our first "significant" result ($p=0.015$) was an RNG-state-leakage bug in our own sweep, fixed with one line ($p \to 0.67$ at the same seeds). **Act II:** when Adam is genuinely trapped at a true critical point ($\Vert\nabla L\Vert \sim 10^{-16}$), the SDP escapes 35/35 stuck cases with a rank-1 certificate — *if* you use a certified conic solver; our first solver (generic NLP) failed 4/10 at $D=8$ and we almost published a theory limitation that doesn't exist. **Act III:** the traps have a dimension limit — true-critical stuck rate 17% → 33% → 40% → 7% → 0% across $D = 2 \to 32$: the first measured saddle-point crossover on a problem with proven spurious minima. The through-line isn't the pipeline; it's that three times we almost published the wrong conclusion, and three times a measurement decision — a same-$n$ control, a solver-class check, a criticality criterion — caught it.

| act | question | headline | the trap we almost fell into |
| --- | --- | --- | --- |
| I | What happens to Adam's state after a jump? | Nothing — do nothing (never zero $v_t$ alone) | an RNG bug manufactured $p=0.015$ |
| II | Can an SDP escape a proven trap? | 35/35 with a certified solver | SLSQP "proved" the relaxation wasn't tight |
| III | Do traps survive in high dimensions? | Crossover: 17→33→40→7→0% | a fragile $n=10$ peak, a mismatched $m/D$ ratio |

---

## Act I: The jump — and the bug that almost told us otherwise

Elevator-style pipelines hand Adam a far-away parameter vector mid-training. What should happen to $m_t$ and $v_t$ — the running statistics Adam uses to normalize its steps? We tested six strategies × three jump magnitudes on MNIST, paired across $n=56$ seeds. The first answer was a clean win: soft-decay $v_t$ recovered 26% faster, $p=0.015$. We almost shipped it.

Our own replication stopped that cold. The sweep loop evaluated conditions *sequentially* per seed; the recovery phase consumed the global RNG, so each condition's minibatch stream was a continuation of the previous one's — *shared randomness within pairs*, which a paired $t$-test counts as explained variance, inflating the statistic. One line of reseeding per (seed, condition), and at the *same* $n=20$: $p = 0.015 \to 0.67$. The effect was never there.

The clean answer, after the fix:

- **No reset strategy significantly helps** — C5 (full reinit): $p=0.54$, $d=-0.08$ (95% CI $[-0.35, +0.19]$, excluding any practically meaningful effect); C7 (soft decay): $p=0.93$. Same on TinyLlama-1.1B + LoRA (all $p > 0.16$; the bug's signature — C7's $d$ flipping $-0.34 \to +0.59$ — reproduces there too).
- **$v_t$ reconverges in ~1000 steps; the loss does not** (still ~100× above the no-jump control at step 2000). The null is "no intervention changes the trajectory," not "Adam heals itself."
- **The one hard rule:** zeroing $v_t$ alone turns the step into $\alpha/\varepsilon \approx 10^5$ — loss to $10^7$ in one step. The naive recipe is the catastrophic one.

## Act II: The elevator — and the solver that almost fooled us

The companion question: does a jump help when Adam is stuck in a *real* trap? Phase retrieval's quartic is the cleanest test bed — spurious minima are mathematically proven there. We built the full pipeline: Adam to stagnation → PhaseLift SDP → jump to the top eigenpair → resume. At $D=8$, $m=16$, our first SDP solver (SLSQP, a generic nonlinear optimizer with the PSD constraint hacked in) failed 4/10 instances — no rank-1 solution ($\lambda_{\max}$ at 0.77–0.96), recovered points 0.34 away from the truth. Our first instinct was to report it as a *theoretical* result: "the relaxation isn't tight at $m=16$."

That paper would have been about a limitation that doesn't exist. SLSQP doesn't know what the PSD cone is. The certified conic solver SCS, on the *same ten seeds*: 10/10 recovered, dist $< 2\times10^{-6}$, $\lambda_{\max} = 1.000000$. Same problem, same data — the relaxation was tight all along.

With the right solver, the elevator is boring in the best way: **35/35** stuck cases escaped with a rank-1 PSD certificate ($L=0$, dist $<10^{-4}$), across $D \in \\{2,4,8,16,32\\}$, in 0.1–5 s per instance. The fair baseline — random restart, 3 tries — gets **33/35**. So the elevator is not uniquely better at *escaping*; its advantage is the certificate (proof of global optimality) and determinism. And in the regimes where the relaxation genuinely isn't tight (non-identifiable measurements), random restart wins cases the SDP can't touch. We wrote all of that down.

## Act III: The crossover — and the fragile peak we didn't claim

If traps are real but high-dimensional landscapes are "mostly saddles," where do the traps die? We scaled $D = 2 \to 32$ (130 identifiable instances, $m \geq 2D-1$) and measured the true-critical-point stuck rate — the first measurement of the saddle-point crossover on a problem with *proven* spurious minima:

17% ($D{=}2$) → 33% ($D{=}4$) → 40% ($D{=}8$) → 7% ($D{=}16$) → 0% ($D{=}32$).

The collapse is robust (Fisher: $D{=}4$ vs $D{=}32$, $p = 0.001$; and at fixed $m = 3D$ the true-trap rate is 30% → 0% → 0%). The peak is not: $D{=}8$ has $n=10$ seeds ($p = 0.0496$ vs $D{=}16$ — one seed from vanishing) and sits on the study's lowest $m/D$ ratio, so we say "peaks at $D{=}4$–$8$, vanishes no later than $D{=}16$" — not "the crossover is exactly at $D{=}8$." Two more honest notes: the finding only exists because we separated true critical points ($\Vert\nabla L\Vert < 10^{-6}$) from slow-convergence plateaus ($\sim 10^{-4}$) — at $D{=}16$, 13 runs were "stuck by loss" but only 2 were traps — and "saddle dominance" is the *theory's* explanation for our rates. We never computed a Hessian spectrum. Rates are data; mechanisms are inference, and the blog is where that distinction lives out loud.

## The recipe

For an elevator pipeline, all three acts converge on one line of specification:

1. Jump detector fires → **do nothing** to Adam's state. Warm, cold, and decayed states are statistically indistinguishable.
2. **Never** zero $v_t$ alone — that's the $\alpha/\varepsilon$ catastrophe.
3. If the point is a true trap, lift to SDP and solve with a **conic solver** (SCS, not SLSQP).
4. Past the crossover ($D \gtrsim 16$ on this problem class), Adam escapes on its own — the elevator is a low-to-moderate-dimensional tool.

## What we didn't test

The $D{=}8$ runs at $m = 3D/5D/8D$ that would confirm the peak; Hessian spectra (direct saddle evidence); more than 10 seeds at $D{=}8$; a true CLS-hard regime (Adam escapes our matrix-sensing attempts on its own); RL — where we *expect* reset to matter, because recurrent distribution shifts never let $v_t$ reach steady state.

## Takeaways

1. __Reseed the RNG per (seed, condition), or your p-values are fiction.__ Shared randomness between paired arms inflates paired tests. If you run optimizer comparisons in a loop, check your loop right now — this trilogy started because ours was wrong.
2. __A same-*n* control is the truth test.__ $p = 0.015 \to 0.67$ at identical $n$ proves the bug made the result, not the sample size.
3. __Conic problems need conic solvers.__ SLSQP failed 4/10 where SCS succeeded 10/10 on identical instances. A "non-tight relaxation" is a claim about your solver until proven otherwise.
4. __Baseline before you believe the pipeline.__ Random restart escapes 33/35 of the same traps at trivial cost. The elevator's value is certification, not escape power — say so, and the paper survives its reviewers.
5. __Classify criticality before you classify stuck.__ "Loss didn't drop in 4000 steps" is a timing observation; "gradient is $10^{-16}$" is a geometric fact. The crossover was invisible in the first metric and obvious in the second.
6. __The collapse is the claim; the peak is a hypothesis.__ Report each with its actual fragility — one seed ($p=0.05$) versus one order of magnitude ($p=0.001$). And when the mechanism is theory but the data is rates, say that sentence too.
