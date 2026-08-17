+++
title = "Flat where the data isn't"
description = "A regime where the optimizer is not the bottleneck and cannot become one — how to recognise it, why every optimizer-side fix I tried did nothing, and why the one data-side intervention that appeared to work had to be withdrawn."
date = 2026-08-18
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["optimization", "data", "research-process"]

[extra]
show_author = true
+++

There is a kind of hard problem where making the optimizer better is not a bad idea. It is a category error.

__The short version.__ Some regimes are flat in exactly the directions where the data is absent — not steep, not badly scaled, just unmeasured. In that regime every optimizer-side and objective-side fix I tried left the loss where it was, and the one data-side intervention that appeared to work turned out to have changed what "work" was measured against. The survivable lesson is diagnostic: look at the curvature before you reach for a better solver.

I spent part of a research programme mapping where optimization is difficult, and the regimes turned out to have genuinely different mechanisms. Some are landscape problems: there are bad places to get stuck, and the fix is geometric. Some are conditioning problems: the landscape is fine but the scales are so disparate that first-order methods crawl, and the fix is preconditioning or a different solver class. Some are arithmetic problems, where the signal you need falls below the precision the method carries.

And one is not an optimization problem at all, in a specific and testable sense: **the curvature is flat in exactly the directions where the data is absent.**

That regime is the subject of this post, because I think it is the one most relevant to how models are actually trained now, and because the most interesting thing I learned there was a claim I had to take back.

---

## The signature

The setting is the ordinary one: a large output space, an extremely skewed frequency distribution over that space, and a limited sample. Most of the output classes are rare. That much is familiar, and it is usually treated as a nuisance to be handled with better sampling or a loss re-weighting.

What made this regime distinct was not that rare classes are hard. It is what the second derivative looks like in their directions.

If a class does not appear in your sample at all, the model's predicted probability for it sits at essentially zero, and the curvature of the loss in that class's direction is essentially zero with it. The surface is not steep, not treacherous, not badly scaled. It is **flat**, and it is flat for the most boring possible reason: there is no measurement there.

The consequence is not subtle. A second-order method has nothing to invert. A first-order method has nothing to descend. An adaptive method has nothing to adapt to. The direction is not hard to move along — it is *unconstrained*, and any value is as good as any other as far as the objective can tell.

And in the sample I looked at, this was not a fringe condition affecting a tail of exotic classes. **The majority of the output space never appeared at all**, and a further slice appeared so rarely as to be indistinguishable from noise. The flat region was most of the space.

Once you can measure that, the regime becomes diagnosable rather than atmospheric. You are not in "the long tail is annoying". You are in "a large fraction of my parameters are being asked to learn from nothing".

---

## Everything I tried on the optimizer side did nothing

This is the part I want to be precise about, because it is measured and it is boring in exactly the way a result should be.

I ran the interventions you would expect: a second-order method applied where the conditioning was worst — the sort of thing that should shine if the problem is conditioning — objective-side smoothing, and a normalisation of the representation feeding the layer. Each of these is a reasonable response to a badly conditioned problem, and each of them is standard.

None of them moved the loss.

Two details are worth more than the headline. First, the expensive second-order intervention did produce a small improvement at its own step — and **the improvement did not survive handing control back to the ordinary optimizer.** Resuming normal training from the improved point returned the loss to where it had been, and in fact slightly worse than the plateau it started from. Whatever it had done was not a durable change in what the model knew; it was a local rearrangement that the ordinary dynamics undid.

Second, the smoothing interventions did exactly what smoothing does: they made the surface nicer. One of them improved a conditioning statistic substantially. The loss did not care. **You can make a landscape easier to walk on without making it lead anywhere new.**

That is the negative result, and it is solid: in this regime, the optimizer and the objective are not where the leverage is. Not "less leverage than data" — I am deliberately not saying that, for reasons that are the rest of this post — but flatly, no measurable leverage in the experiments I ran.

---

## The claim I had to withdraw

If the deficit is informational, the obvious move is to fix the data. So I did the obvious thing: I built a version of the training set that over-represented the rare classes, and trained on it.

The loss dropped substantially. Against a second-order intervention that had barely moved anything at enormous cost, the comparison was dramatic. I had a headline: the data-side intervention beats the optimizer-side intervention by a large factor.

I did not ship it, and the reasons are the most useful thing in this post.

**The over-represented set contained no new information.** It was built by duplicating existing rows. The set of distinct observations was *identical* to the baseline — same inputs, same targets, a large fraction of the new file being literal copies. It changed the weighting of the objective and nothing else. But the deficit I had just diagnosed was informational: those directions are flat because nothing was ever observed in them. Duplicating a row that does not contain an observation of a rare class cannot create one. The intervention was, by construction, incapable of addressing the thing I said it addressed.

**And the two arms were not evaluated on the same thing.** Each arm was scored against a sample drawn from its own training distribution, and one of those distributions had been deliberately re-weighted. So the "improvement" is equally consistent with the model having successfully fit the up-weighted duplicates — a model doing well on a distribution that was altered in its favour. There was no common yardstick. There was also one seed per arm and no held-out split, either of which alone would be disqualifying.

**And the conditioning story, which I had been about to use as mechanistic support, was mixed.** The worst-case statistic improved, which is what I had looked at. The typical-case statistics got *worse*. I had reported the one that agreed with me.

So the ratio was withdrawn as non-commensurable. Two numbers measured against two different distributions do not form a ratio, and no amount of effect size repairs that.

What survives is the negative half — every optimizer-side and objective-side intervention left the loss where it was — and one sentence that I now think is the sharpest thing the episode produced:

> **The only arm that moved the loss was the only arm whose evaluation distribution changed.**

---

## Rows are not information

Here is why I think this matters beyond one experiment, and it cuts against the enthusiastic version of "data matters" as much as it cuts against optimizer-tuning.

The lesson is not *data beats optimization*. The lesson is that these are answers to different questions, and that most of the popular data-side moves are not on the side they appear to be on.

Consider what the standard interventions actually do to the information content of a training set:

- **Duplication and over-sampling** change the objective's weighting. New rows, no new observations. If a class was never observed, it is still never observed.
- **Loss re-weighting** is the same operation without the disk cost. It says the existing evidence matters more. It does not produce evidence.
- **Temperature and label smoothing** change the shape of the target. They can help optimization. They add nothing about the world.
- **Augmentation** is the interesting case, and it is genuinely different in kind: it encodes an invariance you believe, which *is* information — supplied by you rather than by the data. It is only as good as the belief.

Only the last of these can touch a flat direction, and only if the invariance you assert happens to be true.

The uncomfortable corollary is that a large fraction of what gets called "data work" is objective engineering wearing a data costume. It is often useful. It is not the thing that fills a flat direction. And because it frequently *does* move a number, it is easy to mistake for the thing that fills a flat direction — which is precisely the error I nearly published.

---

## What would actually count

If the diagnosis is that some directions are flat because they contain no observations, then the interventions that can help are the ones that change what has been observed:

- collecting data that covers the absent region, which is expensive and is usually the answer;
- transfer, where the missing structure is imported from a setting where it *was* observed;
- an assumed invariance strong enough to constrain the flat directions, held honestly as an assumption;
- or accepting that the region is unlearnable at this sample size and changing the parameterisation so that you are not carrying parameters you cannot fit.

That last option is underrated and unglamorous. If a large part of your output space cannot be estimated from the sample you have, the honest response may be to stop pretending it can be — to tie those parameters together, back them off to a prior, or fold them into a coarser structure — rather than to keep them free and hope the optimizer finds something.

None of these are optimizer choices. That is the point.

---

## How to tell which regime you are in

The practical value of this, if there is any, is diagnostic rather than prescriptive.

Before reaching for a better optimizer, it is worth asking whether the direction you care about has any curvature at all. If it does and the scales are bad, you have a conditioning problem and the standard toolkit applies. If it does and the signal is smaller than the arithmetic your method carries, you have a precision problem and the fix lives in the numerics. If the curvature is essentially absent, you have a coverage problem, and every hour spent on the first two is an hour spent on a question the data cannot answer.

The failure mode I want to warn about is not choosing wrong. It is choosing without looking — and then being rescued by an intervention that appears to work because it quietly changed what "work" was measured against.

---

## Limits

One programme, one setting, a small model at a small scale. The interventions I ran are the obvious ones, not an exhaustive sweep; "no measurable leverage in what I tried" is weaker than "no leverage exists", and I do not claim the stronger version. The flat-direction diagnosis is a statement about a sample and a vocabulary, and how large that region is in any particular real training run is an empirical question I have not answered at scale.

What I am confident about is narrower and, I think, still worth saying: the regime exists, it is diagnosable by looking at curvature rather than at loss curves, standard optimizer-side and objective-side interventions did nothing in it, and the intervention that looked like it worked did not survive being asked what it was measured against.

I nearly published the version of this post with the impressive number in it. The number was real. The comparison was not.

---

*This post reports no experimental value, states no formula, and does not identify the subject matter of any manuscript under review.*
