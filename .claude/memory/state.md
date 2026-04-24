---
status: active
type: state
owner: claude
last-updated: 2026-04-24T14:30:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main`
**Active task:** None — Phase 2 (claude side) closed; awaiting Will's pending Phase 2 tasks (2.13 apply Supabase schema, 2.Z author meta-eval fixtures) before Phase 3 can begin.
**Pause point:** End of Phase 2 scaffolding + spike resolution. Hand-rolled JSON Schema validator written and tested (25/25). Community-node install added to docker-compose.yml.
**Blockers:** None from claude's side. Will has: 2.13 + 2.Z + docker compose restart to pick up community-node install.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Will:** `docker compose down && docker compose up -d` to pick up the expanded docker-compose.yml (community node install happens on fresh container start).
2. **Will:** task 2.13 — open Supabase SQL editor, paste `schemas/supabase-schema.sql`, execute. Verify with `SELECT count(*) FROM deal_memos;` returning 0.
3. **Will:** task 2.Z — author `test-cases/meta-eval/intentionally-bad-memo.json` and `intentionally-good-memo.json` based on investment-professional judgment. **Critical procedural separation:** do NOT read `DESIGN.md §3.10` or design plan §4 six-criteria list before writing. Bad fixture must include at least one off-criteria defect (strategic incoherence — facts right, narrative wrong). ~45 min. Both files validate against `MemoGenerationOutput` schema.
4. **Then Phase 3 begins.** Claude Code owns tasks 3.1 through 3.17w (workflow track) and 3.P1 through 3.P8 (prompt track). First substantive claude task: 3.1 Form Trigger node + 3.2 Coordinator (Set node emitting run_id, deal_id, source_manifest).
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- D-2 confirmation deferred to Phase 3 task 3.6 (wire Contradiction Agent AI Agent node; confirm tool-use works in-n8n with qwen3.5-plus via DashScope).
- D-4 (Langfuse community node vs manual HTTP) — Phase 3 task 3.24.
- Community node package names (`rorubyy/n8n-nodes-openai-langfuse`) — verify at Phase 3 task 3.24; update docker-compose.yml if the string is wrong.
- I-9 latency implication: if Phase 4 demos stall due to reasoning-token overhead (~40s/run), may need to switch some specialists to non-reasoning `qwen-plus` or use `reasoning_effort: low` if DashScope exposes it.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-24T14:30:00-04:00
<!-- section:read-watermark:end -->
