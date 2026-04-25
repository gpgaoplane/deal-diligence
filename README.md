---
status: active
type: readme
owner: shared
last-updated: 2026-04-25T09:14:33-04:00
read-if: "you are a human or agent landing on this repo and want the quickstart"
skip-if: "you already know this repo"
---

# Deal Diligence

**Sagard AI Deal Diligence Workspace** — take-home for Sagard's AI Builder / Forward Deployed Engineer role (evaluator: Parinaz Sobhani, Head of AI). The original deadline of 2026-04-24 has passed; development continues without an active deadline.

Converts a fragmented deal packet (S-1s, CIMs, expert transcripts, news) into a cited, auditable investment memo with contradiction detection, gap analysis, and deterministic red-flag surfacing. The advance/pass decision stays human.

## Start here

**If you are an AI coding agent** (Claude Code, Codex, Cursor, etc.):
1. Read [`AGENTS.md`](AGENTS.md) — framework entrypoint.
2. Read [`AI_AGENTS.md`](AI_AGENTS.md) — shared contract, onboarding, behavioral rules.
3. Read [`CONTEXT.md`](CONTEXT.md) — project scope, locked decisions (§5), rationales (§5.10).
4. Read the authoritative plans: [`docs/plans/2026-04-24-deal-diligence-design.md`](docs/plans/2026-04-24-deal-diligence-design.md) and [`docs/plans/2026-04-24-deal-diligence-implementation.md`](docs/plans/2026-04-24-deal-diligence-implementation.md).
5. Read your own adapter: [`.claude/CLAUDE.md`](.claude/CLAUDE.md) or [`.codex/CODEX.md`](.codex/CODEX.md).

**If you are a human reader:**
- Project motivation and scope: [`CONTEXT.md`](CONTEXT.md)
- System design (authoritative): [`docs/plans/2026-04-24-deal-diligence-design.md`](docs/plans/2026-04-24-deal-diligence-design.md)
- Execution plan (authoritative): [`docs/plans/2026-04-24-deal-diligence-implementation.md`](docs/plans/2026-04-24-deal-diligence-implementation.md)
- Current phase and what's next: [`docs/STATUS.md`](docs/STATUS.md)
- v1 baselines for reference: [`DESIGN.md`](DESIGN.md), [`IMPLEMENTATION.md`](IMPLEMENTATION.md) (flagged `status: reference-only`)

## Stack

- **Orchestration:** local n8n via Docker Compose — workflow JSON is the version-controlled source of truth.
- **LLM:** Qwen3-Max (`qwen3-max-preview`) via Alicloud DashScope (parameterized for one-variable swap to Claude via Bedrock).
- **7-agent pipeline:** Coordinator → Extraction → Contradiction → Gap Analysis → Red Flag Detector (deterministic JS, not LLM) → Portfolio Fit → Memo Generation → Evaluator (LLM-as-judge with meta-eval calibration).
- **Persistence:** Supabase (Postgres). **Notification:** Slack. **Observability:** Langfuse Cloud (traces + versioned prompts + scores).
- **Multi-agent collaboration:** [`multi-agent-collab`](https://github.com/gpgaoplane/multi-agent-collab) v0.3.0 — Claude Code as primary builder, Codex as reviewer, Claude Chat as Will's strategist (not a framework agent).

## Running

Phases 1–2 (environment setup + scaffolding) are planned in the authoritative implementation plan. Once scaffolded:

```bash
./scripts/up.sh          # start local n8n (http://localhost:5678)
./scripts/down.sh        # tear down
```

## Status

Phase 0 (Planning Lock) complete. Framework migration complete. Refined design + implementation plans committed. Ready for implementation Phase 1 (Environment Setup) — see [`docs/STATUS.md`](docs/STATUS.md).
