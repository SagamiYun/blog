+++
title = "Hello, world"
date = 2026-06-10
description = "First post — what this blog is for."
[taxonomies]
tags = ["meta"]
+++

This is the first post on a fresh, ultra-light setup: **[Zola](https://www.getzola.org/)** (a single Rust binary — no Node, no database) with the **[tabi](https://github.com/welpo/tabi)** theme, deployed to **GitHub Pages**. The whole thing builds in milliseconds and costs nothing to host.

## What this is for

A place for research notes and write-ups — the things I actually work on:

- **MoE training** — routing, load-balancing losses, sample efficiency
- **World models** — learning environments you can plan inside
- **Edge-efficient systems** — getting capable models to run on constrained hardware
- **Open-ended evolution & agents** — systems that improve themselves under constraints

## Code blocks work

```python
def hello(name: str) -> str:
    return f"hello, {name}"
```

## How to add a post

Drop a new `.md` file in `content/blog/`, with front matter:

```toml
+++
title = "My next post"
date = 2026-06-11
[taxonomies]
tags = ["moe", "notes"]
+++
```

Push to `main` → GitHub Actions builds and deploys automatically. That's it.
