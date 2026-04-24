---
status: active
type: decisions
owner: claude
last-updated: 2026-04-24T03:30:00-04:00
read-if: "you need Claude's major design decisions"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Decision Log

Major project-architecture decisions are locked in `CONTEXT.md §5` with rationales in `§5.10`. This log cross-references those rather than duplicating rationales — the authoritative text lives in `CONTEXT.md`.

Claude Code's own decisions (implementation-level choices Claude made while building) go below the `<!-- section:entries:start -->` marker with the full D-n format.

<!-- section:entries:start -->

## D-0 — Refined design and implementation plans under docs/plans/ — 2026-04-24T03:30:00-04:00
**Context:** Original `DESIGN.md` and `IMPLEMENTATION.md` at repo root were planning v1. Framework's `docs/plans/YYYY-MM-DD-*` convention expects dated, framework-native refinements. User requested robust / fool-proof / loophole-free refined plans.
**Alternatives:** (A) edit in place at root; (B) create framework-native peers under `docs/plans/` and flip originals to `reference-only`.
**Choice:** (B). Wrote `docs/plans/2026-04-24-deal-diligence-{design,implementation}.md` as authoritative. Flipped originals to `reference-only` with explicit pointer banner.
**Rationale:** Aligns with framework convention and user's stated archive-later endgame (once originals go stale, `collab-archive` moves them). Preserves full history — originals are unchanged, so anyone referencing them still finds their content.
**Tradeoffs:** Larger initial diff; two-doc-per-artifact state until archival. Accepted per user instruction.
**Refinements surfaced:** section-targeted retrieval + union pass, two-layer citation enforcement (format schema + validity post-check), retry-and-failure chain-effect spec, meta-eval with authorship procedural separation, manual Langfuse span for RFD, cost model with non-cost scaling bottlenecks, iteration caps, routing-matrix row mappings per task, verification commands per acceptance criterion, parameterized Receipt template, Codex engagement protocol with numbered triggers.

## D-1 — Adopt multi-agent-collab framework — 2026-04-24T02:15:00-04:00
**Context:** Existing collaboration model (Claude Code + Codex + Claude Chat) was specified in prose in `CONTEXT.md §8` with no presence board, no delta-read, no enforced End-of-Task Receipts.
**Alternatives:** (a) Keep prose-only; (b) Build custom collab scripts; (c) Adopt `multi-agent-collab` skill.
**Choice:** (c). Ran `npx @gpgaoplane/multi-agent-collab init` at repo version 0.3.0.
**Rationale:** Formalizes exactly the collaboration model already committed to. Provides INDEX, routing matrix, receipts, presence, delta-read for free. Non-destructive migration (marker-guided merge).
**Tradeoffs:** ~15 new framework files; Receipt ceremony adds ~30s per substantive task. Deemed worth it given Pari's evaluation emphasis on governance/audit.

## Locked decisions (cross-references to CONTEXT.md §5.10)

These are Will's/Claude-Chat's decisions, not Claude Code's. Rationales in `CONTEXT.md §5.10`.

- **Orchestration: local n8n via Docker** — see `CONTEXT.md §5.10` ("Why local n8n over n8n Cloud").
- **LLM: Qwen3.5-Plus via Alicloud DashScope** — see `CONTEXT.md §5.10` ("Why Qwen3.5-Plus over Claude/GPT/Gemini").
- **Storage: Supabase (Postgres)** — see `CONTEXT.md §5.10` ("Why Supabase over Airtable/Google Sheets/Notion").
- **Observability: Langfuse Cloud** — see `CONTEXT.md §5.10` ("Why Langfuse for observability").
- **Red Flag Detector: deterministic JS, not LLM** — see `CONTEXT.md §5.10` ("Why deterministic Red Flag Detector").
- **Citation enforcement at schema level** — see `CONTEXT.md §5.10` ("Why citation enforcement in Memo Generation").
- **Evaluator agent (LLM-as-judge) as quality gate** — see `CONTEXT.md §5.10` ("Why the Evaluator agent").
- **CoreWeave (dev) + Cerebras (demo) test pairing** — see `CONTEXT.md §5.10` ("Why CoreWeave for dev + Cerebras for demo").
- **Three-agent build pattern (Claude Code + Codex + Claude Chat)** — see `CONTEXT.md §5.10` ("Why Claude Code + Codex + Claude Chat three-agent pattern").

Do not reopen any of these without new information and Will's approval. If Claude Code spots a genuine concern, flag via commit prefix `ARCHITECTURAL-CONCERN:` or `// TODO-CLARIFY:` comment.

<!-- section:entries:end -->
