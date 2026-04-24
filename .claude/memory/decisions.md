---
status: active
type: decisions
owner: claude
last-updated: 2026-04-24T19:30:00-04:00
read-if: "you need Claude's major design decisions"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Decision Log

Major project-architecture decisions are locked in `CONTEXT.md §5` with rationales in `§5.10`. This log cross-references those rather than duplicating rationales — the authoritative text lives in `CONTEXT.md`.

Claude Code's own decisions (implementation-level choices Claude made while building) go below the `<!-- section:entries:start -->` marker with the full D-n format.

<!-- section:entries:start -->

## D-5 — Embeddings provider: OpenRouter (nvidia/llama-nemotron-embed-vl-1b-v2:free) — 2026-04-24T19:30:00-04:00
**Context:** Initial workflow used Alicloud DashScope `text-embedding-v4` (1024-dim). User requested switch to OpenRouter's `nvidia/llama-nemotron-embed-vl-1b-v2:free` for free-tier embeddings.
**Alternatives:** (A) keep Alicloud text-embedding-v4 (1024-dim, ~$0.0005/1K tokens); (B) switch to OpenRouter model (2048-dim, free); (C) pick a different OpenRouter embedding model; (D) use Voyage/Cohere/OpenAI.
**Risk verification (live curl test to OpenRouter /embeddings 2026-04-24T19:15):**
- ✅ `/embeddings` endpoint exists and accepts OpenAI-format requests
- ✅ Model `nvidia/llama-nemotron-embed-vl-1b-v2:free` returns valid embeddings (2048-dim)
- ✅ Response is OpenAI-compatible: `{data: [{embedding: [...]}], usage: {prompt_tokens, total_tokens, cost}}`
- ✅ Cost field = 0 on free tier
- Response echoes model as `private/openrouter/nvidia/llama-nemotron-embed-vl-1b-v2` (prefix added by OpenRouter; harmless)
**Choice:** (B). Wired up via generic `$env.EMBEDDING_API_KEY / BASE_URL / MODEL` naming (decoupled from ALICLOUD_* names so provider swaps are clean per invariant I-6).
**Rationale:** 2048-dim is more expressive than 1024. Free tier eliminates embedding cost entirely. Swap mechanism (env vars only, no code change) honors I-6.
**Tradeoffs:** (1) Free tier is rate-limited — a 346-chunk CoreWeave run may hit limits; if so, switch to paid tier or fall back to Alicloud text-embedding-v3. (2) Vision-language model used for text-only input; may waste some dimensions on unused vision capacity but embedding quality for text should be at least as good as the 1024-dim alternative. (3) Chunk-embedding-dim must match query-embedding-dim (both 2048 now) — retrieval unaffected since both use the same provider in-run.
**Fallback:** If OpenRouter rate-limits, revert: `EMBEDDING_API_KEY=<alicloud>`, `EMBEDDING_BASE_URL=<alicloud>`, `EMBEDDING_MODEL=text-embedding-v3`. Single env-var change; no workflow.json edits.

## D-4 — n8n env access opened for HTTP Request expressions — 2026-04-24T18:15:00-04:00
**Context:** HTTP Request node needs to read `ALICLOUD_API_KEY` / `EMBEDDING_API_KEY` from container env via `{{ $env.* }}` expressions.
**Alternatives:** (A) create n8n Credentials in UI for each provider (canonical n8n pattern); (B) inject secrets via a Set node referenced downstream (pollutes every item with keys); (C) set `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` to allow $env in expressions.
**Choice:** (C). Set the env var in docker-compose.yml.
**Rationale:** Local-dev prototype; docker-compose is the source of truth for secrets already. UI-managed credentials would add a manual setup step each time a dev rebuilds the container, and split secret storage between `.env` and n8n's internal DB.
**Tradeoffs:** Any workflow editor can read all container env vars via an expression. Acceptable for single-user local dev; production deployment would flip this back to `true` and use n8n Credentials. Recorded in `docker-compose.yml` header comment.

## D-3 — Schema validation: hand-rolled, not ajv — 2026-04-24T14:00:00-04:00
**Context:** Phase 2 spike 2.0b tested whether `ajv` can `compile()` schemas inside n8n's Code node with `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` (design plan §3.2 primary path).
**Alternatives:** (A) `ajv` inline in Code nodes; (B) `ajv` standalone-compiled to a pre-built validator file bundled with repo; (C) alternate validator (`@cfworker/json-schema`) that avoids runtime code generation; (D) hand-rolled validator per design plan §3.2 fallback.
**Spike result:** `require('ajv')` loads fine, but `ajv.compile(schema)` throws `EvalError: Code generation from strings disallowed for this context`. Root cause: n8n's Code node runs user JS inside a hardened VM sandbox (`vm2` / `isolated-vm`) that blocks `new Function()` — which ajv uses to generate validator functions at runtime. Not fixable via config; fundamental incompatibility between ajv's compile-to-function model and n8n's sandbox model. `NODE_OPTIONS=--disallow-code-generation-from-strings=false` is irrelevant (restriction enforced at sandbox layer, not Node process layer).
**Choice:** (D) hand-rolled validator at `code/json-schema-validator.js` per design plan §3.2 fallback.
**Rationale:** The design plan anticipated this exact failure mode — fallback spec already exists. Benefits: (a) zero external deps, (b) runs in sandbox without issues, (c) ~150 LOC covering the draft-07 subset we actually use, (d) full control over error messages for the retry-and-failure contract (§3.3), (e) no container-image customization required.
**Tradeoffs:** ~1-2h of validator implementation + unit tests. Risk of validator bugs (mitigated by unit tests against the 7 agent schemas). We lose ajv's `formats` (date-time, email, etc.) but we weren't using them.
**Split:** ajv remains available OUTSIDE the Code-node sandbox — for `scripts/run-meta-eval.js`, `scripts/validate-memo-citations.js`, `scripts/validate-fixture.js` (regular Node execution) and for local/CI schema-file linting. Same schema file; two validators chosen by context.
**Follow-up:** remove `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` from `docker-compose.yml` (no longer needed) OR leave it for the outside-sandbox scripts (harmless either way). Leaving for now.

## D-2 — Contradiction Agent: Variant A (tool-use), provisional — 2026-04-24T14:00:00-04:00
**Context:** Design plan §2.5 documented two prompt variants for Contradiction Agent — Variant A (tool-use via n8n AI Agent node with Simple Vector Store tool) and Variant B (stuffed-context). Spike 2.0a was to verify Qwen3.5-Plus tool-use reliability through DashScope + n8n AI Agent.
**Alternatives:** (A) Run full in-n8n AI Agent tool-use spike manually via UI. (B) Trust the API-level tool-use spike (direct curl to DashScope `/chat/completions` with `tools[]`) and confirm at Phase 3 wire-up. (C) Provisionally select Variant B (stuffed) as safer default.
**Spike result (API-level, 2026-04-24T13:15):** qwen3.5-plus returned well-formed `tool_calls` on first turn (`finish_reason: tool_calls`, valid JSON args in `function.arguments`). Multi-turn synthesis with fed-back `tool_result` worked cleanly — model cited sources from the retrieved content in the final answer. `reasoning_content` and `content` are cleanly separated in the response shape. Usage: 380 prompt + 126 completion tokens on turn 1; 482 + 351 on turn 2.
**Choice:** (B) — Variant A (tool-use), PROVISIONAL. Confirm at Phase 3 task 3.6 when wiring the actual AI Agent node. If in-n8n reveals issues (tool definition forwarding, response parsing, reasoning_content concatenation per I-9), flip to Variant B mid-Phase-3. Both prompts are already committed (prompts/contradiction-agent.tool-use.md and .stuffed.md).
**Rationale:** API-level evidence is strong. Risk is at the n8n AI Agent node's LangChain wrapper layer, not at the model. The fallback is a one-line prompt-path change (swap which prompt file is loaded into the AI Agent node), not a workflow rework. Cost of confirming via a separate in-n8n spike (~30 min UI work) outweighed by the fact that Phase 3 task 3.6 exercises this naturally.
**Tradeoffs:** If Phase 3 task 3.6 wire-up finds tool-use flaky in n8n, ~30 min of rework (swap prompt file + reconfigure AI Agent node). Accepted.

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
