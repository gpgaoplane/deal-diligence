---
status: active
type: state
owner: claude
last-updated: 2026-04-26T01:30:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (59+ commits ahead of origin/main; not pushed).
**Active task:** **Phase 4 step 3 verification round 1 surfaced a deeper bug — RFD wrapper P-6 fix landed; awaiting Will's live re-run.** Workflow at `versionId: phase4-step3a-v25`. Active chat model: `qwen3-max-2025-09-23` (swapped from qwen3-max-preview per Will's request).

Phase 4 progress:
- **Step 1 ✅** evaluator_score:0 debugged + Memo anti-empty-shell rules (`60c4cc2`).
- **Step 2 ✅** meta-eval discrimination = 25 with real CoreWeave upstream (`c3bf7af`); Evaluator empty-upstream handling (`077b9b2`).
- **Step 3a ✅ verified** RFD MATERIAL_WEAKNESS regex (`43f6d28`); 43/43 unit tests passing. The regex is correct.
- **Step 3a deeper bug ✅ fixed (P-6, commit pending)** — verification re-run on the Phase 4.A regex revealed `rfd_meta.regulatory_filing_count: 0` despite the S-1 being in the packet. Root cause: the RFD wrapper jsCode iterated `aggregated.source_manifest` expecting `{ source_name, source_type }` objects, but per D-6 it's a STRING array. The lookup was empty, all docs got `source_type: 'unknown'`, all 6 regulatory-only detectors silently no-opped. This bug shipped in Phase 3 closure and survived undetected through steps 1, 2, 3a. Fixed by replacing source_manifest-iteration with extractionOutputs-iteration (each ExtractionOutput carries source_type natively). P-6 captures the lesson.
- **Step 3b ✅ verified** Memo severity semantics — key_strengths[0] for "737% YoY revenue growth" now scores MEDIUM (was HIGH before).
- **Step 3c ✅ verified** Extraction S-1 retrieval — `headcount: 881`, `key_personnel: ["Michael Intrator (CEO)", "Brian Venturo (CTO)", "Brannin McBee (Chief Strategy Officer)"]`, exact revenue 1,915,426,000. The retrieval-query refinement worked.

LLM provider swap: `qwen3-max-preview → qwen3-max-2025-09-23`. Per Codex P-2, this is env-driven; only `.env` needs updating in addition to the docker-compose container restart. Workflow re-import IS needed for the RFD wrapper fix and the Langfuse fallback default.

**Pause point:** Will to (1) update `.env` with new ALICLOUD_MODEL value, (2) restart docker-compose container, (3) re-import workflow.json, (4) trigger CoreWeave run, (5) confirm `rfd_meta.regulatory_filing_count: 1` and `red_flags[]` includes `material_weakness HIGH` from the S-1.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 step 1 ✅** Memo anti-empty-shell rules (`60c4cc2`).
2. **Phase 4 step 2 ✅** meta-eval discrimination = 25 (`c3bf7af` + `077b9b2`).
3. **Phase 4 step 3a ✅** RFD MATERIAL_WEAKNESS regex extended (`43f6d28`); RFD wrapper source_type lookup fix (P-6, commit pending).
4. **Phase 4 step 3b ✅** Memo severity semantics — verified working in live run (key_strengths "737% YoY revenue growth" → MEDIUM not HIGH).
5. **Phase 4 step 3c ✅** Extraction S-1 retrieval — verified working in live run (headcount=881, 3 key_personnel populated).
6. **Phase 4 step 3 final verification (Will)** — re-import + re-run with new model + RFD wrapper fix. Acceptance: `rfd_meta.regulatory_filing_count: 1` AND `red_flags[]` includes `material_weakness HIGH` from the S-1. After this passes, Phase 4 step 3 closes.
7. **Phase 5** — Cerebras generalization (re-run pipeline against the 4 Cerebras docs; no code changes expected). Will also exercise whether qwen3-max-2025-09-23 retains qwen3-max-preview's eager-bypass pattern (P-5) — if our Memo + Evaluator prompt fixes still produce substantive output, the prompt-tightening was robust and not model-specific.
8. **Phase 6** — demo + 250-word written explanation.
9. **Phase 7** — submission to Pari.
10. **Other backlog (do not gate forward):**
    - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
    - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
    - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
    - Proactive empty-shell audit of Gap Analysis + Portfolio Fit prompts per P-5 regression-test guidance.
    - Empty-upstream meta-eval mode is anti-discriminative; either document as script limitation or add `--require-upstream` flag.
    - Extend `scripts/inject-prompts.js` to also handle the RFD wrapper jsCode in the Run Red Flag Detector node (currently manual-paste per D-6).
    - Author a `code/rfd-wrapper.js` extracted from the workflow.json embed, with unit tests for the source_type-lookup behavior (P-6 mitigation).
    - Audit other workflow.json jsCode consumers of `aggregated.source_manifest` for the same shape-confusion bug (P-6 general lesson). Quick grep target.
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T19:15:00-04:00
<!-- section:read-watermark:end -->
