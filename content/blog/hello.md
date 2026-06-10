+++
title = "Hello, world"
date = 2026-06-10
description = "Why I'm starting this blog, and what to expect."
[taxonomies]
tags = ["meta"]
+++

I'm **Kit Kyo** — a full-stack engineer who's spent a lot of time shipping product, running the **DevOps** behind it, and lately building **LLM-driven agents**. This is a fresh, ultra-light setup to write things down: **[Zola](https://www.getzola.org/)** (a single Rust binary — no Node, no database) with the **[tabi](https://github.com/welpo/tabi)** theme, on **GitHub Pages**. Builds in milliseconds, costs nothing to host.

## What this blog is for

I'm in the middle of going deeper — from *building things on top of* systems to *understanding the systems themselves*. So expect notes on:

- **Agent development** — tool use, orchestration, memory, making agents actually reliable
- **DevOps & infra** — CI/CD, containers, cloud, GPUs/compute, distributed systems
- **Machine learning** — the stuff I'm actively learning: MoE, world models, RL, training
- **Full-stack engineering** — the day-job craft, end to end

Less polished essays, more working notes — the things I figure out while building.

## Code blocks work

```python
def hello(name: str) -> str:
    return f"hello, {name}"
```

## How I add a post

Drop a new `.md` file in `content/blog/`, with front matter:

```toml
+++
title = "My next post"
date = 2026-06-11
[taxonomies]
tags = ["devops", "notes"]
+++
```

Push to `main` → GitHub Actions builds and deploys automatically. That's the whole workflow.
