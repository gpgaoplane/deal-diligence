---
status: active
type: conventions
owner: shared
last-updated: 2026-04-24T02:30:00-04:00
read-if: "you are any agent making non-trivial changes — commits, prompt drafts, workflow edits, code"
skip-if: "read-only exploration or clarification-only tasks"
---

# Project Conventions — Deal Diligence Workspace

Shared operational rules that apply to any agent working on this project (Claude Code, Codex, or future). Scope-level decisions live in `CONTEXT.md`; durable invariants live in each agent's `memory/context.md`; this file is about *how you work*, not *what we're building*.

## 1. Uncertainty ladder

When unsure how to proceed, walk the ladder in order. Only descend a rung if the current one has no answer.

1. `CONTEXT.md` — is there a locked decision or rule?
2. `DESIGN.md` — is there a design spec or data contract?
3. `IMPLEMENTATION.md` — is there an acceptance criterion or phase gate?
4. Existing code/config in the repo — is there a pattern to follow?
5. Your own `memory/context.md` and `memory/decisions.md`
6. Still unclear → `// TODO-CLARIFY: <question>` in code (or a Watch-out block in your work log) and proceed with best interpretation.

**Stop and ask Will** (do not guess) only when: a credential is needed that isn't in `.env.example`, two documented specs contradict each other, or a locked decision seems wrong for the task at hand.

## 2. Commit format

`[component] action — brief description`

Examples:
- `[prompts] add extraction agent system prompt with IC memo taxonomy`
- `[n8n] wire contradiction agent with vector store tool access`
- `[code] implement customer concentration threshold check in red flag detector`
- `[collab] bootstrap multi-agent-collab framework (v0.3.0)`

**Atomic commits.** One logical change per commit. Stage files by name — never `git add -A`. Imperative mood, explain why not what.

**Escape hatches:**
- `ARCHITECTURAL-CONCERN:` prefix — genuine concern with a locked decision; stop work and wait for Will.
- `// TODO-CLARIFY:` code comment — uncertainty recorded; proceed with best interpretation.

## 3. Specialist agent prompt checklist

Every prompt in `prompts/` must contain all seven elements:

1. **Role statement** — who the agent is.
2. **Framework specification** — named analytical framework (IC Memo Taxonomy, Triangulation Analysis, Institutional LP Diligence Checklist, Sagard Thesis Alignment, Six-Criteria Quality Check).
3. **Input description** — what it receives from the previous stage.
4. **Output schema** — exact JSON structure, with a concrete example. Must match `schemas/agent-output-schemas.json`.
5. **Explicit constraints** — no hallucination, no uncited claims, no out-of-schema fields.
6. **Edge-case handling** — what to do when data is missing, unclear, or conflicting.
7. **Citation rules** — for any agent emitting claims (all except Red Flag Detector, which is deterministic JS).

Close the prompt with: "Return ONLY a JSON object matching this schema." Keep prompts under ~2000 tokens.

**Three high-stakes prompts route through Claude Chat before commit:** Extraction, Contradiction, Memo Generation. Workflow: Claude Code drafts → Will pastes to Claude Chat → Claude Chat refines → Claude Code commits refined version. The other three (Gap Analysis, Portfolio Fit, Evaluator) ship from Claude Code drafts unless quality issues surface during iteration.

## 4. n8n workflow JSON conventions

- Node names are descriptive (`Extraction Agent`, not `AI Agent1`).
- Credentials referenced by ID, never hardcoded.
- Nodes positioned logically on the canvas; avoid overlap and crossing connections.
- `n8n/workflow.json` is the source of truth; the running instance is not.
- After any UI change in n8n: run `./scripts/export-workflow.sh` → commit the diff.

## 5. Red Flag Detector — deterministic only

No LLM calls. No `Math.random`. No `Date.now()`-dependent logic. Thresholds and patterns live as named constants at the top of `code/red-flag-detector.js`. Export pure functions so the logic is unit-testable without n8n.

See `.claude/memory/context.md` I-2 for the invariant and its rationale.

## 6. Cross-agent interaction

- **Do not edit another agent's work log or memory files.** If Claude sees something wrong in `docs/agents/codex.md`, flag it in Claude's own log via a `Watch out:` block — do not silently fix.
- **Handoffs** go through `npx @gpgaoplane/multi-agent-collab handoff <to-agent>` — produces a structured block in your work log with a stable id.
- **Presence:** on session start, check `.collab/ACTIVE.md`. If another agent is on your branch, pause and prompt Will.
- **Codex review:** Will decides when to invoke Codex. When Codex flags an issue, Claude reads the full feedback. Disagreements: surface both positions in a follow-up work-log entry, wait for Will. Never silently adopt Codex's changes.

## 7. Document authority

| File | Owner | Claude Code may modify? |
|------|-------|--------------------------|
| `CONTEXT.md §5` (locked decisions) + `§5.10` (rationales) | Claude Chat / Will | **No** — scope-locked |
| `CONTEXT.md §6, §7, §8, §11` (structural + agent ops + strategic journal) | Claude Chat (primary) | Claude Code may update as framework conventions evolve |
| `CONTEXT.md` other sections | Claude Chat | No edits without approval |
| `DESIGN.md §1` (design philosophy) | Claude Chat / Will | **No** — scope-locked |
| `DESIGN.md` other sections | Claude Chat (primary) | Claude Code may update component-internal descriptions as implementation lands |
| `IMPLEMENTATION.md` phase gate acceptance criteria | Claude Chat / Will | **No** — scope-locked |
| `IMPLEMENTATION.md §12` (current status) + task checkoffs | shared | Claude Code may update |
| `AI_AGENTS.md` | framework (shared) | Only inside marker sections |
| `AGENTS.md` | framework | No |
| `.collab/*` | framework (shared) | `INDEX.md` on every file create/archive; `ACTIVE.md` on session start/end |
| `.claude/*` | claude | Yes (these are Claude's own files) |
| `.codex/*` | codex | No — do not cross-edit |
| `docs/STATUS.md` | shared | Yes, inside marker sections |
| `docs/agents/claude.md` | claude | Append-only |
| `docs/agents/codex.md` | codex | No — do not cross-edit |
| `docs/plans/*` | creator | Reference-only once committed (frontmatter `status: reference-only`) |
| `prompts/*.md` | claude (draft) → claude chat (final) | Draft yes; final routes through Claude Chat for three high-stakes prompts |
| `n8n/workflow.json`, `code/*`, `schemas/*`, `scripts/*`, `docker-compose.yml`, `.env.example` | claude | Yes |
| `.env` | Will | Never — must stay gitignored |

When in doubt about a file, don't modify it — surface the question.

## 8. End-of-Task Receipt

Every substantive task ends with a Receipt in `docs/agents/<you>.md`. See `.collab/PROTOCOL.md` for the format. Walk the 10-question checklist (`.collab/ROUTING.md`). **Over-update beats under-update.** Trivial read-only tasks use the short-form Receipt.
