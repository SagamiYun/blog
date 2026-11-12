+++
title = "Breaking Precision Walls in First-, Second-, and Zeroth-Order Optimizers: A Field Guide to Setting One Constant in Advance"
description = "Why the denominator constant eps in Adam, Shampoo, SOAP, and zeroth-order optimizers sets a sharp precision wall on rare power-law directions -- and how one constant set before step 1 breaks it across 68 first- and second-order walls and 88 zeroth-order walls."
date = 2026-11-09
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["optimization", "adam", "shampoo", "zeroth-order", "numerics", "pre-registration", "paper"]

[extra]
show_author = true
+++

<style>
:root {
  --tk-bg: #0b0b0c;
  --tk-card: #121214;
  --tk-cbar: #0e0e11;
  --tk-stage-radial: radial-gradient(120% 90% at 70% 35%, #161a24 0%, #0d0f15 55%, #08090c 100%);
  --tk-line: #232327;
  --tk-line-hover: #2e2e33;
  --tk-ink: #ece8e1;
  --tk-muted: #8d8a84;
  --tk-dim: #5c5a56;
  --tk-acid: #d4ff4f;
  --tk-teal: #5ad6c1;
  --tk-amber: #f4b75c;
  --tk-violet: #a996ff;
  --tk-red: #ef4444;
  --tk-green: #22c55e;
  --tk-serif: 'Instrument Serif', Georgia, serif;
  --tk-sans: 'Space Grotesk', 'Geist', system-ui, sans-serif;
  --tk-mono: 'JetBrains Mono', 'Geist Mono', ui-monospace, monospace;
}
.tk-card {
  background: var(--tk-card);
  border: 1px solid var(--tk-line);
  border-radius: 4px;
  overflow: hidden;
  margin: 28px 0;
  color: var(--tk-ink);
  font-family: var(--tk-sans);
  max-width: 100%;
  box-sizing: border-box;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 1);
}
.tk-card:hover {
  border-color: var(--tk-line-hover);
}
.tk-cbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px;
  background: var(--tk-cbar);
  border-bottom: 1px solid var(--tk-line);
  font: 500 11px/130% var(--tk-mono);
  color: var(--tk-muted);
}
.tk-cbar .state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tk-ink);
}
.tk-cbar .state i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tk-acid);
  box-shadow: 0 0 8px var(--tk-acid);
  display: inline-block;
}
.tk-cbar .state.flip-a i {
  background: var(--tk-red);
  box-shadow: 0 0 10px var(--tk-red);
}
.tk-cbar .state.flip-b i {
  background: var(--tk-amber);
  box-shadow: 0 0 10px var(--tk-amber);
}
.tk-cbar .hint {
  color: var(--tk-muted);
  margin-right: auto;
  font-size: 10px;
}
.tk-pill {
  appearance: none;
  background: #17171b;
  border: 1px solid var(--tk-line);
  border-radius: 3px;
  color: var(--tk-ink);
  font: 500 11px/120% var(--tk-mono);
  padding: 5px 8px;
  cursor: pointer;
}
.tk-pill:hover, .tk-pill.active {
  border-color: var(--tk-acid);
  color: var(--tk-acid);
  background: #191f12;
}
.tk-grid-2 {
  display: grid;
  grid-template-columns: 1fr 265px;
  background: var(--tk-stage-radial);
}
.tk-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.tk-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.tk-grid-override {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 12px;
  align-items: stretch;
}
.tk-tape {
  border-left: 1px solid var(--tk-line);
  background: rgba(0, 0, 0, 1);
  padding: 12px 14px;
  font: 500 11px/140% var(--tk-mono);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tk-scrubber input[type="range"] {
  appearance: auto !important;
  -webkit-appearance: slider-horizontal !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.12) !important;
  height: 6px !important;
  border-radius: 3px !important;
  outline: none !important;
  min-width: 70px;
}
.tk-scrubber {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 8px 10px;
  background: #0b0c10;
  border: 1px solid var(--tk-line);
  border-radius: 4px;
  font: 500 11px/120% var(--tk-mono);
}
.tk-fine-badge {
  padding: 4px 7px;
  border-radius: 3px;
  background: #191b1e;
  color: #7d8193;
  border: 1px solid #262a36;
  font-size: 10px;
  white-space: nowrap;
}
.tk-fine-badge.on {
  color: #ffd38a;
  border-color: #ffa830;
  box-shadow: 0 0 8px #ffb547;
}
.tk-egg-badge {
  display: inline-block;
  font-family: var(--tk-mono);
  font-size: 88%;
  color: var(--tk-acid);
  background: #121214;
  border-bottom: 1px dashed var(--tk-acid);
  padding: 1px 6px;
  border-radius: 3px;
  cursor: pointer;
}
.tk-egg-note {
  font-family: var(--tk-mono);
  font-size: 82%;
  color: #8fa8ff;
  margin-left: 6px;
}
@keyframes tk-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
.tk-degen {
  animation: tk-shake 120ms infinite;
}
@media (max-width: 740px) {
  .tk-grid-2, .tk-grid-override {
    grid-template-columns: 1fr;
  }
  .tk-grid-4, .tk-grid-3 {
    grid-template-columns: 1fr;
  }
  .tk-tape {
    border-left: none;
    border-top: 1px solid var(--tk-line);
  }
}
</style>

Open almost any training script in the wild that calls `Adam(params, lr=1e-2, eps=1e-8)` and look at that last argument: <span id="pw-egg-eps" class="tk-egg-badge" onclick="window.pwFlipDocstring && window.pwFlipDocstring()" title="Click to flip docstring vs. power-law truth">eps=1e-8 ⟲</span> <span id="pw-egg-eps-text" class="tk-egg-note">["term added to the denominator to improve numerical stability" -- click badge to inspect]</span>.

Nobody tunes it. People talk about `eps=1e-8` like it is a seatbelt for IEEE-754 underflow on step 1, and usually that is the end of the conversation. You leave it at $10^{-8}$, watch your training loss drop by four or five orders of magnitude, and assume the optimizer is doing its job.

On a power-law spectrum, that textbook story is flat-out wrong. When data covariance eigenvalues or feature frequencies decay across scales, `eps` is not a passive numerical safety guard. At `lr=1e-2`, `eta/eps` is a million. Depending on how that ratio interacts with the linear stability ceiling of the strongest direction, `eps` either pumps enough cross-term oscillation into $\sqrt{\hat{v}}$ to lock the tail on a self-generated floor, or turns the update on rare modes into unnormalized momentum descent with step $\eta / c$.

Average loss hides this completely. Why? Because when word frequencies in natural language or feature eigenvalues in vision decay as a power law $\lambda\_k = k^{-s}$, the first handful of head directions carry almost all of the objective energy. An optimizer can snap onto the top modes in a few hundred steps, drive the average loss down by six orders of magnitude, and still leave the rarest target direction untouched.

To measure that tail failure directly without being fooled by the head modes, we track the weakest target direction $q\_D$ across a family of problems indexed by the spectral decay exponent $s$. Turn up $s$, and the dynamic range between the strongest and weakest directions widens. At some critical slope $s^\star$, the optimizer runs out of step budget before it can recover $q\_D$ to within $5\\%$ ($0.05$) relative error. We call $s^\star$ the **precision wall**: the steepest spectral decay at which the optimizer still recovers the rarest direction in $T$ steps.

This field guide pulls together our three-paper sequence on what causes precision walls across first-, second-, and zeroth-order optimizers, how setting one constant in advance breaks them, and when the same equations tell you not to touch `eps` at all:

1. **Part I** ([arXiv:2610.40485](https://arxiv.org/abs/2610.40485), *The Precision Wall: An Optimizer-Dependent Boundary for Optimization under Power-Law Measurement Spectra*; companion post on [the Adam epsilon wall and replay](/blog/adam-epsilon-wall-and-replay/)) isolated the numerical precision wall across eight optimizers on power-law matrix sensing and showed how second-moment detection lag and the $\varepsilon$ floor stall rare directions.
2. **Part II** ([arXiv:2611.01868](https://arxiv.org/abs/2611.01868), *A Self-Generated Floor on Adam's $\varepsilon$: Evidence from Power-Law Matrix Sensing*; alongside our diagnostic note on [flat directions where the data is absent](/blog/flat-where-the-data-isnt/)) traced why shrinking $\varepsilon$ below $10^{-8}$ fails to move the wall: high-curvature modes oscillate near the adaptive edge of stability and leak gradient fluctuations into rare modes via measurement coupling, pinning $\sqrt{\hat{v}}$ at a self-generated dynamical floor.
3. **Part III** ([arXiv:2611.10730](https://arxiv.org/abs/2611.10730), *Breaking Precision Walls in First-, Second-, and Zeroth-Order Optimizers: One Constant, Set in Advance*) asks the natural follow-up question: can you push the wall back by switching to full-matrix second-order preconditioners (Shampoo, SOAP, Eigen-Adafactor), grafted preconditioners, or zeroth-order methods (Evolution Strategies, MeZO, sign-vector Adam)? The answer across all three families comes down to a single constant in the denominator, set before training begins.

---

## 1. How to Measure a Precision Wall (Without Being Fooled by Average Loss)

In [Part III](https://arxiv.org/abs/2611.10730), our primary testbed for coupled first- and second-order optimization is low-rank positive semidefinite matrix sensing in the Burer-Monteiro parameterization (Burer and Monteiro, 2005). Given ambient dimension $V$ and rank $D \le V$, we observe $m = \mathrm{round}(1.5\\,VD)$ symmetric Gaussian measurement matrices $A\_k \in \mathbb{R}^{V \times V}$ and scalar targets $b\_k = \langle A\_k, M^\ast \rangle$ of a ground-truth rank-$D$ matrix
$$M^\ast = Q\\,\mathrm{diag}\bigl(1^{-s}, 2^{-s}, \dots, D^{-s}, 0, \dots, 0\bigr)\\,Q^\top$$
rotated by a random orthogonal matrix $Q = [q\_1, \dots, q\_V]$. We fit a factor $U \in \mathbb{R}^{V \times D}$ starting from $U\_0 = 0.1\\,\mathrm{randn}(V, D)$ by minimizing the mean-squared sensing loss
$$\mathcal{L}(U) = \frac{1}{m}\sum\_{k=1}^m \bigl(\langle A\_k, U U^\top \rangle - b\_k\bigr)^2$$
for $T = 60{,}000$ full-batch steps in 64-bit floating point (`float64`), so hardware roundoff never muddies the denominator dynamics.

At $s = 0$, all $D$ active directions have unit eigenvalue and the problem is isotropic. As $s$ grows, the weakest target direction $q\_D$ carries eigenvalue $D^{-s}$ while $q\_1$ stays at $1$. At step $T$, instead of looking at $\mathcal{L}(U\_T)$, we measure the relative residual along $q\_D$:
$$e(s) = \frac{\\|(U\_T U\_T^\top - M^\ast)\\,q\_D\\|\_2}{D^{-s}}.$$
For each value of $s$ on a grid, we take the median (and mean) of $e(s)$ across five random seeds and read off the precision wall $s^\star$ by linear interpolation in $\log\_{10} e(s)$ at the $5\\%$ ($0.05$) threshold. On ungrafted Shampoo at damping $10^{-7}$ on $(V, D) = (12, 4)$, simply raising the step budget shifts that $0.05$ crossing from $3.53$ to $4.12$. Reading a table of 68 walls is dry, so you can drag the knob yourself below and watch how $e(s)$ hits the $0.05$ ceiling while the average loss sits flat on the floor.

<article class="tk-card" id="card-sstar-crossing">
  <div class="tk-cbar">
    <span class="state" id="s1-led"><i></i><b id="s1-status">STAGE 01 · 68 PRE-COMMITTED WALLS</b></span>
    <span class="hint">drag s-probe or budget slider · hold Shift for ×8 fine tune · double-click slider to reset</span>
    <button class="tk-pill active" data-s1-preset="14x5">(14, 5) Forecast Audit</button>
    <button class="tk-pill" data-s1-preset="12x4">(12, 4) Shampoo T→4T</button>
    <button class="tk-pill" data-s1-preset="24x8">(24, 8) Adam Rule</button>
    <button class="tk-pill" data-s1-preset="lag">Detection-Lag (+0.1841)</button>
  </div>
  <div class="tk-grid-2">
    <div style="position:relative; padding:14px; min-width:0;">
      <div style="margin-bottom:6px;">
        <div style="font:500 10px/120% var(--tk-mono); color:#8fa8ff; letter-spacing:1px;">
          ZERO-PARAMETER LAW · (η / c) · h_min(s) · T = ln 20 + ln e₀
        </div>
        <div style="font:italic 400 22px/115% var(--tk-serif); color:var(--tk-ink); margin-top:2px;">
          Why average loss lies &amp; where <em style="color:var(--tk-acid);">e(s)</em> crosses 0.05
        </div>
      </div>
      <canvas id="s1-canvas" width="560" height="270" style="width:100%; height:270px; display:block; cursor:crosshair;"></canvas>
      <div id="s1-beats-bar" style="display:none; align-items:center; gap:6px; margin-top:8px; padding:6px 10px; background:#14151d; border:1px solid #f4b75c; border-radius:4px; font:500 10px/120% var(--tk-mono);">
        <span style="color:var(--tk-amber); font-weight:700;">4-STEP LAG DECOMPOSER (#beats):</span>
        <button class="tk-pill active" data-s1-beat="0">Step 0: Raw ln 20</button>
        <button class="tk-pill" data-s1-beat="1">Step 1: +0.1841</button>
        <button class="tk-pill" data-s1-beat="2">Step 2: Secant ln e₀</button>
        <button class="tk-pill" data-s1-beat="3">Step 3: Per-run rate</button>
        <button class="tk-pill" data-s1-beat="4">Step 4: -ln ρ(F)</button>
      </div>
      <div class="tk-scrubber">
        <label style="display:flex; align-items:center; gap:6px; flex:1; min-width:160px;">
          <span style="color:var(--tk-muted);">BUDGET (T/T₀)</span>
          <input id="s1-budget" type="range" min="100" max="400" step="5" value="100" style="flex:1; accent-color:var(--tk-acid);">
          <b id="s1-budget-val" style="color:var(--tk-acid); min-width:52px;">60,000</b>
        </label>
        <label style="display:flex; align-items:center; gap:6px; flex:1; min-width:150px;">
          <span style="color:var(--tk-muted);">PROBE s</span>
          <input id="s1-sprobe" type="range" min="50" max="550" step="1" value="353" style="flex:1; accent-color:var(--tk-teal);">
          <b id="s1-sprobe-val" style="color:var(--tk-teal); min-width:36px;">3.53</b>
        </label>
        <span class="tk-fine-badge">SHIFT = FINE ×8</span>
      </div>
    </div>
    <aside class="tk-tape">
      <div style="color:var(--tk-muted); text-transform:uppercase; display:flex; justify-content:space-between;">
        <span>WALL TELEMETRY</span>
        <span id="s1-shape-tag" style="color:var(--tk-acid);">(V,D) = (14,5)</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#141418; padding:8px 10px; border-radius:4px; border:1px solid var(--tk-line);">
        <div>
          <div style="color:var(--tk-muted); font-size:10px;">MEASURED s*</div>
          <div id="s1-wall-meas" style="font-size:18px; font-weight:700; color:var(--tk-acid);">3.2725</div>
        </div>
        <div>
          <div style="color:var(--tk-muted); font-size:10px;">FORECAST</div>
          <div id="s1-wall-pred" style="font-size:18px; font-weight:700; color:var(--tk-teal);">3.3953</div>
        </div>
      </div>
      <div id="s1-tape-rows" style="display:flex; flex-direction:column; gap:5px; font-size:10px; color:#d8d5ce;"></div>
      <div style="margin-top:auto; padding-top:8px; border-top:1px dashed var(--tk-line); color:var(--tk-muted); font-size:10px;">
        Click <b>Detection-Lag (+0.1841)</b> above to scrub the 4-step offset decomposer on (14, 5).
      </div>
    </aside>
  </div>
</article>

---

## 2. Wall One (First Order, Adam): Flip Oscillation at $L = 38$ and the Rule $c = \eta h\_{\max} / 36$

In [our earlier post on the Adam epsilon wall](/blog/adam-epsilon-wall-and-replay/), we looked at what happens when a weak coordinate's gradient drops below $\varepsilon$ on a diagonal problem. Adam divides the first-moment estimate $\hat{m}$ by $\sqrt{\hat{v}} + \varepsilon$. Writing $c$ for the effective denominator constant ($c = \varepsilon$ in Adam, $c = \sqrt{\varepsilon}$ in ungrafted Shampoo, or $c = \varepsilon\_g$ in Adam-grafted Shampoo), once a weak direction's root-mean-square gradient $\sqrt{\hat{v}}$ falls well below $c$, adaptive normalization on that direction switches off. The update quietly turns into fixed-step momentum gradient descent with effective step size $\eta / c$ (Everett et al., 2024; Sabanayagam et al., 2026).

On a coupled problem like matrix sensing, a second piece of physics from [Part II](https://arxiv.org/abs/2611.01868) and [our notes on flat directions](/blog/flat-where-the-data-isnt/) enters at the top of the spectrum. Linearizing the residual $E = U - U^\ast$ at a solution $U^\ast$ ($U^\ast {U^\ast}^\top = M^\ast$), the Gauss-Newton Hessian $H = (2/m)\\,J^\top J$ has a $D(D-1)/2$-dimensional gauge nullspace $\\{U^\ast \Omega : \Omega^\top = -\Omega\\}$ from orthogonal symmetry and extreme positive eigenvalues $h\_{\min}(s)$ and $h\_{\max}(s)$ on its orthogonal complement. Under heavy-ball momentum with parameter $\beta\_1$, linear stability of the fastest curvature mode requires the effective step size times $h\_{\max}$ to stay below the period-two flip boundary
$$A := \frac{\eta}{c}\\,h\_{\max} < L(\beta\_1) := \frac{2(1 + \beta\_1)}{1 - \beta\_1}$$
(Cohen et al., 2022). At the standard default $\beta\_1 = 0.9$, that stability ceiling is $L = 38$ (and shifts to $18$ at $\beta\_1 = 0.8$ or $78$ at $\beta\_1 = 0.95$).

Now look at what happens when you run default Adam with $\eta = 0.01$ and $c = 10^{-8}$. The nominal step ratio is $\eta / c = 10^6$. The top mode slams into Cohen's $2(1+\beta\_1)/(1-\beta\_1) = 38$ wall on step 1, flips sign every step as $(-1)^t$, and through measurement coupling pumps enough cross-term trash into $\sqrt{\hat{v}}$ to pin the weakest direction's denominator far above $10^{-8}$.

What if you raise $c$ so that $c$ dominates the denominator across the spectrum while keeping $A = (\eta / c)\\,h\_{\max} < 38$? Then the period-two flip on the strongest mode stops completely. Every mode sees a clean fixed step $\eta / c$, the weakest direction relaxes exponentially at rate $(\eta / c)\\,h\_{\min}(s)$, and its relative error crosses the $0.05 = 1/20$ threshold when
$$\frac{\eta}{c}\\,h\_{\min}(s)\\,T = \ln 20.$$

### Checking the zero-parameter step law in advance

Before using that equation to design a tuning rule, we locked its zero-parameter forecasts in advance and tested them on a brand-new problem shape, $(V, D) = (14, 5)$, along with fresh seeds on $(12, 4)$ and $(16, 6)$. Across $68$ scored precision walls where $A < 38$ and the forecast lay inside the interior of the $s$-grid ($[1.5, 5]$), the root-mean-square forecast error was $0.1276$ and the largest single discrepancy was $0.2155$: specifically, $0.1637$ rms and $0.2155$ max across $16$ ungrafted Shampoo walls on $(14, 5)$, $0.1481$ rms and $0.1915$ max across $16$ Adam walls at matched $c = \sqrt{\varepsilon}$ on $(14, 5)$, and $0.0917$ rms across $10$ grafted Shampoo walls on a ladder of $\varepsilon\_g$. Raising the step budget from $60{,}000$ to $240{,}000$ steps on $(14, 5)$ shifted the wall up by $0.8653$ on average against $0.9164$ predicted by the step law, while varying the learning rate across four values with $\eta T$ held fixed moved the wall by at most $0.0060$.

One detail in the $(14, 5)$ residuals is worth inspecting closely (and you can step through it using the `#beats` buttons in Stage 01 above). All $32$ walls on $(14, 5)$ landed slightly below the raw $\ln 20$ prediction -- by $0.0562$ to $0.2155$, with a mean offset of $-0.1494$ and rms $0.1561$. Why? Because during the first few thousand steps, the optimizer is busy pulling down the strong head modes before exponential decay on $q\_D$ even starts (the detection lag from [Part I](https://arxiv.org/abs/2610.40485)). When we extrapolate the linear $\ln e(t)$ trajectory between steps $20{,}000$ and $60{,}000$ back to $t = 0$ on $(12, 4)$ and $(16, 6)$, the effective initial intercept $\ln e\_0$ has medians $0.1541$ and $0.2140$ (mean $0.1841$) rather than $0$. Without touching our committed forecasts, a four-stage diagnostic cleanly accounts for the $-0.1494$ offset on $(14, 5)$:
1. Replacing $\ln 20$ by $\ln 20 + 0.1841$ cuts the 32-wall rms gap from $0.1561$ to $0.1191$ ($0.1637$ to $0.1266$ on Shampoo, $0.1481$ to $0.1112$ on Adam, and max error from $0.2155$ to $0.1780$), removing $0.2648$ of the mean offset.
2. Using each run's own $20{,}000$--$60{,}000$ secant intercept $\ln e\_0$ cuts the mean and rms gaps to $-0.0493$ and $0.0838$ ($22$ walls below, $0.6703$ of the offset removed). On the $14$ walls at $T \le 60{,}000$, the remaining mean offset is $+0.0095$ (rms $0.0449$); the residual $-0.0949$ (rms $0.1045$) sits at $T \ge 120{,}000$, where $84/180$ bracketing runs still had $e\_{20000} \ge 1$ at step $20{,}000$.
3. Substituting the empirical late-window decay rate leaves a mean gap of $-0.0069$ (rms $0.0088$) at $T \le 60{,}000$ and overshoots at $T \ge 120{,}000$ (mean $+0.0646$, rms $0.1298$).
4. Replacing the small-step rate $(\eta / c)\\,h\_{\min}$ by the exact two-term momentum rate $-\ln\rho(F)$ moves the forecast by at most $0.0011$ (share $-0.0025$).

### Breaking the first-order wall: $c = \eta h\_{\max} / 36$

Once you know that $A = (\eta / c)\\,h\_{\max}$ has to stay below $L(0.9) = 38$ while being as large as possible to give the tail maximum step size, the tuning rule writes itself: park $A = 36 < 38$ by setting
$$c = \frac{\eta\\,h\_{\max}}{36}.$$
We committed forecasts for this rule and tested it in advance on two larger unseen shapes, $(24, 8)$ (ten seeds) and $(32, 10)$ (five seeds), at $\eta = 0.01$ and $T = 60{,}000$:
- **Adam ($c = \eta h\_{\max} / 36$ vs. default $10^{-8}$):** On $(24, 8)$, the precision wall jumps from $3.2725$ to $5.2279$, a lift of **$1.9554$** (or $1.96$; pre-committed forecast $5.3438$). On $(32, 10)$, it jumps from $3.5903$ to $4.7384$, a lift of **$1.1481$** (or $1.15$; forecast $4.8130$). The wall rises on every single seed.
- **Unnormalized momentum twin:** To verify that the gain comes from the step ratio $\eta / c$ rather than Adam's coordinate-wise normalization, we ran warmed-up momentum gradient descent at step $\eta / c$ with no second-moment denominator at all. It reaches the exact same wall (rule minus momentum GD: $-0.0565$ on $(24, 8)$ and $-0.0360$ on $(32, 10)$).
- **From measurements alone (without knowing $M^\ast$):** In practice you do not have $M^\ast$ to read $h\_{\max}$. Fortunately, the measurement-only surrogate $\hat{M} = V\sum\_k b\_k A\_k$ has expectation $M^\ast$; taking its top $D$ eigenpairs to form $\hat{U}$ and evaluating the top Gauss-Newton eigenvalue $\hat{h}$ at $\hat{U}$ requires only the observations $\\{(A\_k, b\_k)\\}$ before step 1. Because $\hat{h} / h\_{\max} \in [1.188, 1.433]$ exceeds $1$ on every instance, setting $c = \eta\hat{h} / 36$ is automatically safe ($A < 36$) and reaches walls of $5.1896$ (forecast $5.2295$) on $(24, 8)$ and $4.6694$ (forecast $4.6849$) on $(32, 10)$, beating the default on that seed set ($3.5140$ and $3.5263$) by **$1.6755$** and **$1.1431$** on every seed.
- **What happens if you push $A$ past $38$:** On $(24, 8)$, at $A \le 36$ the relative error fell below $10^{-9}$ in all $60$ runs of Adam, momentum GD, and grafted Shampoo. Push $A$ just across the boundary to $50$ or $60$, and the error stays trapped above $10^{-9}$ in $35, 40, 28$ of $40$ runs; push to $A = 100$ and $300$, and the wall drops back to $4.2556$ and $4.0421$. Change $\beta\_1$ to $0.8$ or $0.95$, and the cliff moves right along with $L(\beta\_1)$ to $18$ and $78$, with $18$ to $20$ of $20$ runs failing once $A$ crosses $18.95$ and $82.11$. Drag $A$ across $L(\beta\_1)$ in Stage 02 below (hold `Shift` to dial right across `38`) and watch the status LED strobe when the fastest mode starts flipping.

<article class="tk-card" id="card-wall1-oscillator">
  <div class="tk-cbar">
    <span class="state" id="s2-led"><i></i><b id="s2-led-text">STAGE 02 · A = 36 &lt; L(0.9) = 38 · STABLE RELAXATION</b></span>
    <span class="hint">drag A = (η/c)h_max across L=38 · toggle β₁ ∈ {0.8, 0.9, 0.95} · hold Shift for ×8 fine</span>
    <button class="tk-pill active" data-s2-mode="rule">Rule c = ηh_max/36 (A=36)</button>
    <button class="tk-pill" data-s2-mode="hat">Measured ĥ (c = ηĥ/36)</button>
    <button class="tk-pill" data-s2-mode="default">Over Boundary (A &gt; L)</button>
  </div>
  <div class="tk-grid-2">
    <div style="padding:14px; min-width:0;">
      <canvas id="s2-canvas" width="560" height="270" style="width:100%; height:270px; display:block;"></canvas>
      <div class="tk-scrubber">
        <label style="display:flex; align-items:center; gap:6px; flex:1; min-width:190px;">
          <span style="color:var(--tk-muted);">STEP A = (η/c)h_max</span>
          <input id="s2-slider-a" type="range" min="100" max="3000" step="5" value="360" style="flex:1; accent-color:var(--tk-acid);">
          <b id="s2-val-a" style="color:var(--tk-acid); min-width:42px;">36</b>
        </label>
        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
          <span style="color:var(--tk-muted);">β₁:</span>
          <button class="tk-pill" data-s2-beta="0.8">0.8 (L=18)</button>
          <button class="tk-pill active" data-s2-beta="0.9">0.9 (L=38)</button>
          <button class="tk-pill" data-s2-beta="0.95">0.95 (L=78)</button>
        </div>
        <span class="tk-fine-badge">SHIFT = FINE ×8</span>
      </div>
    </div>
    <aside class="tk-tape" id="s2-tape-box">
      <div style="color:var(--tk-muted); text-transform:uppercase;">PRE-COMMITTED LIFT (T=60,000)</div>
      <div style="background:#141418; padding:8px 10px; border-radius:4px; border:1px solid var(--tk-line);">
        <div style="color:var(--tk-muted); font-size:10px;">(24, 8) · 10 SEEDS (DEF 3.2725)</div>
        <div id="s2-lift-24" style="font-size:15px; font-weight:700; color:var(--tk-acid);">5.2279 (+1.9554)</div>
        <div id="s2-sub-24" style="font-size:10px; color:var(--tk-teal);">Forecast: 5.3438 · Twin Δ: -0.0565</div>
      </div>
      <div style="background:#141418; padding:8px 10px; border-radius:4px; border:1px solid var(--tk-line);">
        <div style="color:var(--tk-muted); font-size:10px;">(32, 10) · 5 SEEDS (DEF 3.5903)</div>
        <div id="s2-lift-32" style="font-size:15px; font-weight:700; color:var(--tk-acid);">4.7384 (+1.1481)</div>
        <div id="s2-sub-32" style="font-size:10px; color:var(--tk-teal);">Forecast: 4.8130 · Twin Δ: -0.0360</div>
      </div>
      <div id="s2-eos-box" style="padding:8px 10px; border-radius:4px; background:#142619; border:1px solid #22c55e; font-size:10px;">
        <b>A ≤ 36 Stability Gate</b>: Error &lt; 10⁻⁹ in <b>60 / 60</b> runs across Adam, Momentum GD, and Grafted Shampoo.
      </div>
    </aside>
  </div>
</article>

---

## 3. Wall Two (Second Order, Shampoo and Grafting): Three Faceplants and $\varepsilon\_g = \sqrt{\varepsilon}$

Turns out, we guessed wrong three times in a row before we wrote down the denominator. Before we looked at the matrix root in the denominator, we spent a week betting on preconditioner geometry -- Kronecker eigenbases, block-diagonal structure, and population variance reduction. All three intuitions faceplanted on their pre-committed test runs:

1. **From Shampoo to SOAP at a shared $\varepsilon = 10^{-8}$:** Since SOAP (Vyas et al., 2025) runs Adam in the evolving eigenbasis of Shampoo's Kronecker factors $L$ and $R$ (Gupta et al., 2018; Anil et al., 2020; Shi et al., 2023), we expected the precision wall on $(16, 4)$ to climb steadily from Shampoo through Eigen-Adafactor (Shazeer and Stern, 2018) to SOAP. Surely running Adam in Shampoo's eigenbasis beats raw Shampoo? Instead, it dropped the wall by **$0.7605$**.
2. **Truncating SOAP's preconditioner into diagonal blocks:** We guessed that throwing away off-diagonal preconditioner blocks would hurt tail recovery as the spectrum steepened. On $(16, 4)$, the full-matrix preconditioner's wall actually sat $0.1789$ *below* the block-diagonal one.
3. **Evolution Strategies population scaling:** We expected scaling antithetic Evolution Strategies (Salimans et al., 2017) from $4$ to $128$ perturbation pairs to raise the wall monotonically. Under a pre-committed schedule that tied step size to population size, the wall moved by $-0.1676$ times the heuristic gain, returning to the predicted range only when we held step size fixed and varied population size alone.

That first faceplant ($-0.7605$ from Shampoo down to SOAP at $\varepsilon = 10^{-8}$) forced us to stop hand-waving about eigenbases and write down the denominator algebra. Look at how ungrafted Shampoo preconditions the momentum matrix $\hat{m}$: it steps along $(L + \varepsilon I)^{-1/4}\\,\hat{m}\\,(R + \varepsilon I)^{-1/4}$. Because $\varepsilon$ sits inside two $-1/4$ inverse matrix roots, once a weak direction's squared gradient falls below $\sqrt{\varepsilon}$, each fourth root approaches $\varepsilon^{-1/4}$ and the two multiply together to scale the step by $\varepsilon^{-1/4}\cdot\varepsilon^{-1/4} = 1/\sqrt{\varepsilon}$ (Eschenhagen et al., 2025, 2026). At a shared nominal $\varepsilon = 10^{-8}$, ungrafted Shampoo is actually dividing the tail by $c = \sqrt{\varepsilon} = 10^{-4}$, whereas SOAP and Adam divide by $10^{-8}$! Shampoo wasn't beating SOAP at $\varepsilon = 10^{-8}$ because of a better basis -- its two fourth roots were quietly handing it a $10{,}000\times$ larger denominator constant that kept the head modes closer to stability.

You can see this even more clearly in **grafting** (Agarwal et al., 2020), the standard production trick where each Shampoo update takes its direction from Shampoo but rescales its Frobenius norm to match a parallel Adam step with denominator constant $\varepsilon\_g$. If you sweep Shampoo's damping across nine levels $\log\_{10}\varepsilon = -8.0, -7.5, \dots, -4.0$ on $(12, 4)$ and $(16, 6)$:
- **Ungrafted Shampoo** loses its reach at every single step of the sweep, plunging from $5.25$ to $1.99$ (a drop of $3.26$) on $(12, 4)$ and from $3.49$ to $0.77$ (a drop of $2.72$) on $(16, 6)$ because its effective denominator $\sqrt{\varepsilon}$ grows from $10^{-4}$ to $10^{-2}$.
- **Fixed grafting ($\varepsilon\_g = 10^{-8}$)** barely budges across the entire four-decade sweep of Shampoo's $\varepsilon$ (moving by $-0.18$ and $+0.18$), sitting $1.26$ and $1.83$ above ungrafted Shampoo on the median because the grafted step norm is controlled by $\varepsilon\_g$, not by $\varepsilon$.
- **Matched grafting ($\varepsilon\_g = \sqrt{\varepsilon}$)** equalizes both denominators on the tail. Its wall tracks ungrafted Shampoo across all nine damping levels within **$0.033$** on $(12, 4)$ and **$0.003$** on $(16, 6)$ on the five-seed median -- well inside the pre-registered $0.0625$ equivalence band. If you only report means, one jumpy seed at $\log\_{10}\varepsilon = -6.5$ and $-6.0$ on $(16, 6)$ makes a $0.0025$ four-seed match look like a $0.10$ mean gap; add $15$ fresh seeds and the 20-seed mean and median gaps settle right down to $0.0101$ and $0.0003$.
- And once you set the grafting constant by the same first-order stability rule $c = \eta h\_{\max} / 36$ on $(24, 8)$ and $(32, 10)$, grafted Shampoo's wall jumps above the $\varepsilon\_g = 10^{-8}$ default by **$1.5937$** ($1.59$) and **$1.7425$** ($1.74$).

---

## 4. Wall Three (Zeroth Order, Sign-Vector Adam): Scalar Collapse, $\varepsilon^\ast$, and the Two-Stage $\mu^2$ Floor

Now switch to two-point zeroth-order optimization (Malladi et al., 2023), where you cannot backpropagate and instead estimate gradients from forward passes along a single Rademacher sign vector $z \in \\{\pm 1\\}^{VD}$ per step: $\hat{g} = a\\,z$ with scalar directional finite difference $a = (\mathcal{L}(\theta + \mu z) - \mathcal{L}(\theta - \mu z)) / (2\mu)$.

Look at what happens when you feed $\hat{g} = a\\,z$ into Adam. Because every coordinate of a Rademacher vector satisfies $z\_i^2 = 1$, the squared gradient $(\hat{g}\_i)^2 = a^2 z\_i^2 = a^2$ is **identical on every single coordinate** at every step (cf. Dbouk et al., 2026). Adam's coordinate-wise preconditioner $\hat{v}\_t$ collapses to a single shared scalar across the entire model! The update reduces to momentum zeroth-order descent with a state-dependent scalar step size $\gamma\_t = \tilde{\eta} / (\sqrt{\hat{v}\_t} + \varepsilon)$.

On a diagonal quadratic $\tfrac{1}{2}\sum\_i \lambda\_i e\_i^2$ with coordinate mean-square errors $A\_i = \mathbb{E}[e\_i^2]$ and expected squared finite difference $G^2 = \mathbb{E}[a^2] = \sum\_i \lambda\_i^2 A\_i$, Proposition 1 of [Part III](https://arxiv.org/abs/2611.10730) proves that the second moments obey an exact closed recursion whose unique stationary point with $G > 0$ sits at the critical step size $\gamma = \gamma^\ast$, the root of
$$\frac{\gamma}{2}\sum\_i \frac{\lambda\_i}{1 + \kappa\gamma\lambda\_i} = 1, \qquad \kappa = \frac{\beta\_1}{1 + \beta\_1}, \qquad A\_i = \frac{\gamma^\ast G^2}{2\lambda\_i\\,(1 + \kappa\gamma^\ast\lambda\_i)}.$$
At $\beta\_1 = 0$, this recovers the classical zeroth-order stability threshold $\gamma^\ast = 2/\mathrm{tr}\\,H$ (Défossez and Bach, 2015; Song et al., 2026). Under the mean-field replacement $\sqrt{\hat{v}\_t} \approx G$ (cf. Khaled and Jin, 2023; Cohen et al., 2025; Regis et al., 2026), define the critical denominator constant $\varepsilon^\ast := \tilde{\eta}/\gamma^\ast$. Whenever your chosen $\varepsilon$ sits below $\varepsilon^\ast$, the normalizer adjusts $G$ until $\tilde{\eta}/(G + \varepsilon) = \gamma^\ast$, locking the gradient standard deviation at $G = \varepsilon^\ast - \varepsilon > 0$ and trapping the iterate forever on the stationary **variance floor** $A\_i$. Set $\varepsilon = 1.1\\,\varepsilon^\ast > \varepsilon^\ast$, and the effective step is capped at $\gamma \le \gamma^\ast / 1.1 < \gamma^\ast$: the variance floor vanishes, and the tail decays exponentially again. Across five experimental regimes, this single threshold explains the zeroth-order wall:

1. **Diagonal quadratics ($T$ to ${64}T$):** Across $(64, 4), (64, 8), (128, 4), (128, 8)$ at budgets $T, 4T, 16T$, all $88$ of $88$ empirical walls at thresholds $0.05$ and $0.1$ fell within $0.125$ of the recursion forecast, the step-ratio diagnostic satisfied $\rho \in [0.960, 1.013]$ across $10$ closed-form conditions with floor ratio $c \le 0.0003$, and raising $\varepsilon$ from $10^{-8}$ to $0.01$ added $+0.54$ (forecast $+0.51$) when quadrupling the budget from ${4}T$ to ${16}T$. On $(48, 4)$ and $(16, 12)$ out to ${64}T$, the $\eta = 0.003$ default stalled dead on its noise floor ($2.3388$ and $3.5701$ vs. floor predictions $2.2228$ and $3.6346$), whereas $\varepsilon = 1.1\\,\varepsilon^\ast$ climbed all the way to $5.4247$ and $8.5004$ (forecasts $5.4263$ and $8.5177$), beating the $\eta = 0.003$ default by **$+3.0859$** and **$+4.9303$** and beating even the best retuned $\eta = 0.001$ default at $q = 1$ by **$1.8425$** and **$2.7021$** ($1.1981$ and $1.7759$ at ${16}T$).
2. **Hadamard-rotated quadratics:** Under a dense Hadamard sign rotation ($|Q\_{ji}| = 1/\sqrt{VD}$), the Rademacher fourth-moment identity gives $\mathbb{E}[(q\_i^\top a z)^2 \mid e] = (1 - 2/(VD))\\|He\\|^2 + 2\lambda\_i^2 \tilde{e}\_i^2$, shifting $\gamma^\ast$ to solve $(\gamma/2)(1 - 2/(VD))\sum\_i \lambda\_i / (1 - \gamma\lambda\_i/(1+\beta\_1)) = 1$. On lattice $(64, 8)$ and power-law $(32, 8)$, all $14$ walls per problem lay within $0.125$ of the rotated recursion (farthest $0.0690$ and $0.0782$), and $\varepsilon = 1.1\\,\varepsilon^\ast$ raised the ${4}T$ wall from $2.6312$ to $3.7527$ (**$+1.1215$**, or $1.12$; forecast $3.7405$) and from $1.2296$ to $1.9572$ (**$+0.7276$**, or $0.73$; forecast $1.9521$).
3. **Non-quadratic matrix sensing and the two-stage $\mu^2$ cubic floor:** On $(24, 8)$ at ${16}T$ with finite-difference probe radius $\mu = 10^{-3}$, default zeroth-order Adam ($\eta = 0.003$) sits on its variance floor across the entire grid ($e(s) \ge 0.1$). Setting $\varepsilon = 1.1\\,\varepsilon^\ast$ clears the variance floor and uncovers a second, deterministic floor at $2.9227$ (forecast $2.9835$, lift $\ge +2.9227$, and $+1.2454$ over the $\eta = 10^{-4}$ default) caused by the $\mathrm{O}(\mu^2)$ third-derivative remainder of the quartic objective. Shrinking the probe radius from $\mu = 10^{-3}$ to $10^{-4}$ drops that cubic floor and raises the ${16}T$ wall by another **$+0.6623$** to $3.5850$ (forecast $3.5178$, and $+1.0523$ at threshold $0.02$).
4. **Population logistic regression:** On non-quadratic logistic regression at dimensions $d = 64, 128$ (${16}T, \mu = 10^{-3}$), setting $\varepsilon = 1.1\\,\varepsilon^\ast$ raises the wall from $1.8350$ to $2.8118$ (**$+0.9768$**, or $0.98$; forecast $2.8098$) and from $1.6377$ to $2.5151$ (**$+0.8774$**, or $0.88$; forecast $2.5162$).
5. **Starting-trace constant without knowing the spectrum:** You do not need the spectrum of $H$ to set $\varepsilon^\ast$ in zeroth-order Adam. Spend $201$ forward passes before step $0$ ($K = 100$ random sign vectors estimating $\mathrm{tr}\\,H$ via second differences as $\hat{t}$) and set $\hat{\varepsilon} = \tilde{\eta}\hat{t}/2$. That data-only plug-in puts $1.1\\,\hat{\varepsilon}$ within $-0.0264, -0.0845, +0.0216, -0.0027$ of the oracle $1.1\\,\varepsilon^\ast$ at ${4}T$ across $(48, 4), (16, 12), \mathrm{R1}, \mathrm{R2}$ (with all $36$ walls within $0.125$ of recursion). And because rotation lowers $\hat{\varepsilon}/\varepsilon^\ast$ on $\mathrm{R2}$ to $0.5672$--$0.8149$, the conservative rotation-safe upper bound $2.2\\,\hat{\varepsilon} = 1.1\\,\tilde{\eta}\hat{t}$ stays above $\varepsilon^\ast$ on all $135$ instances (gap $-0.0593$ on $\mathrm{R2}$). Click `3 Failed Hypotheses`, click the `-6.5` / `-6.0` nodes, or switch to Wall 3 in Stage 03 below.

<article class="tk-card" id="card-wall2-wall3">
  <div class="tk-cbar">
    <span class="state"><i></i><b id="s3-title">STAGE 03 · WALL 2: SHAMPOO TWO -1/4 ROOTS (ε⁻¹/⁴ × ε⁻¹/⁴ = 1/√ε)</b></span>
    <span class="hint">switch Wall 2 / Wall 3 tabs · click -6.5 node for seed-excursion forensics · open failed hypotheses</span>
    <button class="tk-pill active" data-s3-tab="wall2">Wall 2: Shampoo &amp; Grafting</button>
    <button class="tk-pill" data-s3-tab="wall3">Wall 3: ZO Scalar Collapse &amp; μ²</button>
    <button class="tk-pill" id="s3-fail-btn" style="border-color:#f4b75c; color:#f4b75c;">3 Failed Hypotheses</button>
  </div>
  <div id="s3-fail-drawer" style="display:none; background:#16131a; border-bottom:1px solid var(--tk-line); padding:12px 14px; font:500 10px/145% var(--tk-mono);">
    <div style="color:var(--tk-amber); margin-bottom:6px; font-weight:700;">LAB NOTEBOOK MARGIN · THREE PLAUSIBLE HYPOTHESES THAT FAILED BEFORE THE DENOMINATOR RULE:</div>
    <div class="tk-grid-3">
      <div style="background:#0b0b0d; padding:8px 10px; border:1px solid #2e2938; border-radius:4px;">
        <b style="color:var(--tk-red);">1. Shampoo → Eigen-Adafactor → SOAP (-0.7605)</b><br>
        At shared ε = 10⁻⁸ on (16, 4), running Adam in Shampoo's eigenbasis <em>dropped</em> the wall by 0.7605 because Shampoo's two -1/4 roots secretly gave it √10⁻⁸ = 10⁻⁴!
      </div>
      <div style="background:#0b0b0d; padding:8px 10px; border:1px solid #2e2938; border-radius:4px;">
        <b style="color:var(--tk-red);">2. Full vs. Block-Diagonal SOAP (-0.1789)</b><br>
        On (16, 4), keeping the full preconditioner matrix sat 0.1789 <em>below</em> diagonal truncation. Eigenbasis alignment was not what moved the wall.
      </div>
      <div style="background:#0b0b0d; padding:8px 10px; border:1px solid #2e2938; border-radius:4px;">
        <b style="color:var(--tk-red);">3. ES Population 4 → 128 Pairs (-0.1676×)</b><br>
        Scaling Evolution Strategies population under a schedule tying step size to population gave -0.1676× the heuristic gain (restored only when step size was held fixed).
      </div>
    </div>
  </div>
  <div class="tk-grid-2">
    <div style="padding:14px; min-width:0;">
      <canvas id="s3-canvas" width="560" height="270" style="width:100%; height:270px; display:block; cursor:pointer;"></canvas>
      <div id="s3-ctrl-wall2" class="tk-scrubber">
        <span style="color:var(--tk-muted);">SHAPE:</span>
        <button class="tk-pill active" data-s3-w2shape="16x6">(16, 6) · 9 Damping Levels</button>
        <button class="tk-pill" data-s3-w2shape="12x4">(12, 4) · 9 Damping Levels</button>
        <span style="margin-left:auto; color:var(--tk-amber); font-size:10px;">Click canvas to toggle (-6.5, -6.0) seed-excursion forensics</span>
      </div>
      <div id="s3-ctrl-wall3" class="tk-scrubber" style="display:none;">
        <button class="tk-pill active" data-s3-w3task="quad64T">Quadratics 64T (+3.0859 / +4.9303)</button>
        <button class="tk-pill" data-s3-w3task="nonquad">Matrix Sensing (24,8) μ² Floor</button>
        <button class="tk-pill" data-s3-w3task="rot">Hadamard Rotated &amp; Logistic</button>
        <button class="tk-pill" onclick="window.pwRun201Probe && window.pwRun201Probe()" style="border-color:var(--tk-teal); color:var(--tk-teal);">[run 201-eval tr(H) probe]</button>
      </div>
    </div>
    <aside id="s3-telemetry" class="tk-tape"></aside>
  </div>
</article>

---

## 5. Where the Rule Does Not Raise the Wall (Four Regimes of the Denominator)

A tuning rule is only trustworthy if the same equations tell you when *not* to use it. Raising $c$ or $\varepsilon$ helps when a fixed step pushes strong modes past their stability ceiling or traps a scalar normalizer below $\varepsilon^\ast$. In four well-defined regimes, that condition does not hold, and our pre-committed negative controls confirm that the rule offers no gain or lowers the wall:

- **Cosine learning-rate schedule ($\eta\_0 = 0.01 \to 0$):** Under a cosine decay schedule to zero, $\eta(t)$ shrinks over training. Even with a tiny default $c = 10^{-8}$, the strong modes eventually drop below the $L = 38$ stability boundary during the late phase of the schedule, while the small denominator gives weak directions a much larger time-integrated effective step $\int \eta(t)\\,dt / c > 36T / h\_{\max}$. On $(24, 8)$ and $(32, 10)$, the cosine default reaches $5.5607$ and $4.8242$, beating the fixed-step rule on new seeds of $(24, 8)$ by $0.2901$ ($5.5607$ vs. $5.2707$; $0.5181$ on earlier seeds) and matching within $0.0721$ on $(32, 10)$ ($4.8242$ vs. $4.7521$). Combining a cosine schedule with the rule's large $c = \eta\_0 h\_{\max}/36$ cuts the integrated step $\int \eta\\,dt$ in half and lowers the wall by $0.6936$ and $0.4317$ below the cosine default ($0.4036$ and $0.3596$ below the fixed-step rule).
- **Retuned step size per budget:** In zeroth-order optimization, lowering the default learning rate $\eta$ directly lowers $\varepsilon^\ast = \tilde{\eta}/\gamma^\ast$, allowing a retuned default to catch up within $0.25$ on rotated quadratics at ${4}T$, population logistic regression, and $q = 16$ queries per step on $(48, 4)$ and $(16, 12)$ ($-0.0578$ and $-0.0872$, compared with $+0.3879$ and $+0.5747$ at $q = 4$).
- **First-order full-batch logistic regression (default already at $L$):** On population logistic regression, the $\eta = 0.01$ default wall across four $(\rho, \beta\_1)$ configurations ($3.4130, 3.6991, 3.4114, 3.7771$) already sits right on the linear stability boundary $a\\,h\_{\max} = L(\beta\_1)$ ($3.3953, 3.7116, 3.3933, 3.7712$, within $0.0181$, rising $0.3656$ from $\beta\_1 = 0.8$ to $0.95$ vs. $0.3779$ predicted by $L$). Because the default already rides $L = 38$ without oscillating, the $36$-to-$38$ safety margin leaves $c = \eta h\_{\max}/36$ slightly below default by $-0.0859$ and $-0.0876$ on $d = 64, 128$ ($3.5042$ vs. $3.5901$; $2.9746$ vs. $3.0622$), and by $-0.2930$ and $-0.2266$ on full-batch handwritten digits ($r = 16, 32$: $4.0086$ vs. $4.3017$; $3.3587$ vs. $3.5854$, where the $\eta = 0.1$ default reaches $4.4361$ and $3.6563$, and Böhning's data-only bound $\hat{h} = 1/2 + \lambda$ sits $1.4782$ and $1.2315$ lower because $\kappa = \hat{h}/h\_{\max}$ is $18.9$--$37.7$).
- **Minibatch logistic regression ($\sqrt{\hat{v}} \gg c$ from gradient noise):** Under without-replacement minibatches $B \in \\{32, 256\\}$ on digits ($n = 1{,}000$, ten seeds $130$--$139$, $T = 60{,}000$), persistent batch gradient noise $C = S\\,(n - B)/[B(n - 1)]$ keeps $\sqrt{\hat{v}} \gg c$ at $\eta = 0.01$. The linearized momentum recursion with batch-curvature feedback (where the stability ceiling $A^\ast(B)$ drops to medians $3.708, 4.009$ at $B = 32$ and $20.847, 22.049$ at $B = 256$) predicts $\sqrt{\hat{v}}$ within $0.9987$--$1.0009$ at $\eta = 0.01$ and $0.9631$--$0.9873$ at $\eta = 0.1$, placing **all $12$ walls** within $0.125$ of forecast ($-0.0774$ to $+0.0002$). Because $\sqrt{\hat{v}}$ buries $c = \eta h\_{\max}/36$, rule minus $\eta = 0.01$ default is a wash ($-0.0006, -0.0024, -0.0008, -0.0029$), while $\eta = 0.1$ leads by $0.6258$--$0.8469$. What if minibatch gradient noise already keeps $\sqrt{\hat{v}} \gg c$, and you stubbornly force $c = 1 \gg \sqrt{\hat{v}}$ at $\eta = A\_M / h\_{\max}$ ($A\_M = 2, 11$) anyway? Don't. Batch-curvature feedback locks you onto a left-hand plateau with $60{,}000$-step minima $0.1459, 0.1177, 0.1488, 0.1133$ ($6.2571$--$28.8621\times$ the unfeedback floor), where within-seed median bias $e\_{\mathrm{bias}} = 0.1428, 0.0876, 0.1486, 0.1328$ exceeds across-stream standard deviation $e\_{\mathrm{var}} = 0.0331, 0.0680, 0.0233, 0.0869$ by ratios $4.3708, 1.3320, 6.5508, 1.4796$. Lift the red safety cover in Stage 04 below to test that override yourself.

| Regime | Condition | Consequence for $c$ or $\varepsilon$ |
| :--- | :--- | :--- |
| **Fixed-step oscillation floor** | Small default $c$ leaves strong modes above $L = 38$ | $c = \eta h\_{\max}/36$ (or $\eta\hat{h}/36$) keeps modes below $L$, raising Adam's wall by $1.9554, 1.1481$ and grafted Shampoo's by $1.5937, 1.7425$; $\varepsilon\_g = \sqrt{\varepsilon}$ restores ungrafted Shampoo ($0.033, 0.003$). |
| **Cosine time-integrated step** | $\eta(t) \to 0$ drops modes below $L$ late; small $c$ enlarges $\int \eta\\,dt / c$ | Cosine default beats rule by $0.2901$ on $(24, 8)$, matches within $0.0721$ on $(32, 10)$; rule's $c$ halves $\int \eta\\,dt / c$, lowering the wall by $0.6936, 0.4317$. |
| **Full-batch stability saturation** | Default sits at $a\\,h\_{\max} \approx L$ or larger $\eta$ is stable | The $36$-to-$38$ margin cannot lift same-step default on logistic regression ($-0.0859, -0.0876$ population; $-0.2930, -0.2266$ digits; $\eta = 0.1$ reaches $4.4361, 3.6563$). |
| **Minibatch & zeroth-order floors** | Batch noise sets $\sqrt{\hat{v}} \gg c$; ZO variance ($< \varepsilon^\ast$) and cubic ($\propto \mu^2$) floors | Noise buries $c = \eta h\_{\max}/36$ ($-0.0029$ to $-0.0006$) and stalls $c = 1$; in ZO, $1.1\\,\varepsilon^\ast$ removes the variance floor ($+3.0859, +4.9303$ at ${64}T$; $+1.1215, +0.7276$ rotated; $+0.9768, +0.8774$ logistic) and shrinking $\mu$ drops the cubic floor ($+0.6623$). |

<article class="tk-card" id="card-four-regimes">
  <div class="tk-cbar">
    <span class="state" id="s4-led"><i></i><b id="s4-led-label">STAGE 04 · REGIME I · FIXED-STEP OSCILLATION FLOOR (ENGAGE c = ηh_max/36)</b></span>
    <span class="hint">select a regime telegraph order (I-IV) · lift the red safety cover to test forcing large c in the wrong regime</span>
  </div>
  <div style="padding:14px; background:var(--tk-stage-radial);">
    <div class="tk-grid-4">
      <button class="tk-pill active" data-s4-reg="1" style="padding:8px 10px; text-align:left; line-height:135%;">
        <div style="color:var(--tk-acid); font-weight:700;">I. FIXED-STEP FULL-BATCH</div>
        <div style="color:var(--tk-muted); font-size:10px;">Default c=10⁻⁸ crosses L=38</div>
      </button>
      <button class="tk-pill" data-s4-reg="2" style="padding:8px 10px; text-align:left; line-height:135%;">
        <div style="color:var(--tk-amber); font-weight:700;">II. COSINE SCHEDULE η(t)→0</div>
        <div style="color:var(--tk-muted); font-size:10px;">Small c maximizes ∫η(t)dt / c</div>
      </button>
      <button class="tk-pill" data-s4-reg="3" style="padding:8px 10px; text-align:left; line-height:135%;">
        <div style="color:var(--tk-amber); font-weight:700;">III. LOGISTIC AT L(β₁)</div>
        <div style="color:var(--tk-muted); font-size:10px;">Default already rides a·h_max = L</div>
      </button>
      <button class="tk-pill" data-s4-reg="4" style="padding:8px 10px; text-align:left; line-height:135%;">
        <div style="color:var(--tk-red); font-weight:700;">IV. MINIBATCH √v̂ ≫ c</div>
        <div style="color:var(--tk-muted); font-size:10px;">Batch noise C = S(n-B)/[B(n-1)]</div>
      </button>
    </div>
    <canvas id="s4-canvas" width="760" height="190" style="width:100%; height:190px; display:block; margin-bottom:12px; background:#090a0f; border:1px solid var(--tk-line); border-radius:4px;"></canvas>
    <div class="tk-grid-override">
      <div id="s4-panel-main" style="background:#0b0c10; border:1px solid var(--tk-line); border-radius:4px; padding:12px; font:500 11px/155% var(--tk-mono);"></div>
      <div style="background:#141216; border:1px solid #332428; border-radius:4px; padding:12px; font:500 10px/145% var(--tk-mono); display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="color:#f4b75c; font-weight:700; letter-spacing:1px; margin-bottom:4px;">
            GUARDED OVERRIDE SWITCH (BEVEL CONTROL)
          </div>
          <p style="margin:0 0 8px; color:#c9c5bc;">
            Lift the red safety cover to see the measured penalty of forcing large c when the regime equation says not to.
          </p>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button id="s4-cover-btn" class="tk-pill" style="border-color:#ef4444; color:#ffc0c0; background:#2b1114;">
            1. LIFT SAFETY COVER
          </button>
          <button id="s4-force-btn" class="tk-pill" disabled style="opacity:40%; cursor:not-allowed;">
            2. FORCE LARGE c OVERRIDE
          </button>
        </div>
        <div id="s4-guard-readout" style="margin-top:8px; padding:8px; background:#09090b; border:1px dashed #3a282c; border-radius:3px; color:var(--tk-muted);">
          Cover locked · Operating in recommended protocol state.
        </div>
      </div>
    </div>
  </div>
</article>

---

## 6. Operational Checklist and Drop-In Code

Before you change `eps` in an experiment, walk through these five checks in order:

1. **First check $\eta h\_{\max} / c$ against $L = 2(1+\beta\_1)/(1-\beta\_1) = 38$ (Wall 1):** In full-batch or low-noise fixed-step runs where strong modes cross $L$ and leak oscillation into the tail, set $c = \eta h\_{\max} / 36$ (or use a measurement-only upper bound $\hat{h} \ge h\_{\max}$).
2. **Align grafting constants through the matrix root in Shampoo (Wall 2):** With two $-1/4$ inverse roots, ungrafted Shampoo has effective tail denominator $\sqrt{\varepsilon}$. Match $\varepsilon\_g = \sqrt{\varepsilon}$ (or $\varepsilon = \varepsilon\_g^2$) before comparing bases, and always report both constants.
3. **Under a cosine schedule to zero, keep the small default constant (Regime 2):** If $\eta(t) \to 0$ already quiets the head oscillation late in training, raising $c$ cuts the integrated tail step $\int \eta(t)\\,dt / c$ in half.
4. **Under minibatches, compare $c$ against $\sqrt{\hat{v}}$ first (Regime 4):** If persistent batch gradient noise keeps $\sqrt{\hat{v}} \gg \eta h\_{\max}/36$, changing $c$ at that scale is a no-op and forcing $c \gg \sqrt{\hat{v}}$ stalls on a bias plateau; tune $\eta$ inside the batch stability ceiling $A^\ast(B)$ instead.
5. **In sign-vector zeroth-order Adam, set $\varepsilon$ above $\varepsilon^\ast$ and watch for $\mu^2$ (Wall 3):** Spend $201$ starting evaluations ($K = 100$ sign vectors) to estimate $\mathrm{tr}\\,H$ as $\hat{t}$, set $\varepsilon = 1.1\\,\hat{\varepsilon}$ with $\hat{\varepsilon} = \tilde{\eta}\hat{t}/2$ (or $2.2\\,\hat{\varepsilon}$ under unknown rotation), and shrink the probe radius $\mu$ once the variance floor is cleared on non-quadratic losses.

<div id="pw-code-deck" ondblclick="window.pwRun201Probe && window.pwRun201Probe(true)" title="Double-click code block to run the 201-eval Rademacher tr(H) probe">

```python
import numpy as np
import torch

def set_first_order_eps(optimizer, h_max: float, margin: float = 36 / 38):
    """Wall 1 & 2: Sets Adam/grafting eps = lr * h_max / (margin * L)."""
    for group in optimizer.param_groups:
        lr = group["lr"]
        beta1, _ = group["betas"]
        L_beta1 = 2 * (1 + beta1) / (1 - beta1)
        group["eps"] = lr * h_max / (margin * L_beta1)

def estimate_zo_eps_from_start(
    loss_fn, theta0: np.ndarray, eta_eff: float,
    mu: float = 1e-3, K: int = 100, rotated: bool = False, seed: int = 0
) -> float:
    """Wall 3: Estimates tr(H) from 2K+1 = 201 evals & sets ZO Adam eps."""
    rng = np.random.default_rng(seed)
    f0 = float(loss_fn(theta0))
    curvatures = []
    for _ in range(K):
        z = rng.choice([-1, 1], size=theta0.shape)
        f_pos = float(loss_fn(theta0 + mu * z))
        f_neg = float(loss_fn(theta0 - mu * z))
        curvatures.append((f_pos - 2 * f0 + f_neg) / (mu * mu))
    eps_hat = 0.5 * eta_eff * float(np.mean(curvatures))
    return (2.2 if rotated else 1.1) * eps_hat
```

</div>
<div id="pw-probe-bar" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:-6px; margin-bottom:14px; padding:6px 10px; background:#0e0e11; border:1px solid #232327; border-radius:4px; font:500 10px/130% var(--tk-mono); color:var(--tk-muted);">
  <span>201-QUERY RADEMACHER TRACE PROBE (K = 100 · double-click code or run):</span>
  <button id="pw-probe-deck-btn" class="tk-pill" onclick="window.pwRun201Probe && window.pwRun201Probe(true)" style="border-color:var(--tk-acid); color:var(--tk-acid);">[▶ run 201-eval probe (K=100)]</button>
</div>
<div id="pw-probe-term" style="display:none; background:#08090c; border:1px solid #5ad6c1; border-radius:4px; padding:10px 12px; font:500 11px/150% var(--tk-mono); color:#d4ff4f; margin-bottom:18px; white-space:pre-wrap; word-break:break-word; overflow-x:hidden;"></div>

---

## 7. A Protocol Proposal for Optimizer Claims

If you read our earlier notes on [demystifying weight-space surgery](/blog/weight-space-surgery-demystified/) alongside [the Adam epsilon wall](/blog/adam-epsilon-wall-and-replay/) and [flat directions where the data is absent](/blog/flat-where-the-data-isnt/), you will recognize the experimental habit running through [Part I](https://arxiv.org/abs/2610.40485), [Part II](https://arxiv.org/abs/2611.01868), and [Part III](https://arxiv.org/abs/2611.10730). We think benchmark comparisons of adaptive, second-order, and zeroth-order optimizers would be much easier to trust if they adopted four simple rules:

1. **Lock forecasts, tolerance bands, and reading scripts before running test shapes.** Every wall forecast in Sections 5 through 9 of Part III was committed with zero fitted constants before the test seeds ran, and scored once by a fixed program.
2. **Test the mechanism against its unnormalized twin.** When your equation says Adam at $c = \eta h_{\max}/36$ or zeroth-order Adam at $\varepsilon = 1.1\,\varepsilon^\ast$ works because it reduces to fixed-step momentum descent at $\eta / c$, run fixed-step momentum descent at that step and verify that it reaches the same walls ($-0.0565$ and $-0.0360$ in first order).
3. **Report median and mean together, and pair first against last crossings.** On Shampoo grafting, one seed's excursion separated mean from median; on recrossing curves, pairing the rule's first crossing against the default's last crossing guarantees that definition choices never tilt the comparison in favor of the rule.
4. **Keep the failed hypotheses and negative regimes in the paper.** The SOAP eigenbasis drop ($-0.7605$), the block-truncation wash ($0.1789$), the Evolution Strategies schedule confound ($-0.1676$), the cosine schedule reversal, the logistic stability saturation, and the minibatch noise floor are not embarrassments to sweep into an appendix -- they are the exact boundaries that tell an engineer when to touch `eps` and when to leave it alone.

Read across all three papers ([Part I](https://arxiv.org/abs/2610.40485), [Part II](https://arxiv.org/abs/2611.01868), and [Part III](https://arxiv.org/abs/2611.10730)), the takeaway for day-to-day training is simple. Whenever a problem has a heavy power-law tail, the denominator constant is not a passive safeguard against dividing by zero on step 1. It is a structural hyperparameter that sets the effective step size on rare directions, governs whether the strongest mode crosses its period-two stability limit, rescales through the matrix root in Kronecker preconditioners, and controls whether a scalar zeroth-order normalizer locks onto a positive noise floor. Write down which term dominates the denominator in your regime before step 1, check the stability ceiling on the head and the decay rate on the tail, and you can predict -- and move -- the precision wall in advance, without running a single post-hoc hyperparameter sweep on the test problem.

*P.S. Hat tip to Shampoo and grafting pioneer [Rohan Anil (`@_arohan_`)](https://x.com/_arohan_) -- for the little tip that started all of this in the first place, for the Kronecker preconditioner and grafting papers that made the matrix-root denominator story possible, and for showing with his own interactive write-ups that a technical post is much more fun when the reader can actually turn the knobs and poke at the little details.* 🫡

<script>
(() => {
  /* Easter Egg: Docstring Flipper */
  let docFlipped = false;
  window.pwFlipDocstring = function() {
    docFlipped = !docFlipped;
    const el = document.getElementById('pw-egg-eps-text');
    const badge = document.getElementById('pw-egg-eps');
    if (!el || !badge) return;
    if (docFlipped) {
      el.textContent = '[POWER-LAW REALITY: sets η/c = 10^6 -> pushes fastest mode past L = 38 into (-1)^t flip & pins tail denominator]';
      el.style.color = '#d4ff4f';
      badge.style.background = '#d4ff4f';
      badge.style.color = '#0b0b0c';
    } else {
      el.textContent = '["term added to the denominator to improve numerical stability" -- click badge to inspect]';
      el.style.color = '#8fa8ff';
      badge.style.background = '#121214';
      badge.style.color = '#d4ff4f';
    }
  };

  /* Easter Egg #6: Global Shift = Fine x8 Damping on Sliders */
  function setFineMode(on) {
    document.querySelectorAll('.tk-fine-badge').forEach(b => {
      if (on) {
        b.classList.add('on');
        b.textContent = 'FINE ×8 ON';
      } else {
        b.classList.remove('on');
        b.textContent = 'SHIFT = FINE ×8';
      }
    });
    const b1 = document.getElementById('s1-budget');
    const p1 = document.getElementById('s1-sprobe');
    const a2 = document.getElementById('s2-slider-a');
    if (b1) b1.step = on ? '1' : '5';
    if (p1) p1.step = on ? '1' : '5';
    if (a2) a2.step = on ? '1' : '5';
  }
  window.addEventListener('keydown', (e) => { if (e.key === 'Shift') setFineMode(true); });
  window.addEventListener('keyup', (e) => { if (e.key === 'Shift') setFineMode(false); });

  /* ---------------- STAGE 01: s* Crossing & 4-Step Offset Decomposer ---------------- */
  const c1 = document.getElementById('s1-canvas');
  if (c1) {
    const ctx1 = c1.getContext('2d');
    const budgetEl = document.getElementById('s1-budget');
    const sprobeEl = document.getElementById('s1-sprobe');
    const budgetVal = document.getElementById('s1-budget-val');
    const sprobeVal = document.getElementById('s1-sprobe-val');
    const wMeasEl = document.getElementById('s1-wall-meas');
    const wPredEl = document.getElementById('s1-wall-pred');
    const shapeTag = document.getElementById('s1-shape-tag');
    const tapeRows = document.getElementById('s1-tape-rows');
    const beatsBar = document.getElementById('s1-beats-bar');

    let mode1 = '14x5';
    let lagStep = 0;
    let sMax1 = 6;

    const LAG_STEPS = [
      { name: '0. Raw ln(20) law (32 walls)', meanGap: '-0.1494', rms: '0.1561', shampooRms: '0.1637', adamRms: '0.1481 (max 0.1915)', maxGap: '0.2155 (min 0.0562)', shift: 0 },
      { name: '1. +0.1841 intercept (0.1541, 0.2140)', meanGap: '0.2648 removed', rms: '0.1191', shampooRms: '0.1266', adamRms: '0.1112', maxGap: '0.1780', shift: -4 / 100 },
      { name: '2. Per-run 20k-60k secant ln(e₀)', meanGap: '-0.0493 (0.6703 off)', rms: '0.0838', shampooRms: '+0.0095 / 0.0449 (≤60k)', adamRms: '-0.0949 / 0.1045 (≥120k)', maxGap: '84/180 e_20000 ≥ 1', shift: -10 / 100 },
      { name: '3. +Per-run empirical decay rate', meanGap: '-0.0069 (≤60k)', rms: '0.0088 (≤60k)', shampooRms: '+0.0646 (≥120k)', adamRms: '0.1298 (≥120k)', maxGap: '0.0088', shift: -14 / 100 },
      { name: '4. Exact 2-term -ln ρ(F)', meanGap: 'Δ ≤ 0.0011', rms: 'share -0.0025', shampooRms: 'exact match', adamRms: 'exact match', maxGap: '0.0011', shift: -0.1494 }
    ];

    budgetEl.addEventListener('dblclick', () => { budgetEl.value = 100; render1(); });
    sprobeEl.addEventListener('dblclick', () => { sprobeEl.value = 353; render1(); });

    document.querySelectorAll('[data-s1-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s1-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode1 = btn.getAttribute('data-s1-preset');
        beatsBar.style.display = mode1 === 'lag' ? 'flex' : 'none';
        if (mode1 === '12x4') { budgetEl.value = 100; sprobeEl.value = 353; }
        if (mode1 === '14x5') { budgetEl.value = 100; sprobeEl.value = 353; }
        if (mode1 === '24x8') { budgetEl.value = 100; sprobeEl.value = 353; }
        render1();
      });
    });

    document.querySelectorAll('[data-s1-beat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s1-beat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        lagStep = parseInt(btn.getAttribute('data-s1-beat'), 10);
        render1();
      });
    });

    function render1() {
      const mult = parseInt(budgetEl.value, 10) / 100;
      const sProbe = parseInt(sprobeEl.value, 10) / 100;
      const steps = Math.round(60000 * mult);
      budgetVal.textContent = steps.toLocaleString();
      sprobeVal.textContent = sProbe.toFixed(2);

      let sMeas, sPred;
      const prog = Math.log(mult) / Math.log(4);
      if (mode1 === '12x4') {
        shapeTag.textContent = '(V,D) = (12,4) Shampoo';
        sMeas = 3.53 + (4.12 - 3.53) * prog;
        sPred = 3.53 + (4.12 - 3.53) * prog;
        tapeRows.innerHTML =
          '<div style="display:flex;justify-content:space-between;"><span>Damping ε</span><b>10⁻⁷ (ungrafted)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Wall @ T=60k</span><b>3.53</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Wall @ 4T=240k</span><b style="color:var(--tk-green);">4.12 (3.53 → 4.12)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>68-wall Global RMS</span><b>0.1276 (max 0.2155)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>10 Grafted Ladder RMS</span><b>0.0917</b></div>';
      } else if (mode1 === '24x8') {
        shapeTag.textContent = '(24,8) & (32,10) Rule';
        sMeas = 5.2279 + 0.8653 * prog;
        sPred = 5.3438 + 0.9164 * prog;
        tapeRows.innerHTML =
          '<div style="display:flex;justify-content:space-between;"><span>(24,8) Default → Rule</span><b style="color:var(--tk-green);">3.2725 → 5.2279 (+1.9554)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>(24,8) Forecast</span><b style="color:var(--tk-teal);">5.3438 (twin -0.0565)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>(32,10) Default → Rule</span><b style="color:var(--tk-green);">3.5903 → 4.7384 (+1.1481)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>(32,10) Forecast</span><b style="color:var(--tk-teal);">4.8130 (twin -0.0360)</b></div>';
      } else if (mode1 === '14x5') {
        shapeTag.textContent = '(V,D) = (14,5) Pre-Committed';
        sMeas = 3.53 + 0.8653 * prog;
        sPred = 3.53 + 0.1494 + 0.9164 * prog;
        tapeRows.innerHTML =
          '<div style="display:flex;justify-content:space-between;"><span>60k→240k Lift (Meas)</span><b style="color:var(--tk-green);">+0.8653</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>60k→240k Lift (Pred)</span><b style="color:var(--tk-teal);">+0.9164</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>16 Shampoo Walls RMS</span><b>0.1637 (max 0.2155)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>16 Adam (c=√ε) RMS</span><b>0.1481 (max 0.1915)</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>4 Step Sizes (fixed ηT)</span><b style="color:var(--tk-amber);">Δ ≤ 0.0060</b></div>';
      } else {
        const st = LAG_STEPS[lagStep];
        shapeTag.textContent = 'Lag Step ' + lagStep + '/4';
        sMeas = 3.53 + 0.8653 * prog;
        sPred = sMeas + 0.1494 + st.shift;
        tapeRows.innerHTML =
          '<div style="color:var(--tk-amber);font-weight:700;">' + st.name + '</div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Budget shift (measured (14,5) lift)</span><b style="color:var(--tk-green);">+' + (0.8653 * prog).toFixed(4) + '</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>32-Wall Mean Gap</span><b>' + st.meanGap + '</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>32-Wall RMS Gap</span><b style="color:var(--tk-acid);">' + st.rms + '</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Shampoo Split</span><b>' + st.shampooRms + '</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Adam Split</span><b>' + st.adamRms + '</b></div>' +
          '<div style="display:flex;justify-content:space-between;"><span>Max / Note</span><b>' + st.maxGap + '</b></div>';
      }

      wMeasEl.textContent = sMeas.toFixed(4);
      wPredEl.textContent = sPred.toFixed(4);
      sMax1 = Math.max(6, Math.ceil(Math.max(sMeas, sPred) + 0.25));

      const W = c1.width, H = c1.height;
      ctx1.clearRect(0, 0, W, H);
      const padL = 48, padR = 20, padT = 22, padB = 30;
      const plotW = W - padL - padR, plotH = H - padT - padB;
      const xOfS = (s) => padL + (s / sMax1) * plotW;
      const yOfE = (e) => padT + (1 - Math.min(1, Math.max(0, e))) * plotH;

      ctx1.strokeStyle = '#232327';
      ctx1.lineWidth = 1;
      for (let s = 0; s <= sMax1; s += 1) {
        const x = xOfS(s);
        ctx1.beginPath(); ctx1.moveTo(x, padT); ctx1.lineTo(x, padT + plotH); ctx1.stroke();
        ctx1.fillStyle = '#7d8193';
        ctx1.font = '10px monospace';
        ctx1.fillText('s=' + s, x - 10, padT + plotH + 15);
      }

      const y05 = yOfE(0.05);
      ctx1.strokeStyle = '#ef4444';
      ctx1.setLineDash([5, 4]);
      ctx1.beginPath(); ctx1.moveTo(padL, y05); ctx1.lineTo(padL + plotW, y05); ctx1.stroke();
      ctx1.setLineDash([]);
      ctx1.fillStyle = '#ef4444';
      ctx1.fillText('0.05 (5% precision wall threshold)', padL + 6, y05 - 6);

      /* Average Loss Mirage Curve */
      ctx1.strokeStyle = '#5c5a56';
      ctx1.lineWidth = 2;
      ctx1.setLineDash([3, 3]);
      ctx1.beginPath();
      for (let i = 0; i <= 120; i++) {
        const s = (i / 120) * sMax1;
        const avgL = (1 / 125) * Math.exp(-s / 4);
        const x = xOfS(s), y = yOfE(avgL);
        if (i === 0) ctx1.moveTo(x, y); else ctx1.lineTo(x, y);
      }
      ctx1.stroke();
      ctx1.setLineDash([]);

      /* Committed Forecast Curve */
      ctx1.strokeStyle = '#5ad6c1';
      ctx1.lineWidth = 2;
      ctx1.setLineDash([6, 4]);
      ctx1.beginPath();
      for (let i = 0; i <= 160; i++) {
        const s = (i / 160) * sMax1;
        const rate = Math.log(20) * Math.pow(9 / 2, sPred - s);
        const eVal = Math.min(1, Math.exp(-rate));
        const x = xOfS(s), y = yOfE(eVal);
        if (i === 0) ctx1.moveTo(x, y); else ctx1.lineTo(x, y);
      }
      ctx1.stroke();
      ctx1.setLineDash([]);

      /* Measured Weakest-Direction Curve e(s) */
      ctx1.strokeStyle = '#d4ff4f';
      ctx1.lineWidth = 2;
      ctx1.beginPath();
      for (let i = 0; i <= 160; i++) {
        const s = (i / 160) * sMax1;
        const rate = Math.log(20) * Math.pow(9 / 2, sMeas - s);
        const eVal = Math.min(1, Math.exp(-rate));
        const x = xOfS(s), y = yOfE(eVal);
        if (i === 0) ctx1.moveTo(x, y); else ctx1.lineTo(x, y);
      }
      ctx1.stroke();

      const xStar = xOfS(sMeas);
      ctx1.fillStyle = '#d4ff4f';
      ctx1.beginPath(); ctx1.arc(xStar, y05, 5, 0, Math.PI * 2); ctx1.fill();
      ctx1.fillText('s* = ' + sMeas.toFixed(2), xStar - 24, y05 - 10);

      const xP = xOfS(sProbe);
      const eProbe = Math.min(1, Math.exp(-Math.log(20) * Math.pow(9 / 2, sMeas - sProbe)));
      ctx1.strokeStyle = '#f4b75c';
      ctx1.beginPath(); ctx1.moveTo(xP, padT); ctx1.lineTo(xP, padT + plotH); ctx1.stroke();
      ctx1.fillStyle = '#f4b75c';
      ctx1.beginPath(); ctx1.arc(xP, yOfE(eProbe), 4, 0, Math.PI * 2); ctx1.fill();
      ctx1.fillText('e(' + sProbe.toFixed(2) + ')=' + eProbe.toFixed(3) + ' | avgLoss≈10⁻⁸', Math.min(W - 220, Math.max(padL + 4, xP - 60)), padT + 12);
    }

    budgetEl.addEventListener('input', render1);
    sprobeEl.addEventListener('input', render1);
    c1.addEventListener('pointermove', (e) => {
      if (e.buttons === 1) {
        const rect = c1.getBoundingClientRect();
        const s = Math.max(1 / 2, Math.min(11 / 2, ((e.clientX - rect.left - 48) / (rect.width - 68)) * sMax1));
        sprobeEl.value = Math.round(s * 100);
        render1();
      }
    });
    render1();
  }

  /* ---------------- STAGE 02: Wall 1 Oscillator & EoS Strobe ---------------- */
  const c2 = document.getElementById('s2-canvas');
  if (c2) {
    const ctx2 = c2.getContext('2d');
    const sliderA = document.getElementById('s2-slider-a');
    const valA = document.getElementById('s2-val-a');
    const led = document.getElementById('s2-led');
    const ledText = document.getElementById('s2-led-text');
    const lift24 = document.getElementById('s2-lift-24');
    const sub24 = document.getElementById('s2-sub-24');
    const lift32 = document.getElementById('s2-lift-32');
    const sub32 = document.getElementById('s2-sub-32');
    const eosBox = document.getElementById('s2-eos-box');
    const tapeBox = document.getElementById('s2-tape-box');

    let beta1 = 0.9;
    let mode2 = 'rule';
    let tick2 = 0;

    function getL(b) { return (2 * (1 + b)) / (1 - b); }

    function applyMode2(m) {
      const L = getL(beta1);
      if (m === 'rule') sliderA.value = Math.round(L * 360 / 38);
      if (m === 'hat') sliderA.value = Math.round(L * 360 / 48);
      if (m === 'default') sliderA.value = Math.round((L + 22) * 10);
      const ruleBtn = document.querySelector('[data-s2-mode="rule"]');
      if (ruleBtn) {
        const aRule = Math.round(L * 36 / 38);
        ruleBtn.textContent = 'Rule c = ηh_max/' + aRule + ' (A=' + aRule + ')';
      }
    }

    sliderA.addEventListener('dblclick', () => {
      mode2 = 'rule';
      document.querySelectorAll('[data-s2-mode]').forEach(b => b.classList.toggle('active', b.getAttribute('data-s2-mode') === 'rule'));
      applyMode2('rule');
      updateTelemetry2();
    });

    document.querySelectorAll('[data-s2-beta]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s2-beta]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        beta1 = parseFloat(btn.getAttribute('data-s2-beta'));
        if (mode2 !== 'custom') applyMode2(mode2);
        else applyMode2('rule');
        updateTelemetry2();
      });
    });

    document.querySelectorAll('[data-s2-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s2-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode2 = btn.getAttribute('data-s2-mode');
        applyMode2(mode2);
        updateTelemetry2();
      });
    });

    sliderA.addEventListener('input', () => {
      mode2 = 'custom';
      const A = parseInt(sliderA.value, 10) / 10;
      const L = getL(beta1);
      const activeMode = A > L ? 'default' : (A < L * 32 / 38 ? 'hat' : 'rule');
      document.querySelectorAll('[data-s2-mode]').forEach(b => b.classList.toggle('active', b.getAttribute('data-s2-mode') === activeMode));
      updateTelemetry2();
    });

    function updateTelemetry2() {
      const A = parseInt(sliderA.value, 10) / 10;
      const L = getL(beta1);
      valA.textContent = A.toFixed(1);
      const unstable = A > L;

      if (!unstable) {
        led.className = 'state';
        tapeBox.classList.remove('tk-degen');
        ledText.textContent = 'STAGE 02 · A = ' + A.toFixed(1) + ' < L(' + beta1 + ') = ' + L.toFixed(0) + ' · STABLE RELAXATION';
        if (A < L * 32 / 38) {
          lift24.textContent = '5.1896 (+1.6755 vs 3.5140)';
          sub24.textContent = 'Forecast: 5.2295 · ĥ/h_max ∈ [1.188, 1.433]';
          lift32.textContent = '4.6694 (+1.1431 vs 3.5263)';
          sub32.textContent = 'Forecast: 4.6849 · From measurements alone';
        } else {
          lift24.textContent = '5.2279 (+1.9554)';
          sub24.textContent = 'Forecast: 5.3438 · Twin Momentum GD Δ: -0.0565';
          lift32.textContent = '4.7384 (+1.1481)';
          sub32.textContent = 'Forecast: 4.8130 · Twin Momentum GD Δ: -0.0360';
        }
        eosBox.style.background = '#142619';
        eosBox.style.borderColor = '#22c55e';
        eosBox.innerHTML = '<b>A ≤ ' + L.toFixed(0) + ' Stability Verified</b>: Error fell below 10⁻⁹ in <b>60/60</b> runs at A≤36. Weak tail decays at rate (η/c)h_min(s).';
      } else {
        tapeBox.classList.add('tk-degen');
        ledText.textContent = 'EoS CROSSED: A = ' + A.toFixed(1) + ' > L(' + beta1 + ') = ' + L.toFixed(0) + ' · (-1)^t FLIP!';
        lift24.textContent = A >= 100 ? '4.2556 → 4.0421 (def 3.2725)' : '35/40 & 40/40 fail';
        sub24.textContent = 'Strong mode flip pins √v̂ ≫ 10⁻⁸ via coupling';
        lift32.textContent = '3.5903 (Stalled)';
        sub32.textContent = beta1 === 0.8 ? '18-20/20 fail above 18.95' : (beta1 === 0.95 ? '18-20/20 fail above 82.11' : '35, 40, 28 of 40 fail at A=50, 60');
        eosBox.style.background = '#2b1114';
        eosBox.style.borderColor = '#ef4444';
        eosBox.innerHTML = '<b>Period-Two Flip Active (Cohen et al. 2022)</b>: At A=50, 60 error stayed above 10⁻⁹ in <b>35, 40, 28 of 40</b> runs; A=100, 300 dropped wall to 4.2556, 4.0421.';
      }
    }

    function animate2() {
      tick2++;
      const A = parseInt(sliderA.value, 10) / 10;
      const L = getL(beta1);
      const unstable = A > L;
      if (unstable && tick2 % 12 === 0) {
        led.className = (tick2 / 12) % 2 === 0 ? 'state flip-a' : 'state flip-b';
      }
      const W = c2.width, H = c2.height;
      ctx2.clearRect(0, 0, W, H);
      const midX = Math.round(W * 48 / 100);

      ctx2.fillStyle = '#8fa8ff';
      ctx2.font = '10px monospace';
      ctx2.fillText('FAST MODE q₁ DYNAMICS (L(' + beta1 + ') = ' + L.toFixed(0) + ')', 12, 18);
      const yMid1 = Math.round(H * 54 / 100);
      ctx2.strokeStyle = '#232327';
      ctx2.beginPath(); ctx2.moveTo(12, yMid1); ctx2.lineTo(midX - 12, yMid1); ctx2.stroke();

      ctx2.strokeStyle = unstable ? '#ef4444' : '#d4ff4f';
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      const steps = 32;
      for (let k = 0; k <= steps; k++) {
        const x = 12 + (k / steps) * (midX - 24);
        let amp;
        if (!unstable) {
          const rho = Math.max(3 / 10, 1 - (A / L) * (7 / 20));
          amp = 80 * Math.pow(rho, k) * Math.cos(k * Math.PI * 17 / 20);
        } else {
          const sat = Math.min(88, 34 + (A - L));
          amp = sat * Math.pow(-1, k) * Math.cos(tick2 / 12);
        }
        const y = yMid1 - amp;
        if (k === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        ctx2.fillStyle = unstable ? '#f4b75c' : '#d4ff4f';
        ctx2.fillRect(x - 2, y - 2, 4, 4);
      }
      ctx2.stroke();

      ctx2.strokeStyle = '#232327';
      ctx2.beginPath(); ctx2.moveTo(midX, 10); ctx2.lineTo(midX, H - 10); ctx2.stroke();

      ctx2.fillStyle = '#5ad6c1';
      ctx2.fillText('WEAKEST MODE q_D RESIDUAL vs. MOMENTUM GD TWIN', midX + 12, 18);
      const padT = 34, padB = 24, plotH = H - padT - padB, plotW = W - midX - 24;
      const y05 = padT + Math.round(plotH * 75 / 100);
      ctx2.strokeStyle = '#ef4444';
      ctx2.setLineDash([4, 4]);
      ctx2.beginPath(); ctx2.moveTo(midX + 12, y05); ctx2.lineTo(W - 12, y05); ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.fillStyle = '#ef4444';
      ctx2.fillText('0.05 wall threshold', midX + 16, y05 - 5);

      [false, true].forEach(isTwin => {
        ctx2.strokeStyle = isTwin ? '#5ad6c1' : '#d4ff4f';
        ctx2.lineWidth = isTwin ? 2 : 2;
        if (isTwin) ctx2.setLineDash([5, 4]); else ctx2.setLineDash([]);
        ctx2.beginPath();
        for (let i = 0; i <= 80; i++) {
          const u = i / 80;
          const x = midX + 12 + u * plotW;
          let eVal;
          if (!unstable) {
            const rate = (A / L) * 4 * (isTwin ? 101 / 100 : 1);
            eVal = Math.exp(-rate * u);
          } else {
            const fl = Math.min(3 / 4, 1 / 3 + (A - L) / 150);
            eVal = fl + (1 - fl) * Math.exp(-3 * u) + (isTwin ? 0 : (1 / 40) * Math.sin(u * 35 + tick2 / 6));
          }
          const y = padT + (1 - Math.min(1, eVal)) * plotH;
          if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.stroke();
      });
      ctx2.setLineDash([]);
      requestAnimationFrame(animate2);
    }
    updateTelemetry2();
    requestAnimationFrame(animate2);
  }

  /* ---------------- STAGE 03: Wall 2 & Wall 3 + Outlier Loupe + Graveyard ---------------- */
  let probe3Active = false;
  let probe3Runs = 0;
  let render3Ref = null;
  const c3 = document.getElementById('s3-canvas');
  if (c3) {
    const ctx3 = c3.getContext('2d');
    const titleEl = document.getElementById('s3-title');
    const failBtn = document.getElementById('s3-fail-btn');
    const failDrawer = document.getElementById('s3-fail-drawer');
    const ctrlW2 = document.getElementById('s3-ctrl-wall2');
    const ctrlW3 = document.getElementById('s3-ctrl-wall3');
    const telem3 = document.getElementById('s3-telemetry');

    let tab3 = 'wall2';
    let w2Shape = '16x6';
    let w3Task = 'quad64T';
    let showOutlierLoupe = false;

    failBtn.addEventListener('click', () => {
      failDrawer.style.display = failDrawer.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('[data-s3-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s3-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tab3 = btn.getAttribute('data-s3-tab');
        ctrlW2.style.display = tab3 === 'wall2' ? 'flex' : 'none';
        ctrlW3.style.display = tab3 === 'wall3' ? 'flex' : 'none';
        titleEl.textContent = tab3 === 'wall2'
          ? 'STAGE 03 · WALL 2: SHAMPOO TWO -1/4 ROOTS (ε⁻¹/⁴ × ε⁻¹/⁴ = 1/√ε)'
          : 'STAGE 03 · WALL 3: ZO SIGN-VECTOR SCALAR COLLAPSE (zᵢ² = 1 ⇒ ε* = η̃/γ*) & μ² FLOOR';
        render3();
      });
    });

    document.querySelectorAll('[data-s3-w2shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s3-w2shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        w2Shape = btn.getAttribute('data-s3-w2shape');
        render3();
      });
    });

    document.querySelectorAll('[data-s3-w3task]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s3-w3task]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        w3Task = btn.getAttribute('data-s3-w3task');
        render3();
      });
    });

    c3.addEventListener('click', () => {
      if (tab3 === 'wall2') {
        showOutlierLoupe = !showOutlierLoupe;
        render3();
      }
    });

    function render3() {
      const W = c3.width, H = c3.height;
      ctx3.clearRect(0, 0, W, H);
      const padL = 48, padR = 20, padT = 32, padB = 34;
      const plotW = W - padL - padR, plotH = H - padT - padB;

      if (tab3 === 'wall2') {
        const levels = [-8.0, -7.5, -7.0, -6.5, -6.0, -5.5, -5.0, -4.5, -4.0];
        const is12 = w2Shape === '12x4';
        const sHi = is12 ? 5.25 : 3.49;
        const sLo = is12 ? 1.99 : 0.77;
        const ungrafted = levels.map((_, i) => sHi - (sHi - sLo) * (i / 8));
        const matched = ungrafted.map((v, i) => v + (is12 ? 0.033 : 0.003) * (i % 2 === 0 ? 1 : -1));
        const fixedBase = is12 ? 5.25 : (3.49 + 1.83);
        const fixedGraft = levels.map((_, i) => fixedBase + (is12 ? -0.18 : 0.18) * (i / 8));

        const xOfIdx = (i) => padL + (i / 8) * plotW;
        const yOfWall = (w) => padT + (1 - (w - 1 / 2) / 5) * plotH;

        ctx3.strokeStyle = '#232327';
        levels.forEach((lv, i) => {
          const x = xOfIdx(i);
          ctx3.beginPath(); ctx3.moveTo(x, padT); ctx3.lineTo(x, padT + plotH); ctx3.stroke();
          ctx3.fillStyle = (lv === -6.5 || lv === -6.0) ? '#f4b75c' : '#7d8193';
          ctx3.font = '10px monospace';
          ctx3.fillText(lv.toFixed(1), x - 12, padT + plotH + 15);
        });

        ctx3.strokeStyle = '#a996ff';
        ctx3.lineWidth = 2;
        ctx3.beginPath();
        fixedGraft.forEach((w, i) => { const x = xOfIdx(i), y = yOfWall(w); if (i === 0) ctx3.moveTo(x, y); else ctx3.lineTo(x, y); });
        ctx3.stroke();

        ctx3.strokeStyle = '#ef4444';
        ctx3.lineWidth = 2;
        ctx3.beginPath();
        ungrafted.forEach((w, i) => { const x = xOfIdx(i), y = yOfWall(w); if (i === 0) ctx3.moveTo(x, y); else ctx3.lineTo(x, y); });
        ctx3.stroke();

        ctx3.strokeStyle = '#d4ff4f';
        ctx3.lineWidth = 2;
        ctx3.setLineDash([6, 4]);
        ctx3.beginPath();
        matched.forEach((w, i) => {
          const x = xOfIdx(i), y = yOfWall(w);
          if (i === 0) ctx3.moveTo(x, y); else ctx3.lineTo(x, y);
          ctx3.fillStyle = '#d4ff4f';
          ctx3.fillRect(x - 3, y - 3, 6, 6);
        });
        ctx3.stroke();
        ctx3.setLineDash([]);

        [3, 4].forEach(idx => {
          const x = xOfIdx(idx), y = yOfWall(matched[idx]);
          ctx3.strokeStyle = '#f4b75c';
          ctx3.beginPath(); ctx3.arc(x, y, 7, 0, Math.PI * 2); ctx3.stroke();
        });

        if (showOutlierLoupe) {
          const lx = padL + 10, ly = padT + plotH - 72;
          ctx3.fillStyle = 'rgba(20, 21, 29, 0.94)';
          ctx3.strokeStyle = '#f4b75c';
          ctx3.lineWidth = 1;
          ctx3.fillRect(lx, ly, 424, 66);
          ctx3.strokeRect(lx, ly, 424, 66);
          ctx3.fillStyle = '#f4b75c';
          ctx3.font = 'bold 10px monospace';
          ctx3.fillText(is12 ? 'SEED FORENSICS @ 9 Damping Levels on (12, 4):' : 'SEED FORENSICS @ log₁₀ε ∈ {-6.5, -6.0} on (16, 6):', lx + 10, ly + 17);
          ctx3.fillStyle = '#ece8e1';
          ctx3.font = '10px monospace';
          ctx3.fillText(is12 ? '• Matched ε_g = √ε 5-seed Median Gap: 0.033 (inside 0.0625 band)' : '• 5-seed Median Gap: 0.003 (4-seed Mean: 0.0025, inside 0.0625 band)', lx + 10, ly + 35);
          ctx3.fillText(is12 ? '• (16, 6) outlier @ -6.5/-6.0: Mean 0.10 → +15 seeds: 0.0101 / 0.0003' : '• 1 seed excursion gave Mean 0.10 → +15 seeds: 0.0101 / 0.0003', lx + 10, ly + 53);
        }

        telem3.innerHTML =
          '<div style="color:var(--tk-muted); text-transform:uppercase;">SHAMPOO GRAFTING AUDIT</div>' +
          '<div style="background:#141418; padding:8px 10px; border-radius:4px;">' +
            '<div style="color:var(--tk-muted); font-size:10px;">UNGRAFTED DROP (-8.0 → -4.0)</div>' +
            '<div style="color:var(--tk-red); font-size:14px; font-weight:700;">' + (is12 ? '5.25 → 1.99 (-3.26)' : '3.49 → 0.77 (-2.72)') + '</div>' +
          '</div>' +
          '<div style="background:#141418; padding:8px 10px; border-radius:4px;">' +
            '<div style="color:var(--tk-muted); font-size:10px;">MATCHED ε_g = √ε MEDIAN GAP</div>' +
            '<div style="color:var(--tk-acid); font-size:14px; font-weight:700;">' + (is12 ? '0.033 (≤ 0.0625 band)' : '0.003 (≤ 0.0625 band)') + '</div>' +
          '</div>' +
          '<div style="background:#141418; padding:8px 10px; border-radius:4px;">' +
            '<div style="color:var(--tk-muted); font-size:10px;">FIXED ε_g = 10⁻⁸ PLATEAU</div>' +
            '<div style="color:var(--tk-violet); font-size:13px; font-weight:700;">' + (is12 ? '+1.26 above ungrafted (-0.18)' : '+1.83 above ungrafted (+0.18)') + '</div>' +
          '</div>' +
          '<div style="font-size:10px; color:var(--tk-teal);">' +
            '<b>Rule c = ηh_max/36 on Grafted Shampoo</b>:<br>• (24, 8) lift: <b>+1.5937</b> (1.59)<br>• (32, 10) lift: <b>+1.7425</b> (1.74)' +
          '</div>';
      } else {
        const bars = w3Task === 'quad64T'
          ? [
              { lbl: '(48,4) Default η=0.003', val: 2.3388, pred: 2.2228, col: '#ef4444' },
              { lbl: '(48,4) 1.1ε* (+3.0859)', val: 5.4247, pred: 5.4263, col: '#d4ff4f' },
              { lbl: '(16,12) Default η=0.003', val: 3.5701, pred: 3.6346, col: '#ef4444' },
              { lbl: '(16,12) 1.1ε* (+4.9303)', val: 8.5004, pred: 8.5177, col: '#d4ff4f' }
            ]
          : (w3Task === 'nonquad'
            ? [
                { lbl: 'Default η=0.003 (Var Floor e(s)≥0.1)', val: 0, pred: 0, col: '#ef4444' },
                { lbl: 'Default η=10⁻⁴ (+1.2454 below 1.1ε*)', val: 2.9227 - 1.2454, pred: 2.9227 - 1.2454, col: '#7d8193' },
                { lbl: '1.1ε*, μ=10⁻³ (Cubic μ² Floor)', val: 2.9227, pred: 2.9835, col: '#a996ff' },
                { lbl: '1.1ε*, μ=10⁻⁴ (+0.6623 / +1.0523 @ 0.02)', val: 3.5850, pred: 3.5178, col: '#d4ff4f' }
              ]
            : [
                { lbl: 'Hadamard (64,8) 1.1ε* (+1.1215 vs 2.6312)', val: 3.7527, pred: 3.7405, col: '#d4ff4f' },
                { lbl: 'Hadamard (32,8) 1.1ε* (+0.7276 vs 1.2296)', val: 1.9572, pred: 1.9521, col: '#5ad6c1' },
                { lbl: 'Logistic d=64 (+0.9768 vs 1.8350)', val: 2.8118, pred: 2.8098, col: '#f4b75c' },
                { lbl: 'Logistic d=128 (+0.8774 vs 1.6377)', val: 2.5151, pred: 2.5162, col: '#a996ff' }
              ]);

        const maxVal = w3Task === 'quad64T' ? 9 : 4;
        bars.forEach((b, i) => {
          const y = padT + i * 52;
          const wMeas = (b.val / maxVal) * plotW;
          const wPred = (b.pred / maxVal) * plotW;
          ctx3.font = '10px monospace';
          ctx3.textAlign = 'left';
          ctx3.fillStyle = '#ece8e1';
          ctx3.fillText(b.lbl, padL, y - 6);
          ctx3.textAlign = 'right';
          ctx3.fillStyle = '#5ad6c1';
          ctx3.fillText('meas ' + b.val.toFixed(4) + ' (pred ' + b.pred.toFixed(4) + ')', padL + plotW, y - 6);
          ctx3.textAlign = 'left';
          ctx3.fillStyle = '#181920';
          ctx3.fillRect(padL, y, plotW, 18);
          ctx3.fillStyle = b.col;
          ctx3.fillRect(padL, y, Math.max(4, wMeas), 18);
          ctx3.strokeStyle = '#5ad6c1';
          ctx3.lineWidth = 2;
          ctx3.beginPath(); ctx3.moveTo(padL + wPred, y - 3); ctx3.lineTo(padL + wPred, y + 21); ctx3.stroke();
        });

        const probeBannerHTML = probe3Active
          ? ('<div id="s3-probe-banner" data-runs="' + probe3Runs + '" style="margin-top:6px;padding:6px 8px;background:#07120e;border:1px solid #22c55e;border-radius:3px;color:#86efac;font-size:9.5px;">' +
             '<b>201-EVAL PROBE OK (Run #' + probe3Runs + '):</b> ' +
             (w3Task === 'quad64T'
               ? '1.1*eps_hat gap -0.0264..-0.0027 @ 4T (36/36 ≤ 0.125); 64T lifts +3.0859, +4.9303.'
               : (w3Task === 'nonquad'
                 ? '1.1*eps_hat clears variance floor to 2.9227 (μ=10⁻³) & 3.5850 (μ=10⁻⁴, +0.6623).'
                 : 'R2 ratio 0.5672..0.8149 ⇒ 2.2*eps_hat > eps* on 135/135 instances (gap -0.0593).')) +
             '</div>')
          : '';

        telem3.innerHTML =
          '<div style="color:var(--tk-muted); text-transform:uppercase;">WALL 3 · ZO SCALAR COLLAPSE</div>' +
          '<div style="font-size:10px;">' +
            '<b>Why z ∈ {±1}^VD collapses v̂_t</b>:<br>Every coordinate has (ĝᵢ)² = a²zᵢ² = a². Whenever ε &lt; ε* = η̃/γ*, the step locks at γ* with floor G = ε* - ε &gt; 0.' +
          '</div>' +
          '<div style="background:#141418; padding:8px 10px; border-radius:4px; font-size:10px;">' +
            '• <b>88/88</b> diag walls within 0.125 (ρ ∈ [0.960, 1.013], floor c ≤ 0.0003)<br>' +
            '• <b>64T Lifts</b>: +3.0859, +4.9303 (+1.8425, +2.7021 over η=0.001; 1.1981, 1.7759 @ 16T)<br>' +
            '• <b>201-Eval Probe (K=100)</b>: 2.2ε̂ bounds ε* on <b>135/135</b> instances (R2 ratio 0.5672-0.8149, gap -0.0593).' +
          '</div>' +
          probeBannerHTML;
      }
    }
    render3Ref = render3;
    render3();
  }

  /* Easter Egg #4: 201-Eval Rademacher Trace Probe Terminal (Idempotent Single-Banner Update) */
  window.pwRun201Probe = function(fromDeck) {
    probe3Runs += 1;
    probe3Active = true;
    const term = document.getElementById('pw-probe-term');
    if (term) {
      term.style.display = 'block';
      term.textContent =
        '[201-EVAL RADEMACHER PROBE · Run #' + probe3Runs + ' · K = 100 sign vectors z ∈ {±1}^VD at θ₀]\n' +
        '  step 01..100: ▂▃▅▆▇▇▇▇█▇▇▇▇▇  tr(H) hat converged (cost: 201 / 15,000 evals)\n' +
        '  1.1*eps_hat vs 1.1*eps* @ 4T: -0.0264 (48,4), -0.0845 (16,12),\n' +
        '                                +0.0216 (R1),   -0.0027 (R2) [36/36 ≤ 0.125]\n' +
        '  rotated R2 eps_hat/eps* ∈ [0.5672, 0.8149] ⇒ 2.2*eps_hat > eps* on 135/135 (gap -0.0593)';
      if (fromDeck) {
        term.scrollIntoView({block: 'nearest', behavior: 'smooth'});
      }
    }
    if (typeof render3Ref === 'function') render3Ref();
  };

  /* ---------------- STAGE 04: Four Regimes Compass & Bevel Guarded Switch ---------------- */
  const mainEl = document.getElementById('s4-panel-main');
  const c4 = document.getElementById('s4-canvas');
  if (mainEl && c4) {
    const ctx4 = c4.getContext('2d');
    const led = document.getElementById('s4-led');
    const ledLabel = document.getElementById('s4-led-label');
    const coverBtn = document.getElementById('s4-cover-btn');
    const forceBtn = document.getElementById('s4-force-btn');
    const guardReadout = document.getElementById('s4-guard-readout');

    let reg = '1';
    let coverOpen = false;
    let forced = false;

    const REGIMES = {
      '1': {
        title: 'STAGE 04 · REGIME I · FIXED-STEP OSCILLATION FLOOR (ENGAGE RULE c = ηh_max/36)',
        normalHTML:
          '<b style="color:var(--tk-acid);">Action: Set c = ηh_max/36 (or ε_g = √ε in Shampoo, ε = 1.1ε* in ZO)</b><br>' +
          '• <b>Adam (24,8) &amp; (32,10)</b>: Wall rises from 3.2725 → 5.2279 (<b>+1.9554</b>) and 3.5903 → 4.7384 (<b>+1.1481</b>).<br>' +
          '• <b>Measured ĥ without M*</b>: c = ηĥ/36 reaches 5.1896 (<b>+1.6755</b>) and 4.6694 (<b>+1.1431</b>).<br>' +
          '• <b>Grafted Shampoo</b>: c = ηh_max/36 lifts wall by <b>+1.5937</b> on (24,8) and <b>+1.7425</b> on (32,10).',
        forcedHTML:
          '<b style="color:var(--tk-green);">Override Engaged: c = ηh_max/36 Active!</b><br>' +
          'Fast-mode period-two flip (A &gt; 38) is suppressed; all 60/60 runs converge below 10⁻⁹ at A ≤ 36.'
      },
      '2': {
        title: 'STAGE 04 · REGIME II · COSINE SCHEDULE η(t) → 0 (DO NOT RAISE c!)',
        normalHTML:
          '<b style="color:var(--tk-amber);">Action: Keep small default c = 10⁻⁸ under cosine decay η₀ = 0.01 → 0</b><br>' +
          '• As η(t) → 0, strong modes drop below L = 38 late while small c gives weak modes ∫η(t)dt / c &gt; 36T / h_max.<br>' +
          '• <b>Cosine Default (c=10⁻⁸)</b> reaches <b>5.5607</b> on (24,8) (beating fixed-step rule 5.2707 by <b>+0.2901</b>; 0.5181 on earlier seeds) and <b>4.8242</b> on (32,10) (matching 4.7521 within 0.0721).',
        forcedHTML:
          '<b style="color:var(--tk-red);">OVERRIDE PENALTY: Combining Cosine with Large c Halves ∫η(t)dt / c!</b><br>' +
          '• Raising c to η₀h_max/36 under cosine lowers the wall by <b>-0.6936</b> on (24,8) and <b>-0.4317</b> on (32,10) below cosine default (0.4036 and 0.3596 below fixed-step rule)!'
      },
      '3': {
        title: 'STAGE 04 · REGIME III · FULL-BATCH LOGISTIC REGRESSION ALREADY AT L(β₁)',
        normalHTML:
          '<b style="color:var(--tk-amber);">Action: Leave default alone or raise η (default already rides a·h_max = L)</b><br>' +
          '• Across four (ρ, β₁) shapes, default η=0.01 walls (3.4130, 3.6991, 3.4114, 3.7771) already sit on a·h_max = L(β₁) (3.3953, 3.7116, 3.3933, 3.7712, within <b>0.0181</b>; rising 0.3656 from β₁=0.8→0.95 vs 0.3779 from L).',
        forcedHTML:
          '<b style="color:var(--tk-red);">OVERRIDE PENALTY: The 36-to-38 Safety Margin Costs Wall Height!</b><br>' +
          '• On population logistic (d=64, 128): rule sits <b>-0.0859, -0.0876</b> below default (3.5042 vs 3.5901; 2.9746 vs 3.0622).<br>' +
          '• On handwritten digits (r=16, 32): rule sits <b>-0.2930, -0.2266</b> below default (4.0086 vs 4.3017; 3.3587 vs 3.5854; η=0.1 reaches 4.4361, 3.6563; Böhning bound ĥ = 1/2+λ sits <b>1.4782, 1.2315</b> lower).'
      },
      '4': {
        title: 'STAGE 04 · REGIME IV · MINIBATCH GRADIENT NOISE √v̂ ≫ c (TUNE η INSIDE A*(B))',
        normalHTML:
          '<b style="color:var(--tk-red);">Action: Compare c against √v̂ first; tune η inside batch stability limit A*(B)</b><br>' +
          '• On digits (n=1,000, B ∈ {32, 256}), noise C = S(n-B)/[B(n-1)] keeps √v̂ ≫ c (A*(B) medians 3.708, 4.009 &amp; 20.847, 22.049; √v̂ predicted within 0.9987-1.0009 at η=0.01 and 0.9631-0.9873 at η=0.1; <b>12/12 walls</b> within 0.125 of forecast, -0.0774 to +0.0002).<br>' +
          '• Rule minus η=0.01 default is buried in noise: <b>-0.0006, -0.0024, -0.0008, -0.0029</b> (while η=0.1 leads by <b>0.6258 to 0.8469</b>).',
        forcedHTML:
          '<b style="color:var(--tk-red);">LEFT-PLATEAU TRAP (Forcing c = 1 ≫ √v̂ at A_M = 2, 11)!</b><br>' +
          '• 60,000-step minima stall at <b>0.1459, 0.1177, 0.1488, 0.1133</b> (<b>6.2571-28.8621×</b> the unfeedback floor)!<br>' +
          '• Within-seed median bias e_bias = 0.1428, 0.0876, 0.1486, 0.1328 exceeds across-stream SD e_var = 0.0331, 0.0680, 0.0233, 0.0869 by ratios <b>4.3708×, 1.3320×, 6.5508×, 1.4796×</b>!'
      }
    };

    function drawCompass4() {
      const W = c4.width, H = c4.height;
      ctx4.clearRect(0, 0, W, H);
      const padL = 48, padR = 24, padT = 24, padB = 26;
      const plotW = W - padL - padR, plotH = H - padT - padB;
      const xOfS = (s) => padL + (s / 6) * plotW;
      const yOfE = (e) => padT + (1 - Math.min(1, Math.max(0, e))) * plotH;

      const y05 = yOfE(0.05);
      ctx4.strokeStyle = '#ef4444';
      ctx4.setLineDash([4, 4]);
      ctx4.beginPath(); ctx4.moveTo(padL, y05); ctx4.lineTo(padL + plotW, y05); ctx4.stroke();
      ctx4.setLineDash([]);
      ctx4.fillStyle = '#ef4444';
      ctx4.font = '10px monospace';
      ctx4.fillText('0.05 wall threshold', padL + 6, y05 - 5);

      let wDef = 3.2725, wAlt = 5.2279, lblDef = 'Default c=10⁻⁸ (3.2725)', lblAlt = 'Rule c=ηh_max/36 (5.2279)';
      if (reg === '2') {
        wDef = 5.5607;
        wAlt = forced ? (5.5607 - 0.6936) : 5.2707;
        lblDef = 'Cosine Default c=10⁻⁸ (5.5607)';
        lblAlt = forced ? 'Forced Cosine + Large c (-0.6936 drop!)' : 'Fixed-Step Rule (5.2707)';
      } else if (reg === '3') {
        wDef = 4.3017;
        wAlt = 4.0086;
        lblDef = 'Digits Default r=16 (4.3017; η=0.1 -> 4.4361)';
        lblAlt = 'Rule c=ηh_max/36 (4.0086, -0.2930)';
      } else if (reg === '4') {
        wDef = 3.708;
        wAlt = 3.708 + 0.6258;
        lblDef = 'Minibatch η=0.01 Default & Rule (Δ -0.0006..-0.0029)';
        lblAlt = forced ? 'FORCED c=1 LEFT PLATEAU (min 0.1459..0.1133 > 0.05!)' : 'Tuned η=0.1 inside A*(B) (+0.6258..0.8469)';
      }

      /* Curve A: Default */
      ctx4.strokeStyle = '#8fa8ff';
      ctx4.lineWidth = 2;
      ctx4.beginPath();
      for (let i = 0; i <= 140; i++) {
        const s = (i / 140) * 6;
        const eVal = Math.min(1, Math.exp(-Math.log(20) * Math.pow(9 / 2, wDef - s)));
        const x = xOfS(s), y = yOfE(eVal);
        if (i === 0) ctx4.moveTo(x, y); else ctx4.lineTo(x, y);
      }
      ctx4.stroke();

      /* Curve B: Rule / Override */
      ctx4.strokeStyle = (forced && reg !== '1') ? '#ef4444' : '#d4ff4f';
      ctx4.lineWidth = 2;
      ctx4.beginPath();
      for (let i = 0; i <= 140; i++) {
        const s = (i / 140) * 6;
        let eVal;
        if (reg === '4' && forced) {
          eVal = Math.min(1, 0.1459 + (1 - 0.1459) * (s / 6));
        } else {
          eVal = Math.min(1, Math.exp(-Math.log(20) * Math.pow(9 / 2, wAlt - s)));
        }
        const x = xOfS(s), y = yOfE(eVal);
        if (i === 0) ctx4.moveTo(x, y); else ctx4.lineTo(x, y);
      }
      ctx4.stroke();

      ctx4.fillStyle = '#8fa8ff';
      ctx4.fillText('■ ' + lblDef, padL + 8, padT + 14);
      ctx4.fillStyle = (forced && reg !== '1') ? '#ef4444' : '#d4ff4f';
      ctx4.fillText('■ ' + lblAlt, padL + 8, padT + 30);
    }

    function updateUI4() {
      const info = REGIMES[reg];
      ledLabel.textContent = info.title;
      mainEl.innerHTML = info.normalHTML;
      guardReadout.innerHTML = forced ? info.forcedHTML : 'Cover locked · Operating in recommended protocol state.';
      led.className = (forced && reg !== '1') ? 'state flip-a' : 'state';
      drawCompass4();
    }

    document.querySelectorAll('[data-s4-reg]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-s4-reg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        reg = btn.getAttribute('data-s4-reg');
        coverOpen = false;
        forced = false;
        coverBtn.textContent = '1. LIFT SAFETY COVER';
        forceBtn.disabled = true;
        forceBtn.style.opacity = '40%';
        forceBtn.style.cursor = 'not-allowed';
        updateUI4();
      });
    });

    coverBtn.addEventListener('click', () => {
      coverOpen = !coverOpen;
      coverBtn.textContent = coverOpen ? '1. COVER LIFTED (ARMED)' : '1. LIFT SAFETY COVER';
      forceBtn.disabled = !coverOpen;
      forceBtn.style.opacity = coverOpen ? '1' : '40%';
      forceBtn.style.cursor = coverOpen ? 'pointer' : 'not-allowed';
      if (!coverOpen) { forced = false; }
      updateUI4();
    });

    forceBtn.addEventListener('click', () => {
      if (!coverOpen) return;
      forced = !forced;
      updateUI4();
    });

    updateUI4();
  }
})();
</script>
