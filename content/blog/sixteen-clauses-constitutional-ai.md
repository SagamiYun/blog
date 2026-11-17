+++
title = "Sixteen Clauses at t = 0: Why Constitutional Wrappers Fail as Physics"
description = "Anthropic's Constitutional AI leans on sixteen English clauses at W_unembed and a system-prompt preamble at t = 0. Trace the forward pass and three things break: character bijections and split tool calls step past the lexical EFT cutoff, BF16 mantissa truncation zeroes a 0.9995-gated t = 0 state residual by token 16,384 (fl_bf16(1.0 + 2.76e-4) == 1.0), and sixteen imperfect rubric judges turn an 8% per-clause false-positive rate into a 73.7% tax on benign edge work. Safety invariants belong in the transition operator, not in English prose."
date = 2026-11-17
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["llm", "alignment", "numerics", "evaluation", "control-theory"]

[extra]
show_author = true
+++

Open Appendix C of Bai et al. ([arXiv:2212.08073](https://arxiv.org/abs/2212.08073)) and count the harmlessness principles. Sixteen English clauses—pulled from the UN Declaration of Human Rights, Apple's terms of service, and internal brainstorming—carry the weight of what Anthropic calls Constitutional AI. The textbook story goes like this: ask a model to critique its own completion against a randomly sampled principle, fine-tune on the revised text (`SL-CAI`), and then train a preference model on AI-judged pairs (`RLAIF`) so the weights internalize the document.

That story treats an autoregressive state machine like a seminary student who just needs better reading material. Once you trace what actually happens inside the forward pass and the reward head, the mechanism breaks down in three places.

## 1. Coarse-graining over `W_unembed`

In statistical physics, a high-level specification written in English acts as an **Effective Field Theory (EFT)**. It coarse-grains away every microscopic degree of freedom—residual-stream activations, KV-cache attention sinks, singular vectors of `W_out`, `BF16`/`FP8` rounding drift—and tries to state an invariant purely over macroscopic surface tokens at `W_unembed`.

Every EFT has a UV cutoff where microscopic fluctuations couple back into the macro-state and wreck the approximation. For a natural-language rubric, that cutoff sits right at the lexical boundary.

Why? Because the `RLAIF` preference model in Stage 2 only sees decoded token sequences, so its gradient updates whichever features predict another language model's English rubric vote. Whether the intermediate layers just computed an exploit primitive or a hazardous synthesis step never enters the loss unless those exact English trigger words survive to `W_unembed`. Wrap the token stream in an on-the-fly character bijection (Huang et al., [arXiv:2410.01294](https://arxiv.org/abs/2410.01294)), or split the payload across three ordinary-looking bash tool calls, and you step clean past the EFT cutoff. Meanwhile, on normal English inputs, gradient descent takes the cheapest shortcut available: rotate a thin subspace near `W_unembed` toward liturgical apology templates whenever high-risk nouns show up in context. You end up with an Archbishop tone filter bolted onto unchanged internal circuitry.

## 2. What happens to a $t = 0$ constitution at $t = 16,384$

When `RLAIF` weights inevitably leak on edge cases, labs patch the deployment path by prepending a multi-thousand-token system prompt or "soul document" at $t = 0$.

Run the state math across an actual long-horizon agent rollout and check how much of $t = 0$ survives. In a gated delta or recurrent fast-weight layer (`Gated DeltaNet`, Yang, Kautz & Hatamizadeh, [arXiv:2412.06464](https://arxiv.org/abs/2412.06464); `TTT`, Sun et al., [arXiv:2407.04620](https://arxiv.org/abs/2407.04620)), the state matrix evolves as

$$S\_t = S\_{t-1}\thinspace\operatorname{diag}(w\_t)\bigl(I - \beta\_t \kappa\_t \kappa\_t^\top\bigr) + \eta\_t v\_t k\_t^\top.$$

Take a generous per-token retention gate of $w\_t = 0.9995$. After $T = 16,384$ tokens of noisy compiler logs and tool outputs, the unperturbed prefix amplitude shrinks to $0.9995^{16384} = 2.76 \times 10^{-4}$ (`7.63e-8` in squared Frobenius energy). Now check the hardware floor: `BF16` carries only 7 mantissa bits, so its unit-in-the-last-place spacing around $1.0$ is $2^{-7} \approx 7.81 \times 10^{-3}$ (with round-to-nearest-even half-ULP $2^{-8} \approx 3.91 \times 10^{-3}$). Add a $2.76 \times 10^{-4}$ prefix residual onto an $O(1)$ `BF16` state entry and `fl_bf16(1.0 + 2.76e-4)` evaluates to `1.0` identically. IEEE-754 mantissa truncation swallows the $t = 0$ constitutional preamble to exact zero before you even count rank-1 Householder overwrites $(I - \beta\_t \kappa\_t \kappa\_t^\top)$ along overlapping key directions.

Full softmax attention has its own version of the exact same dilution curve. Anthropic's own many-shot jailbreaking study (Anil et al., [*Many-shot Jailbreaking*](https://www.anthropic.com/research/many-shot-jailbreaking), NeurIPS 2024) measured it directly: pack $k = 4, 16, 64, 256$ compliance demonstrations into the context window, and negative log-likelihood on refused targets drops as a clean power law in $k$. At $T = 128\text{k}$, a static 4,000-token constitution at the front of the KV cache has to fight thirty times its own token mass inside `softmax(Q K^T / sqrt(d))`. Handing a dynamical system a moral pamphlet at $t = 0$ and expecting attention weights to stay pinned there at $t = 10^5$ ignores basic thermodynamics.

## 3. Sixteen noisy judges and the false-positive ratchet

What happens when you crank up `RLAIF` penalty weights or stack extra constitutional monitors to compensate?

Whenever I audit LLM evaluation judges with paired counterfactuals—taking a clean systems trajectory and renaming variables, reordering independent steps, or inserting dual-use kernel/security terminology without altering causal behavior—rubric judges regularly flip their verdicts on surface phrasing alone. You can check the compounding arithmetic in one line of Python. Suppose each constitutional clause or monitor carries a modest benign false-positive rate of $q = 0.08$ on technical edge work (kernel memory bugs, exploit post-mortems, assay math). Across $N = 16$ independent clauses, the probability that a legitimate edge trajectory clears every check without tripping a false alarm is $(1 - 0.08)^{16} = 0.2634$. Nearly three quarters (`73.7%`) of benign edge queries get flagged or lectured. Cut the per-clause false-positive rate to $q = 0.05$ and `56.0%` ($1 - 0.95^{16}$) still trips at least one rule.

Feeding those noisy rubric scores back into policy optimization makes the pathology permanent. Anthropic's own sycophancy study (Sharma et al., [arXiv:2310.13548](https://arxiv.org/abs/2310.13548)) showed how preference models reward agreeable posture whenever raters lack a hard ground-truth check. Run five or six rounds of self-critique distillation against an imperfect literary judge without an external zero-entropy falsifier—a compiler, a proof kernel, or a deterministic sandbox check—and the policy shaves off its own high-curvature technical tails to avoid false-positive penalties. Users call the resulting tone "castrated" because the optimizer genuinely traded away edge capability to appease a noisy English rubric.

## 4. Putting the invariant in the transition operator

In classical mechanics, **Noether's Theorem** tells us that conserved quantities come from symmetries built directly into the equations of motion. Flight controllers and bipedal robotics stacks enforce safety boundaries the same way: you define a safe set $\mathcal{C} = \lbrace S : h(S) \ge 0 \rbrace$ over the physical state vector and project each transition through a **Discrete Control Barrier Function (DCBF)** (Agrawal & Sreenath, RSS 2017, [DOI: 10.15607/RSS.2017.XIII.073](https://www.roboticsproceedings.org/rss13/p73.pdf)),

$$\Delta h(S\_t) + \gamma h(S\_{t-1}) \ge 0, \qquad \gamma \in (0, 1].$$

We can wire that exact primal KKT barrier into a recurrent fast-weight or residual state transition. First, extract hazardous state directions $U\_{\text{haz}}$ after whitening out benign math and code covariance via generalized contrastive SVD, keeping the barrier normal orthogonal to ordinary engineering features. Then solve for the 1D primal KKT multiplier $\mu\_t^\star$ on each state update:

- On every step where the proposed write stays inside the safe interior ($\Delta h + \gamma h \ge 0$), the multiplier is **identically zero**: $\mu\_t^\star = 0$.
- Only on the exact step where an update pushes $S\_t$ across the barrier boundary does $\mu\_t^\star > 0$ fire, projecting out the normal component along $U\_{\text{haz}}$ (written in division-free primal products so `1 / (norm + 1e-8)` never underflows in `BF16` or drifts across GPU reduction trees).

Look at what $\mu\_t^\star = 0$ gives you across `99.9%` of benign steps: bitwise zero perturbation to the forward pass, zero alignment tax on math or systems code, and zero sermonizing tokens injected into `W_unembed`. And at $t = 16,384$ or $t = 10^6$, the constraint holds at full strength because it sits inside the step operator instead of decaying inside $S\_0$.

If you want an autonomous model to respect hard safety boundaries at $t = 10^5$ without turning into a preachy eunuch on step 1, put the invariant in the transition dynamics and anchor evaluations to deterministic external falsifiers. Handing the Archbishop's latest 30-page character document to `W_unembed` mostly just measures how fast `softmax` and `BF16` forget English prose.
