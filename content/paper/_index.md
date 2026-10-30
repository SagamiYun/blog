+++
title = "Paper"
weight = 2
template = "paper.html"
sort_by = "none"
transparent = false

[[extra.papers]]
title = 'The Precision Wall: An Optimizer-Dependent Boundary for Optimization under Power-Law Measurement Spectra'
url = "http://arxiv.org/abs/2610.40485"
summary = '''In low-rank matrix sensing of a rank-$D$ factor $U^\ast \in \mathbb{R}^{V \times D}$, replacing isotropic Gaussian designs with power-law measurement covariance $\Sigma = \mathrm{diag}(j^{-s})_{j=1}^V$ leaves the Burer–Monteiro landscape free of spurious local minima, yet division-normalised first-order optimizers stall above a critical exponent $s^\ast$. We trace this failure to a numerical precision wall. At the ground truth, the smallest non-gauge expected Hessian eigenvalue scales at leading order as $V^{-(s+1)}D^{-s}$. When this curvature drops below the effective denominator floor $\epsilon_O$ of optimizer $O$, normalisation noise overwhelms rare-direction gradients, yielding the leading-order boundary $s^\ast_O(V, D) = [\log(1/\epsilon_O) - \log V]/\log(VD) + \delta_O$, where $\delta_O$ is a metric-dependent detection lag. With $\delta_{\mathrm{Adam}}$ calibrated on four configurations and frozen, this formula predicts Adam's onset within $0.45$ across all 16 cells of a held-out grid ($V \in \{64,128,256,512\} \times D \in \{4,8,16,32\}$), separates fixed-$VD$ pairs, and distinguishes denominator-precision walls from conditioning and sign-quantisation walls. The approximation fails at $D = 2$, reflects a finite-$D$ spectral crossover, and saturates below $\varepsilon_0 = 10^{-8}$ at a dynamical floor.'''

[[extra.papers]]
title = 'Replaying the Same Gradients at a Different $\varepsilon$: A Registered Test of the Fixed-Trajectory Account of Adam’s $\varepsilon$ for One Rare Row'
url = "http://arxiv.org/abs/2610.38169"
summary = '''Adam divides every update by the square root of a running average of squared gradients plus a small constant, epsilon. For an output-embedding row whose token is rare, which we call the probe row, raising epsilon can be read as shrinking that row's steps by arithmetic alone. We test that reading directly. While a training run proceeds, we also divide the probe row's update by a different epsilon, using the run's own moment estimates; this replay is exact arithmetic on the gradients the run actually saw, so it holds the run's trajectory fixed. A rule for when the replay counts as wrong was written down before the runs.

We train a small causal transformer in a standard configuration. When epsilon rises by four orders of magnitude, the replay counts as wrong on each of the three seeds registered for the test: the probe row keeps 8.9–11.4 times more of its displacement than predicted with the main, sampled-negative head, and 5.0–7.7 times more with a full-softmax head scored as a second instrument. At three orders of magnitude, tested with the main head only, it does not, by narrow margins; a further two seeds, registered after this result had been committed and scored on their own, follow the same pattern. In separate real runs, raising epsilon on the probe row alone is enough to reproduce the row's change and raising it on every other parameter alone also moves the row part of the way — readings about the runs that do not rescue the replay; scaling the row's learning rate instead, with the denominator untouched, is mispredicted by the replay in the same direction.

This is one embedding row of one model family on one corpus; we make no claim about rates, about rows in general (other rows were read only as a panel on one trajectory) or about how the effect changes with model size.'''
+++
