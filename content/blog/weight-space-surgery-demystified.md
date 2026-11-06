+++
title = "Weight-space surgery, demystified"
description = "An LLM agent's weight edit took Qwen3.5-0.8B from 7.9% to 48.1% on MATH-500. The public logs show the gain sits almost entirely in answers that used to run out of tokens. Our own rank-one cut on TinyLlama-1.1B moved the hidden states, but under greedy decoding it did not change one generated token on the prompts it was built for."
date = 2026-11-07
authors = ["Kit Kyo · A2O Labs"]

[taxonomies]
tags = ["llm", "evaluation", "weight-editing", "reproduction"]

[extra]
show_author = true
+++

7.9% to 48.1% on MATH-500, from editing 0.016% of the weights. That is the headline of the MIT CSAIL post [Sparks of Weight-Space Programming](https://rikiyat.github.io/blog/weight-space-programming/), published on November 2. An agent studies Qwen3.5-0.8B, writes an edit straight into its weights, and the model's math score goes up six times. GSM8K went from 13.8% to 67.1% in the same run.

Within a day people were [predicting models that edit each other's weights without backprop](https://x.com/Yuchenj_UW/status/2117469786234106143).

The nice thing about this one is that the logs are public. The [log repo](https://github.com/RikiyaT/lm_understand-logs) has 1,125 agent turns across eight experiments, the eval JSONs, per-problem tables and the edit itself. The [edited checkpoint](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming) is on Hugging Face. So nobody has to argue about the headline. You can open the files and look.

We did that. Then we tried a cut of the same kind on TinyLlama-1.1B and watched the generated text instead of a score. Short version: almost all of the 6x comes from answers that used to run out of tokens. Our own rank-one cut moved the hidden states, and under greedy decoding it did not change one generated token on the prompts it was built for. Neither did 23 variations on it, up to six times the strength and seven layers at once.

## What the 7.9% measures

Experiment 8 evaluates the unedited Qwen3.5-0.8B with thinking mode on. Sampling follows the model card's thinking-mode settings: `temperature=0.6, top_p=0.95, top_k=20, presence_penalty=1.5`, and `max_tokens=32768`.

At that setting the model mostly never stops. In `eval/unedited/merged.json`, 93.0% of the 2,000 MATH-500 generations hit the cap, 1,860 of them. Only 7.0% finish at all. GSM8K: 89.2% hit the cap. IFEval: 65.9%.

Why would a 0.8B model spend 32,768 tokens on one MATH-500 problem? It loops. The thinking trace falls into a repeating pattern and runs until the cap cuts it off. The agent's own metric shows it: in the base model's truncated practice answers, 95.8% of the 8-word windows in the last 2,500 words are repeats. The repo knows this too. A comment in the evaluation profiles says switching thinking on "exposed the repetition pathology that the model card warns about". The same file quotes the model card itself: "Qwen3.5-0.8B operates in non-thinking mode by default".

The cleanest count is the agent's confirmation set: 1,152 practice problems (576 GSM8K, 576 MATH), one sample each, before and after the edit. Unedited, 1,038 of them (90.1%) hit the cap and 114 finished. Of those 114, 107 were right. That's 93.9% on finished answers, from a model whose headline score is 7.9%. Fifteen truncated answers also scored, because a correct `\boxed{}` showed up inside the thinking trace before the cap. Total: 122 of 1,152.

So the 7.9% mostly counts how often a 0.8B model in thinking mode manages to close its thinking block inside 32,768 tokens. When it does close it, it is usually right.

What about thinking off? The repo never ran MATH-500 that way. The same profile comment records the first pilots, which ran with thinking off. The unedited model "read 55.5 % and 50.8 % in two 128-answer passes", and "variance on 128 answers was larger than any edit effect". Then thinking went on. Separately, a [log-level audit thread](https://x.com/dummerspast39/status/2117416640132366570) reports "Default non-thinking mode w/ zero edits: 47% on MATH-500. astras edit: 48%". That 47% is the auditor's run, not the authors'. We quote it because the headline only compares against the thinking-mode baseline.

## What the edit did

The agent was told where to look. The first-turn prompt (`exp8_math/runs/p50c/turns/t001/prompt.txt`) asks it to diagnose failures first and lists the categories. One of them is "being cut off at the token limit (often while repeating itself in its thinking)". The instruction after that: "Go after the largest category you can explain." With 90% of answers cut off, the largest category is easy to find.

It went after it. The direction comes from four matched pairs: the same math prefix continued once productively and once stuck on a sentence repeated three or four times ("But is 20 the total? No, it is the remaining time."). One teacher-forced forward pass over those 8 sequences gives the mean residual difference over the last 36 tokens at layers 15 and 19, normalized to a unit vector `u`. Every `down_proj` column then gets a score: how strongly it writes along `u`, times how differently it fires on the two sides. The top 64 are kept, and:

```
W = W0 - 6 * outer(u, mask64 * (u @ W0))      # layers 15 and 19, mlp.down_proj
```

Two layers × 64 columns × 1,024 rows is 131,072 numbers. That's the 0.016%. Note the 6. On those 64 columns the write along `u` goes from `c` to `-5c`, so this is a sign flip with gain, more than a projection. Getting there took 20.3 hours, 158 agent turns and 50 batches of forward-pass evaluation.

Here is the confirmation set, split by whether the base model finished:

| Base model on the 1,152 problems | Problems | Right before the edit | Right after |
|---|---|---|---|
| Hit the 32,768-token cap | 1,038 | 15 | 589 |
| Finished | 114 | 107 | 107 |
| All | 1,152 | 122 | 696 |

579 problems flipped from wrong to right, and 576 of them sit in the first row. The finished row went from 107 to 107: three gained, three lost. On MATH-500 the share of generations hitting the cap fell from 93.0% to 33.1%. On the confirmation set, the repeated share of 8-word windows in the truncated answers fell from 95.8% to 40.2%.

The edit is real, by the way. The authors re-ran the published checkpoint on an H200 with the same decoding settings and got 51.0% on MATH-500, cap share 31.6%. The number reproduces. What it counts is how many answers a looping model can finish, and fixing that from inside the weights is a genuinely interesting trick. It is a decoding fix, though, and the headline reads as a math one. (Every leaderboard should print `max_tokens` next to the score. This is why.)

## The control in the same post

The authors ran the obvious control themselves, and that deserves credit. Same harness on Gemma 3 270M IT, a model that only hits its 8,192-token cap on 8.5% of MATH-500. Its own README describes its mistakes as ordinary arithmetic and algebra errors, with no single dominant failure mode. Gemma ran under the settings from its own model card, thinking off and temperature 1.0, with budgets of 0, 5, 10, 25 and 50 forward-pass batches. Each nonzero budget produced a different edit. They halved 64 MLP output columns across layers 6 to 17, scaled 4 columns by 1.5, doubled one neuron in layer 17, and scaled one attention head by 1.1 while halving 8 columns.

Lenient MATH-500 accuracy across those budgets: 6.8%, 7.05%, 7.6%, 7.7%, 7.0%. Strict `\boxed{}` accuracy: 2.75%, 3.5%, 3.1%, 3.8%, 2.6%.

The post says it in its own words: "Across all budgets, lenient MATH-500 stayed between 6.8% and 7.7% (strict `\boxed{}` between 2.6% and 3.8%). Editing weights could remove an obstacle that hid an ability, but it could not add an ability the model lacked." One reply in the thread had it shorter: ["Removing a blocker, not adding a skill. Yet."](https://x.com/morgachevml/status/2117524308813828326) [Another](https://x.com/token_budget/status/2117567806652695019) made the same point from the Gemma run.

So the 6x measures the size of the obstacle. Qwen in thinking mode had a huge removable one. Gemma had no single failure to remove, and its score stayed flat.

None of this makes the headline wrong as arithmetic. 7.9 and 48.1 are both in the JSON. The protocol let a decoding failure count as missing math ability. The logs show that this is what happened: the gain sits almost entirely in answers that used to run out of tokens.

## We tried cutting directions out of TinyLlama

Reading logs is cheap. We wanted to watch the mechanism on a model we could run end to end. So we built a small version of the experiment on TinyLlama-1.1B: the 3T-token intermediate checkpoint, 1,100,048,384 parameters, 22 layers.

Our contrast set has two sides. On one, 16 templated algebra prompts repeat "Check: x = 1." three times and stop on a bare "Check:" (the number changes per prompt). On the other, 16 one-sentence encyclopedia facts end in a period. For each candidate layer from 14 to 18 we took the MLP output at the last position and subtracted the control mean from the loop prompts. The top singular vector of that difference is `v`, signed toward the loop side. Layer 15 had the highest energy ratio (1.4795; layer 14 was next at 1.3375). The edit is a plain rank-one projection on layer 15's `down_proj`:

```
W' = (I - v v^T) W
```

That's 7,680 free numbers, 0.0007% of the model. We locked the layer, the direction and the thresholds on those 16 + 16 development prompts before touching 16 + 16 evaluation prompts. Those come from a different template: a "Verify:" chain instead of "Check:", and different facts.

The hidden states moved as constructed. Layer 15's output along `v` goes from 2.8427 to exactly 0 on the development loop prompts (2.3429 to 0 on evaluation). At the final layer the component along `v` drops by 1.8686 and 1.6119, about two thirds of what was removed. Control prompts moved along `v` too, by +1.2754 and +1.2922, with next-token KL of only 0.0044 and 0.0053 nats.

Does that carry-through say anything about loops? No. Take a direction orthogonal to `v` with a similar layer-15 projection on the loop prompts (2.3725, against 2.8427 for `v`), and remove it instead. The final layer drops 2.4443 along that direction and moves only 0.1256 along `v`. An unrelated contrast, the first eight control prompts against the last eight, carries through at a ratio of -0.8730, against -0.6573 for `v`. The residual stream carries forward whatever you take out at layer 15, whatever the direction means.

What does `v` track, then? Repetition alone doesn't do it. Repeated prose ending on "Note:" projects 1.4092 on it. The same repeated prose ending on a period: 0.1157. A single, unrepeated prose note ending on "Note:": 0.1395. And our own loop prompts, cut back to their last full stop and still repeating, fall from 2.8427 to 0.3244. The direction lights up when the text has repeated itself and stops on a cue asking for the next item. Our contrast set mixed those two things together, so the direction picked up both.

Then behavior, which is what the cut was for. On the 16 development loop prompts the top next token is unchanged, 16 of 16 (KL 0.0051 nats). We then generated 128 greedy tokens per prompt on both sets, a readout we added after the fact. Under greedy decoding every loop continuation is token-for-token identical before and after the cut, 16 of 16 on development and on evaluation. The repeated 4-gram share of the generated tokens stays at 0.9405 and 0.93.

The control prompts are the ones that changed. Their continuations agree with the unedited model on 75.5% of token positions in development and 62.5% in evaluation. Only 11 of 16 and 8 of 16 stay identical for all 128 tokens. One metric warning: every control continuation also repeats some 4-gram, so a yes/no "does it repeat" flag reads 1.0 for loops and controls alike. The graded share separates them, 0.93 to 0.94 for loops and 0.62 for controls.

Maybe one rank-one cut at one layer is too gentle. So we ran 24 versions on the development prompts, the original included, each read the same way:

- the same cut at layers 8, 10, 12, 14, 16, 18 and 20, each with its own direction, at one and three times strength;
- layer 15 at two, three and six times (at six the component flips sign and comes back five times as large, like the 6 in the Qwen edit);
- layers 14 to 16 together, and all seven layers from 12 to 18;
- the top 4 and top 16 singular vectors at layer 15 instead of one;
- only the 256 `down_proj` columns that write most strongly along `v`, at one and three times strength.

In all 24, greedy decoding gives the same 16 development loop continuations as the unedited model, token for token, and the repeated share stays at 0.9405. The cuts were not too small to matter. Six times at layer 15 leaves the control continuations matching the unedited model on 17.8% of token positions, with next-token KL of 0.41 nats. Cutting layers 12 to 18 at once leaves 46.7%.

The loop prompts felt the cuts as well. At the end of a loop prompt, the next-token distribution moves by 0.34 nats on average with six times at layer 15, 0.28 with three times at layer 18, and 0.20 with layers 12 to 18 cut together. We added this reading after the first run. None of these shifts flipped the top token at any of the 128 greedy steps. What sampling would do with the shifted distributions, we did not measure.

We wrote the selection rule down before generating anything. An edit qualifies if it keeps at least 75% of control token positions and at most 0.05 nats of next-token KL on the control prompts. Among those, the lowest loop repetition share wins. Ties go to the smallest change, then to grid order, which starts with the original. Four single-strength cuts qualified, at layers 10, 14, 15 and 20. They are the same size and tie at 0.9405, so grid order picks the original layer-15 cut. Its evaluation read reproduces the 128-token numbers above exactly. The one wrinkle in that rule is under rule 2 below.

So we cut one direction out of TinyLlama, then tried 23 other versions of the cut, and under greedy decoding the loops did not stop. What the cuts did change was the control continuations. Their edit on Qwen did change generations, as the drop from 95.8% to 40.2% shows. The difference worth chasing is between a model that loops in its own decoding regime and prompts we built to loop.

## Four rules we're adopting

None of these is new. All four would have changed what got reported, on their side and on ours.

**1. Subtract a zero-edit baseline and a shuffled-edit baseline.**

Report the gain over the unedited model and over an edit of the same size in a random direction, all at the same decoding settings. For the Qwen result, the zero-edit model in its default non-thinking mode is the baseline that matters. For our cut, the random direction has to carry as much projection at the edit layer as the real one. Our own first version of this control used random directions whose layer-15 projections on the loop prompts were between -0.0721 and -0.0089, against 2.8427 for `v`. They had almost nothing to remove, so that comparison could not have come out against us.

**2. Lock the evaluation step before you read it.**

Layer, strength, checkpoint and decoding settings get fixed on development data and written down, and the evaluation set is read once. We locked layer 15, the direction and our thresholds on the development prompts before running the evaluation prompts. We also wrote the sweep's selection rule down before generating anything. After the first full run we still found a second reading of our own wording: agreement as the share of control continuations identical for all 128 tokens. Because of it we read the layer-10 cut on the evaluation prompts as well, a second look at that set. Its greedy loop continuations were identical too, 16 of 16, repeated share 0.93. When that happens, report both readings and say which one came later. On the Qwen side, the agent's 1,152-problem confirmation table is exactly this kind of read, and it is the most informative file in the repo.

**3. Score one committed answer, and give hedges no credit.**

The strict scorer in the logs falls back to scanning the whole thinking trace when `</think>` never closes. That is how 15 of the 1,038 truncated base answers still counted as correct. The lenient scorer, Gemma's headline metric, takes the last number in the text when there is no box. Small effects in this run. They grow with the truncation rate, and the truncation rate is the thing that moved.

**4. Build contrasts as counterfactual twins: same template, two mutually exclusive facts.**

The two sides should differ only in the property you claim to target. The agent's four pairs were twins of this kind, one prefix continued productively and repetitively. Ours were not. Our loop prompts repeat and stop on a "Check:" cue, our controls do neither, and the direction turned out to need both.

## What we'd run next

The test that matters is the original setting. Qwen3.5-0.8B in thinking mode at 32,768 tokens loops on its own, and the authors' edit is public. The readout we want is the cap share and the graded repeated-4-gram share of the generated tokens, before and after. Put them next to a random edit of equal size and the non-thinking zero-edit baseline. Our TinyLlama prompts only loop because we built them to, so the next model has to be one that loops without help. On TinyLlama itself, the cheap next step is sampling: the cuts do move the loop prompts' next-token distributions, and greedy decoding hides that.

If you came here from our earlier posts on [the Adam epsilon wall](/blog/adam-epsilon-wall-and-replay/) and [flat directions where the data is absent](/blog/flat-where-the-data-isnt/), this is the same exercise on a different number. If you run the Qwen version, we'd like to see the cap shares.
