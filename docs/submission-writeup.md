---
status: active
type: submission
owner: shared
last-updated: 2026-04-26T16:45:00-04:00
read-if: "you are reviewing the take-home submission to Sagard / Parinaz Sobhani"
skip-if: "never"
---

# Sagard AI Deal Diligence Workspace — Submission

**Author:** William Gao
**Submitted to:** Parinaz Sobhani, Head of AI, Sagard
**Repo:** https://github.com/gpgaoplane/deal-diligence

---

## Two-paragraph summary (~250 words)

The Sagard AI Deal Diligence Workspace converts a fragmented deal packet (S-1, press releases, analyst reports) into a cited, auditable IC memo with contradiction detection, gap analysis, and deterministic red-flag surfacing. The advance/pass decision stays human; everything else is reviewer-assist. n8n orchestrates seven specialists — Coordinator → Extraction (section-targeted retrieval per document) → Contradiction (cross-source via tool-use loop) → Gap Analysis → deterministic Red Flag Detector → Portfolio Fit (Sagard thesis alignment) → Memo Generation → Citation Validity → Evaluator (six-criteria meta-eval). LLM is Qwen3.5 via Alicloud DashScope, parameterized for one-variable swap. Persistence in Supabase, alerting in Slack, observability in Langfuse. Validated end-to-end on CoreWeave (58/60 evaluator score, 17/17 valid citations) and Cerebras S-1 packets without code change.

The engineering decisions are auditability-first. Citations are enforced at the JSON Schema layer plus a post-hoc validator against the Coordinator's source manifest. The Red Flag Detector is pure JavaScript — no LLM, no `Math.random`, no time-dependent logic — so audit replay is bit-for-bit reproducible. The Memo prompt's per-claim abstain rule prevented a model-swap empty-shell failure. Cost is ~$1/deal in tokens but cost is not the production bottleneck — reviewer throughput, false-positive fatigue, prompt drift across model versions, trace storage growth, and the audit-query layer once memos compound are. The scale path is explicit: migrate retrieval to Supabase pgvector when execution-data crosses ~50MB; extract workflow-embedded JS into versioned modules with unit tests; harden schema validation with the documented retry-then-bypass machinery.

---

## How to read this submission

| Order | What | Purpose |
|---|---|---|
| 1 | This file (`docs/submission-writeup.md`) | The 250-word framing |
| 2 | Demo recording (Loom URL — see below) | End-to-end walkthrough on a real deal packet |
| 3 | `README.md` | Quickstart + stack |
| 4 | `docs/plans/2026-04-24-deal-diligence-design.md` | Authoritative system design (700 lines) |
| 5 | `docs/plans/2026-04-24-deal-diligence-implementation.md` | Phased execution plan (500 lines) |
| 6 | `docs/sample-runs/` | Captured outputs from end-to-end runs |
| 7 | `n8n/workflow.json` | Live workflow (52 nodes) |
| 8 | `prompts/*.md` | All 7 specialist system prompts |
| 9 | `code/red-flag-detector.js` + `code/test/` | Deterministic detector + 43 unit tests |
| 10 | `docs/agents/claude.md` | Full work log with Receipts; the engineering ledger |

## Demo recording

`<Loom URL placeholder — Will to fill after recording per docs/demo-runbook.md>`

## What I'd change in a production version

Six items, ordered by triggering condition:

1. **Retrieval store** → Supabase pgvector, when n8n execution-data per run crosses ~50MB. Today it's an in-process aggregate chunk store (~23MB on CoreWeave, well below threshold).
2. **Workflow-embedded JS** → versioned `code/*.js` modules with unit tests + an `inject-prompts.js`-style sync step at deploy. Today the RFD wrapper, citation validator, and 5 specialist Build Request nodes paste source inline. The mitigation script (`scripts/inject-prompts.js`) handles the 5 prompts; extending to wrappers is backlog.
3. **Schema validation** → retry-then-bypass machinery (per design plan §3.3). Today the parsers do shape projection only; insufficient for production but sufficient for prototype.
4. **Specialist orchestration** → keep n8n for visual-debug ergonomics, but consider per-specialist concurrency (Extraction is the obvious parallelization win across documents).
5. **Audit-query layer** → indexed Supabase views over `deal_memos.citations` and `red_flags` so reviewers can query "show me every memo where customer-concentration HIGH was cited" without scanning JSON columns.
6. **Reviewer throughput** → human-in-the-loop UI for the flagged_for_review path (today: Slack notification + linked memo). The HITL boundary itself is invariant per the I-1 directional-signal framing; only the surface changes.

## Key invariants (from `.claude/memory/context.md`)

- **I-1**: Pipeline outputs are directional signals. The advance/pass decision is human.
- **I-2**: Red Flag Detector is fully deterministic. No LLM, no `Math.random`, no time-dependent logic.
- **I-3**: Citations enforced at the JSON Schema layer.
- **I-8**: Cost (~$1/deal) is NOT the scaling bottleneck. Reviewer throughput, FP fatigue, prompt drift, trace storage, and audit-query layer are.
- **I-9**: LLM is parameterized. Model swap is one env variable.

## Acknowledgments

Multi-agent collaboration framework is `multi-agent-collab` v0.3.0 by gpgaoplane. Two AI agents contributed: Claude Code (primary; Phase 1–5 execution) and Codex (Phase 3 Extraction + Contradiction baseline; review on medium-stakes prompts). Design and high-stakes prompt refinement were assisted by Claude Chat. Authorship and architectural calls are mine.
