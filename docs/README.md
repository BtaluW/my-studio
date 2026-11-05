# Docs

| Folder | What's in it | When to update |
|---|---|---|
| [`architecture/`](architecture/) | How the system works today and designs for what's next | When behaviour or structure changes |
| [`adr/`](adr/) | Architecture Decision Records: one decision per file, numbered | When a decision is made or reversed (never edit an accepted ADR's decision; add a new one that supersedes it) |
| [`runbooks/`](runbooks/) | Step-by-step tasks: setup, adding a beat, deploying | When a dashboard step or command changes |

## Index

- [Architecture overview](architecture/overview.md): what exists now
- [Integration design: Sanity, R2, Vercel](architecture/integration-design.md): proposed
- ADRs
  - [0001 Headless CMS: Sanity](adr/0001-sanity-as-cms.md)
  - [0002 Audio storage: Cloudflare R2](adr/0002-r2-for-audio.md)
  - [0003 Studio embedded at /studio](adr/0003-embedded-studio.md)
  - [0004 Demo catalog fallback for clones](adr/0004-demo-catalog-fallback.md)
- Runbooks
  - [Deploy to Vercel + subdomain](runbooks/deploy-vercel.md)
  - [Set up Sanity](runbooks/setup-sanity.md)
  - [Set up Cloudflare R2](runbooks/setup-r2.md)
  - [Add a beat](runbooks/add-a-beat.md)

## ADR template

```md
# NNNN Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
What forces are at play.

## Decision
What we chose.

## Consequences
What gets easier, what gets harder, what we'll watch.
```
