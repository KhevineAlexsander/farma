---
name: find-skills
description: Use when the user asks "how do I do X", "is there a skill for X", "find a skill for X", or wants to extend the agent with a specialized capability (a framework, testing, deployment, design, docs, or workflow task) that an installable agent skill might already cover.
---

# Find Skills

## Overview

Search the open agent skills ecosystem (`npx skills`, browsable at https://skills.sh/) for an existing skill, vet it, and install it only with the user's consent. A skill is instructions the agent will follow later — treat installing one like adding a dependency.

## Quick Reference

| Command | Purpose |
| --- | --- |
| `npx skills find <query> [--owner <owner>]` | Search; results show install count and skills.sh link |
| `npx skills add <owner/repo> -l` | List skills in a repo without installing |
| `npx skills add <owner/repo@skill>` | Install into the current project |
| `npx skills add <owner/repo@skill> -g` | Install globally (user-level) |
| `npx skills list` / `remove <skill>` / `update` | Manage installed skills |
| `npx skills init <name>` | Scaffold a new skill |

Run `npx skills --help` for all options.

## Workflow

1. **Turn the request into keywords.** Domain + task: "make my React app faster" → `react performance`; "help with PR reviews" → `pr review`. If results are thin, try synonyms (`deploy` → `deployment`, `ci-cd`).
2. **Search** with `npx skills find <keywords>`. Add `--owner <owner>` to scope to a trusted source (e.g. `vercel-labs`, `anthropics`, `microsoft`).
3. **Vet before recommending:**
   - Installs: prefer 1K+; be skeptical under 100.
   - GitHub stars: open the repo. Under 100 stars → never your first recommendation, even with high installs (installs can be inflated).
   - Audits: the skills.sh page shows security audits (Socket, Snyk, etc.) — report any warning.
   - Content: read the skill's `SKILL.md` (on GitHub or skills.sh). Reject skills that run unexplained scripts, fetch remote code, or ask for credentials.
4. **Decide whether you already have consent:**
   - User already said to install ("install it", "instala", "set it up") → that is consent. Install the best vetted option in **project scope** (no `-g`) with `-y`, and tell them how to make it global. Do not ask again.
   - Otherwise → present 1–3 options, each with: name, one-line purpose, install count, stars, source, install command, skills.sh link. Ask which to install and whether project or global.
5. **Never install a skill that failed vetting**, even when the user said "install the first one".
6. **Confirm** with `npx skills list`, then continue with the user's original task.

Example:

```
Found "vercel-react-best-practices" — React/Next.js performance guidelines
from Vercel (vercel-labs, ~800K installs).

Install: npx skills add vercel-labs/agent-skills@vercel-react-best-practices
More:    https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices

Install it for this project or globally?
```

## When Nothing Fits

Say no suitable skill was found, offer to do the task directly, and mention `npx skills init <name>` if it's something they do often.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Recommending the top result unseen | Vet installs, stars, audits, and content first |
| Trusting install count alone | Check the repo's stars too |
| Installing globally by default | Default to project scope; global only when asked |
| Asking "should I install?" after the user already said to | Their request is the consent — install |
| Quoting skill names from memory | Copy the exact `owner/repo@skill` from `find` output — names change |
| Stopping after install | Return to the task the user originally asked for |
