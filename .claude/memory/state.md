---
status: active
type: state
owner: claude
last-updated: 2026-04-26T00:55:00-04:00
read-if: "you need to know Claude's current live work state"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Live State

<!-- section:current-state:start -->
**Branch:** `main` (57+ commits ahead of origin/main; not pushed).
**Active task:** **Phase 4 step 3 (CoreWeave quality backlog) IN PROGRESS — items A, B, C all addressed in code; awaiting live re-run verification.** Workflow at `versionId: phase4-step3c-v24`.

Phase 4 progress:
- **Step 1 ✅** evaluator_score:0 debugged + Memo anti-empty-shell rules (`60c4cc2`).
- **Step 2 ✅** meta-eval discrimination = 25 with real CoreWeave upstream (`c3bf7af`); Evaluator empty-upstream handling (`077b9b2`); 5 fixture files + harness projection patch.
- **Step 3a ✅** RFD MATERIAL_WEAKNESS regex extended for phrase-first verb forms (`43f6d28`); 43/43 RFD tests passing.
- **Step 3b** Memo prompt severity semantics added — explicit guidance for key_strengths.severity (deal materiality, not magnitude) vs key_risks.severity (danger to deal); anti-pattern call-out for HIGH-on-large-numbers (commit pending).
- **Step 3c** Extraction retrieval queries broadened for `company_overview` (added "number of employees", "full-time employees", "approximately employees as of December") and `management_assessment` (added "executive officers", "directors and executive officers", "named executive officers", "biographies") to bridge the semantic gap between query terms and S-1 phrasings (commit pending).

**Pause point:** Will to re-run live workflow on CoreWeave to verify (a) RFD now picks up material_weakness as a third HIGH flag, (b) Memo no longer tags magnitude-y strengths as HIGH severity, (c) S-1 Extraction now populates `headcount` and `key_personnel` from the Employees + Management sections.
**Blockers:** None.
<!-- section:current-state:end -->

<!-- section:next-steps:start -->
1. **Phase 4 step 1 ✅** Memo anti-empty-shell rules (`60c4cc2`).
2. **Phase 4 step 2 ✅** meta-eval discrimination = 25 (`c3bf7af` + `077b9b2`).
3. **Phase 4 step 3a ✅** RFD MATERIAL_WEAKNESS regex extended (`43f6d28`).
4. **Phase 4 step 3b+3c (commit pending)** Memo severity semantics + Extraction retrieval query refinements.
5. **Phase 4 step 3 verification** — Will re-runs live CoreWeave workflow (`./scripts/import-workflow.sh` then trigger Form Trigger). Acceptance: (a) RFD red_flags now includes `material_weakness` HIGH; (b) Memo key_strengths no longer labels magnitude-y items as HIGH; (c) S-1 ExtractionOutput now populates `headcount` (integer) and `key_personnel` (array of named executives).
6. **Phase 5** — Cerebras generalization (re-run pipeline against the 4 Cerebras docs; no code changes expected). Also exercises whether the qwen3-max-preview eager-bypass pattern (P-5) recurs on a different deal packet.
7. **Phase 6** — demo + 250-word written explanation.
8. **Phase 7** — submission to Pari.
9. **Other backlog (do not gate forward):**
   - Cosmetic: `supabase_id` missing from Slack footer (n8n unwraps single-row REST response).
   - Codex post-commit reviews of medium-stakes prompts (Gap Analysis, Portfolio Fit, Evaluator).
   - 3.12 schema-validation-with-retry machinery DEFERRED — parsers' shape projection sufficient for prototype.
   - Proactive empty-shell audit of Gap Analysis + Portfolio Fit prompts per P-5 regression-test guidance.
   - Empty-upstream meta-eval mode is anti-discriminative; either document as script limitation or add `--require-upstream` flag.
   - Extend `scripts/inject-prompts.js` to also handle the RFD code paste in the Run Red Flag Detector node (currently manual-paste per D-6).
<!-- section:next-steps:end -->

<!-- section:open-questions:start -->
- **`evaluator_score: 0` on qwen3-max-preview** — first thing to debug at Phase 4 start. Check whether `criteria_scores` are present-but-malformed vs absent in the raw Evaluator response. Parser at `Parse Evaluator Response` computes `sum(criteria_scores)` authoritatively; if criteria_scores parse fails, default cascade lands at 0 → forces flagged_for_review. Could also be a prompt-shape issue specific to qwen3-max-preview's JSON-mode output.
- **Doubled-prompt surface** (D-6 cost flag): `scripts/inject-prompts.js` is the safety net. Run it (or `--check`) any time `prompts/*.md` changes to keep workflow.json in sync. Contradiction prompt intentionally excluded from inject-prompts.
- **Langfuse trace metadata richness:** trace currently captures token usage + model + run_id. Could add per-observation input/output redaction policy in Phase 4 if needed, but landing 12/12 201s on the manual /api/public/ingestion path is the primary win.
<!-- section:open-questions:end -->

<!-- section:read-watermark:start -->
Last read INDEX at: 2026-04-25T19:15:00-04:00
<!-- section:read-watermark:end -->
