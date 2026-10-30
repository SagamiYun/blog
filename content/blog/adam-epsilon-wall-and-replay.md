+++
title = "The ε in Adam: a wall you can predict, a row you can't replay"
description = "Two new papers about the smallest number in every Adam config. In a clean toy problem, ε sets a wall for rare directions that one formula predicts. In a small real transformer, the obvious arithmetic for what ε does to one rare token's row is off by about ten times."
date = 2026-10-30
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["optimization", "adam", "numerics", "pre-registration", "paper"]

[extra]
show_author = true
+++

Every Adam config you've ever copied has a line like `eps=1e-8`.

Nobody tunes it. It's there so you never divide by zero, and that's usually the end of the
conversation.

Two papers went up on arXiv this week, and both are about that number. Not about Adam in
general: about what one small constant does to the *rare* things a model is trying to learn,
rare directions in the data and rare tokens in the vocabulary. They're on the
[Paper](@/paper/_index.md) page now. This post is the version with most of the Greek letters
taken out. (The precision-wall one has already been called art slop once. Fair. There are a
lot of Greek letters. 😅)

**The short version**

- **ε is not only a guard.** Wherever a weight's squared-gradient average is small next to it,
  ε is a real part of Adam's denominator and it shortens the step. Rare things are where that
  happens.
- **In a clean toy problem, it sets a wall you can predict.** Past a certain amount of skew in
  the data, Adam stops recovering the rarest directions within its step budget, even though
  nothing is wrong with the loss landscape. One formula, with one constant fitted on four small
  cases, lands within 0.45 of the observed wall on 16 of 16 held-out cases.
- **In a small real transformer, the obvious arithmetic gets its effect wrong.** The natural way to
  reason about ε for one rare token's embedding row is to replay the same gradients through a
  different ε. We tested that against real runs, with the rule for "wrong" written down first.
  At four orders of magnitude it is wrong on every seed registered for the test: the real row
  keeps about 9 to 11 times more of its movement than the replay predicts.

## What ε actually does

Adam keeps two running averages per weight, one of the gradient and one of the squared
gradient, and moves the weight by

$$w \leftarrow w - \alpha \frac{\hat m}{\sqrt{\hat v} + \epsilon}$$

For a weight with big, regular gradients, the square root in the denominator is enormous next
to 10⁻⁸, and ε might as well not be there. For a weight whose gradients are rare or tiny, like
the output row of a token that shows up four times in a whole corpus, the square root can get
small enough that ε is a real share of the denominator. Raise ε and that row's steps shrink.

That's the intuition. The two papers push on it from opposite ends.

## Paper 1: the precision wall

[The Precision Wall: An Optimizer-Dependent Boundary for Optimization under Power-Law Measurement Spectra](https://arxiv.org/abs/2610.40485)

The setup is a deliberately clean toy: recover a low-rank matrix from linear measurements. The
classic theory assumes the measurements are isotropic, every direction equally represented.
Real data isn't like that. Token frequencies, user–item interactions and sensor spectra all
fall off as power laws. So the paper gives the measurements a power-law spectrum with a single
knob, s. The bigger s is, the harder the data starves the rare directions.

The interesting part is what *doesn't* go wrong. The loss landscape stays clean: no spurious
local minima to get stuck in. Adam fails anyway. At low skew it recovers the matrix in about
2,000 steps. At moderate skew it slows down by 3 to 10 times. Past a sharp threshold
$s^\ast$, it fails to recover the rarest directions within a 60,000-step budget.

The paper's claim is that this wall is **numerical, not geometric**. At the solution, the
curvature along the rarest directions shrinks quickly as skew grows. Once it drops below the
optimizer's working precision (for Adam, the floor of its denominator, set by ε), the gradient
signal in those directions drowns in normalisation noise. Set curvature equal to precision and
you get a closed-form estimate of where the wall sits:

$$s^\ast \approx \frac{\log(1/\epsilon) - \log V}{\log(VD)} + \delta$$

Here V is the size of the matrix, D its rank, and δ a lag: the overall error only crosses the
failure line after the error in the rarest direction has grown big enough to dominate it.

The test that convinced me: δ was fitted once, on four small configurations, and then frozen.
On a registered 16-cell grid of larger problems (V from 64 to 512, rank from 4 to 32), the
predicted wall landed within 0.45 of the observed one in all 16 cells, and within 0.15 in 9 of
them. Doubling the rank, or doubling the size, shifted the wall by the predicted amount
(within 0.35) in 12 of 12 pairs each.

Two more results changed how I think about optimizers. First, across eight optimizers, there
are three different kinds of wall:

| optimizer | what sets the wall |
|---|---|
| SGD, Momentum | conditioning of the problem |
| Adam, RMSProp | the precision floor of the denominator |
| SignSGD, Lion | sign quantisation |

Shampoo, which you might expect to beat diagonal Adam, walls *earlier*, at
$s^\ast \approx 0.44$, because its inverse-fourth-root preconditioner amplifies the floor noise
by $\epsilon^{-1/4} = 100$.

Second, the practical one: **you can't buy your way past the wall with a smaller ε.** Down to
10⁻⁸, ε really is the lever: going from 10⁻⁴ to 10⁻⁸ pushes the wall out by 2.58 and 1.96 units
of skew in the two configurations tested, where the formula says 2.21 and 2.66. Right size, not
right to the decimal. But four more decades, down to 10⁻¹², move it by less than a tenth of a
unit. Adam generates its own floor: fast modes oscillating at the edge of stability leak
gradient into the rare ones, which works out to an effective floor of about 4.8 × 10⁻⁹ at a
learning rate of 10⁻². The default 10⁻⁸ sits right at the knee where the hyperparameter hands
control over to Adam's own dynamics.

What it doesn't show, by its own account: the formula fails at rank 2, where the wall comes about
one unit later than predicted. The grid tests Adam at one ε and one learning rate. And the
paper's back-of-the-envelope number for a real language-model output head, a wall around
s ≈ 1, which is roughly where Zipf-shaped token frequencies live, is an untested extrapolation
across three decades of vocabulary size, and about half of that number is the fitted lag δ.
It's a direction, not a result.

## Paper 2: replaying the same gradients at a different ε

[Replaying the Same Gradients at a Different ε: A Registered Test of the Fixed-Trajectory Account of Adam's ε for One Rare Row](https://arxiv.org/abs/2610.38169)

That last caveat is where the second paper starts. No toys this time. Take a small causal
transformer (6 layers, width 512, a 32,000-token vocabulary), train it on WikiText-103, and
watch one row of the output embedding: the row of a token that occurs **four times** in the
whole corpus. Call it the probe row.

Raise Adam's ε and the probe row moves less. The natural explanation is arithmetic: bigger
denominator, smaller steps. If that's the whole story, you should be able to *compute* the
effect without training anything new.

So that's the test. While a run trains, it also pushes the probe row's own gradients, the ones
it actually saw, through a second Adam state that differs only in ε. That's the replay: same
data, same trajectory, different constant, exact arithmetic. If the arithmetic account is
complete, the replay predicts how far the row moves when a real run uses the new ε.

Before the test runs, the rule for when the replay counts as **wrong** was written down. Then
real runs at the higher ε were scored against it.

At four orders of magnitude (ε from 10⁻⁸ to 10⁻⁴), the replay is wrong on every one of the
three seeds registered for the test. The real row keeps **8.9 to 11.4 times** more of its
movement than the replay predicts. With a full-softmax output head, scored separately as a
second instrument, it's 5.0 to 7.7 times. At three orders of magnitude, tested with the main
head only, the replay is *not* counted wrong, by narrow margins, and two extra seeds registered
after that result follow the same pattern.

Then the paper takes the change apart, with real runs rather than replays:

- **Raise ε for the probe row alone:** that's enough to reproduce the row's change. So ε really
  is the lever.
- **Raise ε for every other parameter and leave the probe row alone:** the row still moves part
  of the way. The rest of the network is in the loop.
- **Leave ε alone and give the probe row a matched learning-rate change instead:** the replay
  mispredicts that too, in the same direction.

That last one is the punchline for me. The miss keeps its sign even when the denominator isn't
touched, which suggests the problem is not specific to ε (one learning-rate factor per seed was
tested, and one row). For this row, what fails is the move of *holding the trajectory fixed*:
reasoning about one row's step size as if the rest of training would have happened the same
way.

Which part of the trajectory the replay misses, the paper doesn't settle, and it says so. It's
one row, one model family, one corpus and one batch size, and it claims no rates. (A second,
wider model gets its own registered tests in the paper, reported separately and never pooled
with this one.)

## My take

Read side by side, the two papers say one consistent thing from two ends.

The toy paper says ε is part of the *physics* of rare directions. There's a wall, it's set by
precision rather than by the landscape, and in a clean problem one formula with one fitted
constant puts it in the right place. The transformer paper says that inside a real run,
per-update arithmetic is not a safe way to reason about what ε does to a rare row: at four
decades it's off by about ten times, and which part of the trajectory it misses is still open.

Those don't contradict each other. The wall formula is a balance condition, curvature against a
floor, checked against fresh runs at every setting. It doesn't replay anyone's gradients. The
replay does, and that's the part that failed.

What I'd do differently because of this:

- **Stop treating `eps` as a free default when the long tail matters.** Neither paper hands you
  a better value. Both say it's a lever, not a guard.
- **Don't expect `eps=1e-12` to rescue the tail.** At least in the toy setting, below 10⁻⁸
  Adam's own floor takes over.
- **When you want to know what a knob does, run the counterfactual.** A replay is cheap, and
  it's your intuition written down as code. That makes it worth testing, not trusting.
- **Write down what "wrong" means before you look.** The three-decade result is a "not wrong,
  narrowly". Without a rule fixed in advance, that kind of result quietly turns into
  "consistent with" in the write-up.

## How these got made

Same as the [exit-rule post](@/blog/shipped-exit-rule-picks-good-steps.md): the criterion
first, the runs second, and the write-up in the order the rules were registered. The replay
paper prints every number in its main text from a registry row, and its appendix says plainly
that language-model agents, directed by the authors, drafted the text and wrote the scripts
that turn those rows into numbers. That's how I work on most things now. The agents do the
typing; the ledger decides which numbers get printed.

Both papers are free to read: [the precision wall](https://arxiv.org/abs/2610.40485) and
[the replay test](https://arxiv.org/abs/2610.38169). If you train anything with a long tail
(tokens, classes, users), I'd like to hear whether your rare rows behave like this one.
