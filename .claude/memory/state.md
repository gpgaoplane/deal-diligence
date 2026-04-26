---
status: active
type: state
owner: claude
last-updated: 2026-04-26T17:00:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (pushed to origin at `d3320c9` after Phase 5 closure).
**Active task:** **Phase 6 IN FLIGHT — submission writeup + demo runbook authored, awaiting Loom recording.** Three new files: `docs/submission-writeup.md` (237 words in the 250-word section), `docs/demo-runbook.md` (3-4 min Loom script), `docs/sample-runs/README.md` (capture index, directory empty pending recording-day captures). Loom URL is a placeholder in the writeup — Will fills after recording.

**Phase 5 ✅ CLOSED — Cerebras generalization confirmed end-to-end (carried forward).** Pipeline ran on the 4 Cerebras docs at `test-cases/cerebras/` with no code changes. Will reported memo + evaluator clean, no quality regressions. Workflow still at `versionId: phase4-step3a-v25`. Active chat model: `qwen3-max-2025-09-23`.

Phase 5 verification highlights (from Will's pasted node outputs):
- RFD: `regulatory_filing_count: 1`, `total_chunks: 289`, ≥3 flags including `related_party_above_threshold` MEDIUM (OpenAI Warrant — true positive) + `dual_class_structure` LOW (Class A common stock).
- Extraction (Cerebras S-1): cash $1.336B, operating loss $145.86M (FY2025), competitors NVIDIA/AMD/Intel/AWS/Azure/Google extracted.
- Cross-source consistency: Cerebras Analyst Report (#2) reports operating_loss $145.9M / revenue $510M / 76% YoY — agrees with S-1 figures.
- Multi-source disambiguation `(#2)` working.
- P-5 prompt fixes generalized to a deal the model had never seen during Phase 4 calibration → confirmed model-class fixes, not deal-class fixes.

**Pause point:** Phase 6 work-streams partially landed; Loom recording is on Will. After Loom URL slot-in, Phase 6 closes and Phase 7 (submission to Pari) opens.
**Blockers:** None.

Phase 4 step 3 final verification (Will's live re-run on workflow v25 with new model):
```
rfd_meta.regulatory_filing_count: 1  ✓ (was 0; P-6 fix worked)
red_flags[]: 5 entries  ✓ (was 2; 3 detectors awakened)
  - customer_concentration_extreme HIGH  (Press Release, was already firing)
  - material_weakness HIGH               (S-1, Phase 4.A target ✓)
  - related_party_above_threshold MEDIUM (S-1, P-6 BONUS — silently dead before)
  - revenue_growth_anomalous LOW         (Press Release, was already firing)
  - dual_class_structure LOW             (S-1, P-6 BONUS — silently dead before)
```

LLM swap to qwen3-max-2025-09-23 operational. Pipeline ran end-to-end without errors; downstream Memo + Evaluator nodes produced output (per P-5 regression test, the per-element scoping fixes generalized to the new model — empirically verified).

Phase 4 step 3 backlog items B + C also confirmed in this run (carried forward from prior verification, model-independent fixes).

**Pause point:** Phase 4 ALL ENTRY STEPS COMPLETE. **Phase 5 (Cerebras generalization) is the next phase.** Re-run the same workflow against the 4 Cerebras docs at `test-cases/cerebras/`. No code changes expected; this is a generalization test of the CoreWeave-validated pipeline against a different deal packet.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 step 1 ✅** Memo anti-empty-shell rules (`60c4cc2`).
2. **Phase 4 step 2 ✅** meta-eval discrimination = 25 (`c3bf7af` + `077b9b2`).
3. **Phase 4 step 3a ✅** RFD regex (`43f6d28`) + wrapper P-6 fix (`48cb64d`). Verified live: 5 red_flags, 3 newly-awakened detectors.
4. **Phase 4 step 3b ✅** Memo severity semantics (`5e775a5`) — verified.
5. **Phase 4 step 3c ✅** Extraction S-1 retrieval (`5e775a5`) — verified.
6. **Phase 4 step 3 ✅ CLOSED** — RFD coverage jumped 4-of-10 → 8-of-10 functional detectors. LLM swap operational.
7. **Phase 5 ✅ CLOSED** — Cerebras generalization confirmed; pipeline is deal-agnostic.
8. **Phase 6 IN FLIGHT** —
    - ✅ `docs/submission-writeup.md` authored (237 words in the headline section; outranges, demo-walk references, what-I'd-change list, invariants pointer)
    - ✅ `docs/demo-runbook.md` authored (recording sequence + pre-checklist + failure-mode contingencies + things-to-not-show)
    - ✅ `docs/sample-runs/README.md` authored as capture index; directory empty until Loom day
    - ⏳ **Will: record Loom per `docs/demo-runbook.md`, then paste URL into the placeholder in `docs/submission-writeup.md`** (search for `<Loom URL placeholder>`)
    - ⏳ **Will: optionally capture the Loom-day run's Parse Memo Response + Parse Evaluator Response into `docs/sample-runs/`** (recommended but not blocking)
    - ⏳ **Will: review `docs/submission-writeup.md` voice/content** — current draft is from my voice; revise for personal tone before submitting
9. **Phase 7** — submission to Pari (writeup + Loom URL + repo URL).
10. **Other backlog (do not gate forward):**
    - **Audit truncated Cerebras flag_type** — first flag in Phase 5 RFD output was cut at the chunk boundary; raw_text was a Cerebras S-1 responsible-AI risk-factor sentence with the boilerplate "harm our reputation or business" tail. Could be a noisy `material_weakness` / `going_concern` regex hit on boilerplate, or a benign true positive — needs investigation. Not a Phase 5 blocker since memo + evaluator clean.
    - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
    - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
    - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
    - Proactive empty-shell audit of Gap Analysis + Portfolio Fit prompts per P-5 regression-test guidance.
    - Empty-upstream meta-eval mode is anti-discriminative; document as script limitation or add `--require-upstream` flag.
    - Extend `scripts/inject-prompts.js` to also handle the RFD wrapper jsCode (currently manual-paste per D-6).
    - Author `code/rfd-wrapper.js` extracted from the workflow.json embed, with unit tests for source_type-lookup (P-6 mitigation).
    - Audit other workflow.json jsCode consumers of `aggregated.source_manifest` for the same shape-confusion bug (P-6 general lesson). Quick grep target.
    - Tune `related_party_above_threshold` to require disclosure-of-amount context, not just heading mentions (currently fires on the S-1 TOC).
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-26T16:12:15-04:00
<!-- section:read-watermark:end -->
