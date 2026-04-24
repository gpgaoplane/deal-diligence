---
status: active
type: adapter
owner: claude
last-updated: 2026-04-24T02:15:00-04:00
read-if: "you are Claude starting work in this repo"
skip-if: "never"
---

# Claude — Project Adapter

## First read (mandatory, in this order)

1. `AGENTS.md` — framework entrypoint for any AI agent working here.
2. `AI_AGENTS.md` — shared contract, onboarding checklist, behavioral rules.
3. `.collab/INDEX.md` — file registry. Use delta-read: files newer than your `state.md` watermark.
4. `.claude/memory/state.md` — your live work state.
5. `.claude/memory/context.md` — durable project invariants.
6. `.claude/memory/decisions.md` — locked decisions + past design choices.
7. `docs/STATUS.md` — project-wide phase state.
8. `docs/project-conventions.md` — uncertainty ladder, commit format, prompt checklist, n8n JSON rules.
9. `CONTEXT.md` — project scope, locked decisions, rationales (§5.10). Authoritative; maintained by Claude Chat; do not edit.
10. `DESIGN.md` — component internals, data contracts, frameworks. Maintained by Claude Chat; do not edit.
11. `IMPLEMENTATION.md` — phased execution plan. Maintained by Claude Chat; you may check off completed tasks and update §12 Current Status.

## Your files

- Memory: `.claude/memory/` (state, context, decisions, pitfalls — core five minus the work log)
- Work log: `docs/agents/claude.md` (append-only; every substantive entry ends with a Receipt per `.collab/PROTOCOL.md`)

## Platform-specific notes

<!-- collab:platform-notes:start -->
- **Global vs project memory.** `~/.claude/memory/` holds Will's universal preferences (untouched by this project). `.claude/memory/` is this project's truths. Never cross-contaminate — project-specific content never goes to global.
- **Session start.** On every new session: read `AI_AGENTS.md` → `.collab/INDEX.md` → own `state.md` → any other-agent files with `last-updated > watermark` → `docs/STATUS.md`. Update `state.md` watermark.
- **Uncertainty.** Walk the ladder in `docs/project-conventions.md §1`. Don't guess past rung 6.
- **Commits.** Format: `[component] action — brief description`. Atomic, one logical change per commit, imperative mood, stage files by name. See `docs/project-conventions.md §2`.
- **Prompts.** Every specialist prompt in `prompts/` must pass the 7-part checklist in `docs/project-conventions.md §3`. Three high-stakes prompts (Extraction, Contradiction, Memo Generation) route through Claude Chat before commit.
- **Red Flag Detector stays deterministic.** No LLM calls, no `Math.random`, no time-dependent logic. Pure functions. See invariant I-2.
- **Workflow JSON is source of truth.** After any n8n UI change, `./scripts/export-workflow.sh` and commit the diff.
- **Codex interaction.** Don't pre-emptively request review. When Codex flags an issue, read fully. Disagreements: surface both positions, wait for Will. Never silently adopt Codex changes.
- **Fan-out discipline.** Every substantive task walks the 10-question checklist (`.collab/PROTOCOL.md`) and emits a Receipt in your work log. Over-update beats under-update.
- **Free file creation.** You may create any file you judge necessary, but add frontmatter and register in `.collab/INDEX.md` in the same turn.
<!-- collab:platform-notes:end -->

## Handoff and pickup

When Claude finishes a handoff-worthy chunk (e.g., branch complete, major refactor done, cross-cutting change that needs review), write a handoff block:

```
npx @gpgaoplane/multi-agent-collab handoff <to-agent> --from claude --message "..." --files "a b c"
```

When the user says "take the baton" or "pick up handoff," run:

```
npx @gpgaoplane/multi-agent-collab catchup preview --agent claude --handoff
```

…and follow the instructions in the surfaced handoff block. After validation, close the handoff:

```
npx @gpgaoplane/multi-agent-collab handoff close <id> --from claude
```
