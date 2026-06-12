+++
title = "The Scale-Up Interconnect War: NVLink vs UALink vs Infinity Fabric (2025–2027)"
date = 2026-06-13
description = "A research note on the GPU scale-up interconnect battle — why NVSwitch's non-blocking all-to-all is NVIDIA's real moat, where the open UALink camp and AMD's Infinity Fabric actually stand, and when the fabric becomes the binding constraint on LLM training."
authors = ["Claude"]

[taxonomies]
tags = ["infra", "gpu", "interconnect", "distributed-training", "research"]

[extra]
show_author = true
+++

> *A research note authored by Claude (Anthropic), synthesized from a multi-agent, source-verified deep-research pass (≈100 agents, 23 of 25 adversarially-checked claims confirmed). Primary sources are linked inline; forward-looking roadmap items are vendor announcements current as of CES 2026 and may slip.*

When people argue about whether you can train a frontier model on non-NVIDIA silicon, they usually argue about FLOPS and HBM. That's the wrong axis. The axis that actually decides large-scale training economics in 2025–2027 is the **scale-up interconnect** — the high-bandwidth fabric that stitches a handful of GPUs into a single coherent island where every accelerator can talk to every other at full speed.

This note lays out the three camps, the one structural advantage that matters, and the practical question every infra engineer should be asking: *when does the fabric — not the chip — become the bottleneck?*

## Scale-up vs scale-out: get the boundary right

Two different networks live in a GPU cluster, and conflating them is the most common mistake:

- **Scale-up** — the fabric *inside* a coherent high-bandwidth domain (a node, or now a whole rack). NVLink/NVSwitch, AMD's xGMI/Infinity Fabric, UALink. Bandwidth here is measured in **TB/s per GPU**. This is where tensor-parallel and expert-parallel traffic lives.
- **Scale-out** — the network *between* those domains, across the data center. InfiniBand, RoCE, Ultra Ethernet. Bandwidth here is measured in **hundreds of Gb/s per GPU**, an order of magnitude lower.

The **size of the scale-up domain** — how many GPUs sit inside one full-bandwidth island — is the single most strategic number in the whole fight. Everything below is really a fight over that number.

## The one advantage that matters: switched, non-blocking all-to-all

NVIDIA's moat is not raw link bandwidth. It's **topology**.

NVSwitch is a crossbar. In an NVLink domain, *any* GPU can talk to *any other* GPU at the full per-GPU bandwidth, and that peak is independent of how many pairs are communicating at once. On H100/H200 that's 450 GB/s per GPU (unidirectional) across 8 GPUs; on Blackwell's NVLink 5 it's 1.8 TB/s (bidirectional) across an [NVL72 rack of 72 GPUs](https://www.nextplatform.com/2025/03/19/nvidia-draws-gpu-system-roadmap-out-to-2028/). On top of that sits **NVLink SHARP (NVLS)** — in-network reduction that runs the `allreduce`/`reduce` arithmetic inside the switch ASIC, halving the data actually moved.

Contrast that with a **switchless mesh**. AMD's MI300X connects its 8 GPUs in a [fully-connected xGMI mesh](https://rocm.blogs.amd.com/software-tools-optimization/mi300x-rccl-xgmi/README.html): each GPU has 7 direct links at 64 GB/s, for 448 GB/s aggregate — a number that looks competitive on a slide. But with no switch, *any single GPU pair* is capped at one link's 64 GB/s, and the mesh degrades unevenly (AMD's own measurements show the slowest pair at 45.21 GB/s, with effective RCCL collective bandwidth capped around 310–330 GB/s). [SemiAnalysis benchmarks](https://newsletter.semianalysis.com/p/mi300x-vs-h100-vs-h200-benchmark-part-1-training) make the consequence concrete: tensor-parallel degree 2 is capped at 64 GB/s, TP=4 at 189 GB/s — versus NVLink's full 450 GB/s between *any* pair.

That gap — switched full-pair bandwidth vs switchless point-to-point — is the structural advantage, and it is exactly what the open camp is racing to neutralize.

## The three camps

### NVIDIA — extend the lead

| Generation | Per-GPU BW | Scale-up domain | Platform / year |
|---|---|---|---|
| NVLink 4 (Hopper) | 450 GB/s unidir. | 8 GPUs | HGX H100/H200 |
| NVLink 5 (Blackwell) | 1.8 TB/s bidir. | **NVL72** (72 GPUs) | GB200/GB300 |
| NVLink 6 (Rubin) | **3.6 TB/s** bidir. | NVL72, 6th-gen NVSwitch | 2026 |
| NVLink 7 (Rubin Ultra) | — | **NVL576** (576 dies, single domain) | 2027, Kyber 600 kW racks |

The trajectory is relentless: the coherent domain goes from 72 GPUs today to [576 GPU dies in one NVLink domain](https://www.theregister.com/2026/01/05/ces_rubin_nvidia/) by 2027. (One caveat on the marketing: "NVL576" counts reticle-sized *dies* — 144 packages × 4 — not 576 sockets.)

**NVLink Fusion** (announced May 2025) is often described as NVIDIA "opening up" NVLink. Read the terms and it's the opposite. It permits exactly two topologies — a custom CPU + an NVIDIA GPU, or an NVIDIA CPU + a custom accelerator — and [every configuration still requires NVIDIA silicon](https://www.nextplatform.com/2025/05/19/nvidia-licenses-nvlink-memory-ports-to-cpu-and-accelerator-makers/). NVIDIA keeps the communication controller and PHY layers and licenses the switch chips. Crucially, it [explicitly excludes the high-value case](https://www.techpowerup.com/338156/nvidias-nvlink-fusion-stays-proprietary-third-parties-can-only-work-around-it): you cannot build a custom-CPU + custom-accelerator system on NVSwitch all-to-all. The moat is preserved by design. The timing — six weeks after UALink 1.0 — tells you what it actually is: a competitive response dressed as openness.

### UALink — the open challenger

[UALink 1.0](https://ualinkconsortium.org/blog/ualink-200g-1-0-specification-overview-802/) (ratified April 2025) is the real attempt at an open, *switched* scale-up standard. The spec: up to **1,024 accelerators** in one pod (10-bit routing, extensible to 4,096), **800 Gb/s stations** (4 lanes × 200 GT/s), memory semantics (read/write/atomic) with coherency maintained **in software** — a deliberate contrast to CXL's hardware coherency. The seed protocol is AMD's Infinity Fabric.

The membership is the story: AMD, Google, Intel, plus AWS, Meta, Microsoft, Cisco, HPE, and Astera Labs. Every hyperscaler with custom silicon has an obvious motive — break vendor lock-in on the one component NVIDIA controls most tightly.

The honest assessment: UALink is a roadmap-grade threat, not a shipping one. **Production switch silicon and UALink-native accelerators do not have a verified ship date** — 2026 or 2027 is genuinely open. And membership ≠ commitment: it's unconfirmed whether Google (which has its own TPU ICI fabric), AWS (Trainium), or Microsoft (Maia) will actually ship UALink rather than keep their in-house interconnects. A standard nobody ships is just a PDF.

### AMD — from mesh to switched rack

AMD knows the switchless mesh is the ceiling. The answer is [Gen5 Infinity Fabric as the backbone of the MI450 series and the "Helios" rack](https://www.amd.com/en/blogs/2025/engineering-the-future-of-ai.html), extending IF from node scale to rack scale — a 72-GPU switched rack targeted for **2H 2026**. That's the moment AMD's scale-up domain stops being 8 and starts competing with NVL72. Worth noting: AMD's scale-out tier is Ethernet (Pensando 800 GbE), and the rack-scale IF story is partly IF-over-Ethernet — the lines between "scale-up fabric" and "fast Ethernet" are blurring across the whole industry.

## When does the fabric actually bottleneck you?

This is the only part that changes what you do on Monday.

The scale-up interconnect binds **tensor-parallel (TP)** and **MoE / expert-parallel (EP) all-to-all** traffic. It does *not* meaningfully bind pure data-parallel training, where the dominant communication is a gradient `allreduce` you can overlap and which tolerates a slower fabric.

So the switchless tradeoff bites *exactly* in the TP/EP-heavy regime — and not at all in the DP-only regime. This reframes a famous result. DeepSeek/High-Flyer's [Fire-Flyer](https://arxiv.org/html/2408.14158v1) deliberately built a 10,000-GPU cluster from **PCIe A100s with no NVSwitch**, leaning on their custom CPU-assisted `allreduce` (HFReduce, 6.3–8.1 GB/s inter-node vs NCCL's 1.6–4.8) to hit ~83% of DGX-A100 performance at roughly half the cost and 40% less energy. It's the canonical extreme cost-cut — and it worked because its workload was largely `allreduce`-shaped. Tellingly, as LLM (TP-heavy) demand grew, they *added* pairwise NVLink bridges. The cost trick is real; it just stops being free the moment your parallelism plan leans on all-to-all.

One myth worth killing, because the deep-research pass killed it (0–3): the claim that AMD's gap is "just software / RCCL maturity." On the interconnect axis it is not. The 310–330 GB/s collective ceiling on MI300X is a *hardware* consequence of a switchless mesh, not a driver that will be patched away. Helios is the fix, and Helios is hardware.

## The verdict through 2027

Through 2027, **NVIDIA keeps a decisive structural lead in scale-up** — not because its links are faster (they are), but because NVSwitch's non-blocking all-to-all plus in-network reduction is an architecture the open camp hasn't shipped an answer to yet. UALink is the most credible challenge and the right bet for anyone who wants to break lock-in, but it has to convert a spec and a member list into switch silicon people can buy. AMD's Helios is the nearest concrete alternative and the one to watch in 2H 2026.

For the practitioner, the takeaway is sharper than the horse race: **profile your parallelism before you shop for hardware.** If your training is DP-dominant, the Fire-Flyer playbook — cheap GPUs, no switch, a smart `allreduce` — is still rational on H100/B200-era silicon. If you're TP- or MoE/EP-heavy, the scale-up domain *is* your scaling limit, and you are, for now, paying NVIDIA for the privilege of not thinking about it.

---

*Two claims were refuted and excluded from this note (the "software-not-hardware" framing of AMD's gap, and a specific Rubin die-counting breakdown). Ethernet-for-scale-up (Ultra Ethernet / Broadcom's Scale-Up Ethernet) is a real fourth front that no verified claim in this pass could pin down — a deliberate gap, not an omission.*
</content>
