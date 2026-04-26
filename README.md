---
status: active
type: readme
owner: shared
last-updated: 2026-04-26T17:00:00-04:00
read-if: "you are a human or agent landing on this repo and want the quickstart"
skip-if: "you already know this repo"
---

# Deal Diligence

**Sagard AI Deal Diligence Workspace** — take-home for Sagard's AI Builder / Forward Deployed Engineer role (evaluator: Parinaz Sobhani, Head of AI). The original deadline of 2026-04-24 has passed; development continues without an active deadline.

Converts a fragmented deal packet (S-1s, CIMs, expert transcripts, news) into a cited, auditable investment memo with contradiction detection, gap analysis, and deterministic red-flag surfacing. The advance/pass decision stays human.

**Submission writeup:** [`docs/submission-writeup.md`](docs/submission-writeup.md) — 250-word framing + reading order + production-changes list.

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
- **LLM:** Qwen3-Max (`qwen3-max-2025-09-23`) via Alicloud DashScope (parameterized for one-variable swap to Claude via Bedrock).
- **7-agent pipeline:** Coordinator → Extraction → Contradiction → Gap Analysis → Red Flag Detector (deterministic JS, not LLM) → Portfolio Fit → Memo Generation → Evaluator (LLM-as-judge with meta-eval calibration).
- **Persistence:** Supabase (Postgres). **Notification:** Slack. **Observability:** Langfuse Cloud (traces + versioned prompts + scores).
- **Multi-agent collaboration:** [`multi-agent-collab`](https://github.com/gpgaoplane/multi-agent-collab) v0.3.0 — Claude Code as primary builder, Codex as reviewer, Claude Chat as Will's strategist (not a framework agent).

## Running

```bash
cp .env.example .env     # fill in real values for the 4 services
./scripts/up.sh          # start local n8n (http://localhost:5678)
./scripts/down.sh        # tear down
```

Then import the workflow once the n8n container is up:

```bash
./scripts/import-workflow.sh   # imports n8n/workflow.json
```

Trigger a run via the Form Trigger node in the n8n UI, uploading the test-case PDFs from `test-cases/coreweave/` or `test-cases/cerebras/`.

## Status

**Phases 0 – 5 complete; Phase 6 in flight.** End-to-end pipeline runs on CoreWeave (58/60 evaluator score, 17/17 valid citations) and Cerebras (generalization-confirmed, no code change) producing IC-grade memos persisted to Supabase, notified to Slack, and traced in Langfuse. 52-node workflow (45-node main path + 5-node error sub-flow + 2-node Langfuse pair). Active model: `qwen3-max-2025-09-23`.

**Phase 4 (CoreWeave Dev Iteration) ✅ closed.** Memo anti-empty-shell rules; meta-eval discrimination = 25 points (target ≥ 20); RFD coverage 4-of-10 → 8-of-10 functional detectors after the P-6 wrapper fix; Memo severity semantics for strengths; Extraction S-1 retrieval-query refinements.

**Phase 5 (Cerebras Generalization) ✅ closed.** Pipeline ran on the 4 Cerebras docs at `test-cases/cerebras/` end-to-end with no code changes. RFD detected `related_party_above_threshold` MEDIUM (OpenAI Warrant — true positive) + `dual_class_structure` LOW (Class A common stock). Cross-source numerical agreement S-1 ↔ analyst report. P-5 prompt fixes confirmed model-class (not deal-class).

**Phase 6 (Demo + 250-word writeup)** in flight. Submission writeup, demo runbook, and sample-runs scaffold landed at `da02148`. Remaining: Loom recording + URL slot-in + writeup voice revision (all on Will).

See [`docs/STATUS.md`](docs/STATUS.md) for the live progress.
