---
status: active
type: pitfalls
owner: claude
last-updated: 2026-04-26T01:30:00-04:00
read-if: "you are touching an area Claude has flagged before"
skip-if: "status != active or last-updated <= your watermark"
---

# Claude — Pitfalls

Append new pitfalls below. Format:

```
## P-<n> — <title> — <ISO-8601>
**Symptom:**
**Root cause:**
**Workaround:**
**Regression test:**
```

<!-- section:entries:start -->

## P-1 — n8n Code node sandbox blocks ajv.compile() (any runtime JSON Schema compiler) — 2026-04-24T14:00:00-04:00

**Symptom:**
A Code node doing `const ajv = new Ajv(); ajv.compile(schema);` (or equivalent) throws:
```
EvalError: Code generation from strings disallowed for this context
  at new Function (<anonymous>)
  at Ajv.compileSchema (.../ajv/dist/compile/index.js:89:30)
```
Even though `require('ajv')` succeeds with `NODE_FUNCTION_ALLOW_EXTERNAL=ajv` in `docker-compose.yml`. Stack trace always lands in `new Function()`.

**Root cause:**
n8n's Code node runs user JavaScript inside a hardened VM sandbox (`vm2` / `isolated-vm` depending on n8n version — confirmed on 2.17.7 Self Hosted). The sandbox flatly disables `new Function()` and `eval()` for security. Ajv compiles JSON Schemas by *generating validator functions at runtime via `new Function()`* — incompatible with the sandbox model. Same failure hits any validator that compiles to a JS function (`djv`, `jsonschemax`, etc.).

`NODE_OPTIONS=--disallow-code-generation-from-strings=false` is IRRELEVANT — the restriction is enforced at the sandbox layer, not the Node process layer. No n8n config fix exists for this.

**Workaround:**
Use the hand-rolled validator at `code/json-schema-validator.js` (design plan §3.2 fallback, recorded as D-3 in `decisions.md`). Covers the draft-07 subset the project actually uses: `type` (incl. null-unions), `required`, `enum`, `pattern`, `minLength`, `minItems`, `properties`, `items`, `anyOf`. No code generation; pure recursion. Runs cleanly inside the sandbox.

**Escape hatch for scripts outside the sandbox:** `ajv` still works in regular Node execution (helper scripts in `scripts/` — `run-meta-eval.js`, `validate-memo-citations.js`, `validate-fixture.js`). Use `ajv` there for convenience. Same schema file for both; validators diverge by context.

**Alternative I considered and rejected:**
- `ajv-cli --standalone` → pre-compile to a static JS file, bundle into the container, `require()` from Code node. Viable but: (a) still emits `new Function()` in some ajv code paths depending on schema complexity; (b) requires container customization; (c) doesn't scale — every schema-file change triggers re-bundling.
- `@cfworker/json-schema` (designed for no-eval environments) → plausible but requires a custom n8n image with the package pre-installed, adding container-image maintenance overhead.

Hand-rolled wins for this project.

**Regression test:**
`code/test/json-schema-validator.test.js` must include a "validator never calls `new Function` or `eval`" static check (grep the source or use `Object.getOwnPropertyDescriptor` introspection during runtime). Plus: positive/negative validation cases for every keyword supported.

**See also:** D-3 in decisions.md, design plan §3.2, I-9 (reasoning model behavior) in context.md.

## P-2 — Git Bash on Windows rewrites Unix-style paths before subprocess invocation — 2026-04-24T17:00:00-04:00

**Symptom:**
A shell script running under Git Bash (MINGW64) that passes a Unix-style path (e.g. `/tmp/workflow.json`) to a command like `docker compose exec ... --input=/tmp/workflow.json` produces ENOENT errors inside the container, with an unexpected Windows path in the error:
```
ENOENT: no such file or directory, open 'C:/Users/PC/AppData/Local/Temp/workflow.json'
```
Even though the file exists inside the container at `/tmp/workflow.json`.

**Root cause:**
Git Bash / MSYS on Windows automatically rewrites arguments that look like Unix paths into their Windows equivalents BEFORE invoking subprocesses (including `docker`). So `/tmp/workflow.json` gets rewritten to `C:/Users/<user>/AppData/Local/Temp/workflow.json` (the host's `%TEMP%` equivalent of `/tmp`) before docker sees it. Docker then passes this host path to the container, which can't find it — the file is at the container's `/tmp/`, not the host's.

This is MSYS's well-known Windows-compat behavior, not a bug. Happens with any Unix-style path argument that "looks like a Windows path should".

**Workaround:**
Prefix the subprocess invocation with `MSYS_NO_PATHCONV=1` to disable the rewrite for that invocation:
```bash
MSYS_NO_PATHCONV=1 docker compose exec -T n8n n8n import:workflow --input=/tmp/workflow.json
```
Alternatively, use a double-leading-slash (`//tmp/workflow.json`) which also disables rewriting, though it's uglier.

For any new script in this project that passes Unix paths to `docker exec` / `kubectl exec` / similar — apply `MSYS_NO_PATHCONV=1` prophylactically.

**Regression test:**
On Windows Git Bash: run `./scripts/import-workflow.sh` against a workflow.json that exists; confirm it succeeds without ENOENT on the `/tmp/workflow.json` path inside the container. (No CI test for this; manual verification on first Windows run.)

**See also:** scripts/import-workflow.sh, scripts/export-workflow.sh — both apply the env var to every docker-exec invocation.

## P-3 — n8n Code node sandbox also blocks `require('crypto')` (stdlib !== safe) — 2026-04-24T17:15:00-04:00

**Symptom:**
A Code node using `const crypto = require('crypto')` fails at runtime with:
```
Module 'crypto' is disallowed [line 10]
  at .../task-runner/.../require-resolver.js:16:27
  at VmCodeWrapper (evalmachine.<anonymous>:10:16)
```

**Root cause:**
n8n 2.17.7's Code node sandbox blocks `require()` for stdlib modules too, not only external npm packages. The assumption "stdlib is safe, external needs NODE_FUNCTION_ALLOW_EXTERNAL" is wrong for this version. The sandbox has an allowlist of which modules can be required, and `crypto` is not on it by default. Adding `crypto` to `NODE_FUNCTION_ALLOW_EXTERNAL` also doesn't work — that env var is for external packages, not stdlib.

Related to P-1 (ajv compile blocked) — same sandbox, different failure surface.

**Workaround:**
⚠ **Corrected 2026-04-24T17:30:** the Web Crypto global `crypto` is ALSO blocked — neither `require('crypto')` nor global `crypto.*` (including `crypto.randomUUID()` and `crypto.getRandomValues()`) work in n8n 2.17.7's Code-node sandbox. The sandbox's locked-down globals list excludes `crypto` entirely.

For UUID generation in a Code node, use pure-JS `Math.random`:
```js
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```
Not crypto-secure, but run_ids don't need that — uniqueness is the requirement. Collision probability ~5×10⁻¹⁸ per pair at UUID v4 strength; negligible for a prototype generating ≤100 IDs.

**Invariant I-2 (no Math.random) is scoped to Red Flag Detector specifically** (where determinism matters for audit replay). Coordinator / other Code nodes are allowed to use Math.random — document the use in the code comment to avoid drift.

For real crypto (hashing, signing): move the work outside the Code node. Options:
- Upstream Node script that writes result to the item's JSON before it reaches the Code node
- Dedicated service container (HTTP Request from the Code node to a local endpoint)
- n8n's Crypto node (native node, not Code — may have different sandbox rules)

**Regression test:**
When authoring any n8n Code node: grep the jsCode string for `require(` → if present, either remove or verify the module is on the sandbox allowlist. Default assumption: require is not available. The `json-schema-validator.js` design path relies on this (paste-friendly, no require needed).

**Sandbox primitives table (empirically tested on n8n 2.17.7):**

| Primitive | Status |
|---|---|
| `new Function(...)` | ❌ blocked |
| `eval(...)` | ❌ blocked |
| `require('crypto')` | ❌ blocked (stdlib not allowlisted) |
| Web Crypto global `crypto.*` | ❌ blocked (ReferenceError: crypto is not defined) |
| `require('ajv')` with NODE_FUNCTION_ALLOW_EXTERNAL=ajv | ⚠ loads but compile fails (uses new Function) |
| `Math.random()` | ✅ works |
| `Date.now()`, `new Date()` | ✅ works |
| Template literals, destructuring, arrow functions, async/await | ✅ works |
| `Array.from`, `Array.prototype.*`, `Object.*` | ✅ works |
| `$input.item.json`, `$input.item.binary` | ✅ works (n8n helpers) |
| `$execution.id` | ✅ works (n8n helper; alternative to UUID generation) |

Rule of thumb: **assume Node APIs are NOT available in the Code node sandbox.** Only ECMAScript language primitives + n8n's `$`-prefixed helpers are reliably accessible. Anything else, verify empirically or move outside the sandbox.

## P-4 — Multiple n8n node classes REPLACE $json instead of merging (HTTP Request, Extract from File, etc.) — 2026-04-24T19:45:00-04:00

**Symptom:**
A Code node immediately after one of these nodes sees `$input.item.json` containing ONLY the node's own output fields. Upstream metadata (run_id, document, chunk_index, etc.) is GONE. Downstream aggregation shows `null` for all lost fields despite the new fields being populated correctly.

**Confirmed offenders on n8n 2.17.7:**
- **HTTP Request** — $json replaced by response body (`{data, model, usage}`). Upstream fields dropped.
- **Extract from File** (PDF mode) — $json replaced by `{text, numpages, info, version}`. Upstream fields dropped.
- Presumably others of the same class (Read Binary File, any "ingest → transform" node).

**Root cause:**
By default, these nodes treat their output as the new "payload" for the item, not an addition to it. The UI sometimes has a toggle to merge input (e.g., HTTP Request has an "Include Input Fields" option buried in the Options block), but the parameter paths are non-obvious and easy to miss.

**Workaround:**
In the Code node after the offending node, use n8n's cross-node reference expression to reach back to the LAST node that had the metadata you need:

```javascript
// runOnceForEachItem mode:
const response = $input.item.json;              // HTTP/extract output
const original = $('Upstream Node').item.json;  // Upstream node's item at SAME position

// runOnceForAllItems mode:
const items = $input.all();
const upstreamItems = $('Upstream Node').all(); // match by position index
for (let i = 0; i < items.length; i++) {
  const out = items[i].json;
  const src = upstreamItems[i].json;
  // merge as needed
}
```

Both `$('NodeName').item` and `$('NodeName').all()` return items at their current positions. n8n preserves per-item order through these nodes, so position i after matches position i before.

**Which node to reach back to:** the LAST node that had the fields you need. If there's a chain of metadata-dropping nodes (e.g., Split Per-Document → Extract from File → Text Chunker), reach back to the one BEFORE the first drop (Split Per-Document here), not the immediate predecessor.

**Alternative workarounds (not used in this project):**
- HTTP Request `options.response.response.fullResponse = true` — still replaces, but includes more response metadata. Doesn't help here.
- Use a Merge node between HTTP Request and the next Code node to zip response ↔ original by position. More nodes, same effect as cross-node reference.
- Embed original metadata in the REQUEST body so it's echoed back. Requires the API to echo; most don't.

**Regression test:**
For any new [HTTP Request | Extract from File | similar] → Code-node pair in this workflow: if the Code node needs upstream metadata, it MUST use `$('Upstream Node').item.json` (or `.all()` for runOnceForAllItems) to reach back. Grep the workflow for `$input.item.json` or `$input.all()` in Code nodes following a known-offender upstream — check if metadata is coming from the right source.

**See also:** `n8n/workflow.json`
- "Extract Embedding" (after HTTP Request) — reaches back to Text Chunker
- "Text Chunker" (after Extract from File) — reaches back to Split Per-Document
- "Build Slack Message" (after Insert Deal Memo / HTTP Request to Supabase) — reaches back to "Build Supabase Record" for memo + evaluator data (3.16w fix landed in commit `c0ee968`)
All three demonstrate the pattern. P-4 has now hit three distinct nodes in this workflow; treat any new HTTP Request → Code-node pair as guilty-until-proven-innocent.

## P-5 — qwen3-max-preview eagerly invokes preemptive bypass on prompts with strong abstain rules — 2026-04-25T20:45:00-04:00

**Symptom:**
A specialist returns structurally-valid JSON matching the schema but with bypass/abstain content rather than substantive output:
- Memo Generation: empty shell (executive_summary: "", all arrays [], all confidences 0.0, but `recommendation` set to a valid enum like "pass"; finish_reason: "stop"; completion_tokens ~150-200).
- Evaluator: all-zero criteria_scores + critical_issues entry blaming structural failure ("Evaluation produced all-zero scores" or "Memo Generation bypassed; review provisional"); finish_reason: "stop"; completion_tokens ~100-200.

In both cases the model is NOT being lazy or hitting a token cap — it is invoking the prompt's edge-case bypass rule PREEMPTIVELY rather than REACTIVELY. The downstream parsers are extracting exactly what the model emitted; the bug is upstream in how the model interprets the prompt.

**Root cause:**
`qwen3-max-preview` interprets edge-case bypass rules as PROACTIVE shortcuts whenever it perceives input gaps, rather than REACTIVE behaviors after individual scoring/synthesis. The earlier `qwen3-max-2026-01-23` (now retired per Will's direction) interpreted the same rules per-claim / per-criterion as the prompt authors intended. The interaction is prompt-vs-model, not parser-vs-model.

Confirmed on two prompts in this workflow:
- **Memo Generation (HIGH-stakes):** rule 7 "prefer omission over speculation" + rule 4 "if Extraction did not surface a fact, you cannot assert that fact" + seven "MUST cite" rules → global empty memo shell. Triggered when the model perceives any combination of upstream gaps as "insufficient evidence."
- **Evaluator (medium-stakes):** edge-case rule "All six criteria score 0: structural failure" → preemptive all-zero scoring. Triggered when contradiction_output / gap_analysis_output / red_flag_detector_output are empty (e.g., empty-upstream meta-eval).

Two prompts is enough evidence to call this a model-class behavior, not a prompt-specific anomaly. Other prompts with edge-case bypass rules (Gap Analysis, Portfolio Fit) may show the same pattern; preemptively audit before they bite.

**Workaround (5-step pattern, applied on both prompts):**

1. **Narrow the abstain rule scope.** Change "prefer omission over speculation" to "prefer omission of THE SPECIFIC unciteable claim over speculation." Substitute SPECIFIC for the per-element unit (claim, criterion, field).

2. **Add an explicit anti-bypass scoping rule.** State explicitly: "this rule is per-X, NEVER global. Empty fields/arrays are a structural failure when upstream input contains usable content."

3. **Add per-element handling for empty-input cases.** Example for Evaluator: "if upstream artifact is empty, score 10 by default; score 0–3 only if the model output CLAIMS elements that don't exist upstream." Example for Memo: "if upstream X is non-empty AND output Y would be empty, you misapplied rule 7 — revise and surface what IS supported."

4. **Mark the all-zero / all-empty edge case rule as REACTIVE.** "This rule applies AFTER you have scored each individually using the rubric. DO NOT preemptively zero-score as a shortcut for missing input."

5. **Add silent self-revise checks.** Pattern: "if upstream X is non-empty AND output Y is empty, you misapplied rule Z — revise." One per upstream/output pair.

Verified empirically:
- Memo fix (commit `60c4cc2`): live CoreWeave run produced empty memo shell pre-fix → produced substantive memo + 58/60 Evaluator score post-fix (qwen3-max-preview, same model both runs).
- Evaluator fix (commit immediately following, this entry): empty-upstream meta-eval went from 0/0 (preemptive bypass) to 45/48 per-criterion scoring. The 45/48 result has a separate test-setup limitation (empty-upstream is anti-discriminative when fixtures contain rich content; see work-log 2026-04-25T20:45 entry for analysis), but the per-criterion scoring itself is correct — the bypass behavior is fixed.

**Regression test:**

When authoring or refining any specialist prompt for this project, AND after any future model swap:

1. Live workflow run with normal populated upstream → confirm the specialist produces substantive output (no empty shells, no all-zeros).
2. Live workflow run with one or more upstream specialists DELIBERATELY producing minimal output (e.g., RFD finds no flags on a clean deal) → confirm downstream specialists (Memo, Evaluator) do NOT collapse to empty/zero output.
3. For Evaluator specifically: `node scripts/run-meta-eval.js` (no upstream flags) → confirm per-criterion scores are produced from memo body alone, NOT all-zeros.

If empty-shell or all-zero pattern reappears: tighten abstain rule scoping in the offending prompt using the 5-step pattern above BEFORE debugging elsewhere.

**See also:**
- `prompts/memo-generation-agent.md` rules 7–8 + silent final checks (commit `60c4cc2`)
- `prompts/evaluator-agent.md` "Empty-upstream handling" section + tightened all-zero edge case + silent verification (commit immediately following this entry)
- D-6 in `decisions.md` for the `scripts/inject-prompts.js` mitigation that lets us iterate on both md and workflow.json copies in lockstep
- I-9 in `context.md` for the qwen3-max family reasoning-model behavior + model-swap watch-out

## P-6 — Shape changes to a contract field must be propagated to every consumer (D-6 source_manifest tail) — 2026-04-26T01:30:00-04:00

**Symptom:**
RFD output reports `regulatory_filing_count: 0` in `rfd_meta` even though the deal packet contains an S-1 with `source_type: "regulatory_filing"` everywhere upstream (Extraction outputs prove this). All 6 regex-based regulatory-only detectors (`material_weakness`, `going_concern`, `related_party_above_threshold`, `auditor_change_recent`, `dual_class_structure`, `s1_previously_withdrawn`) silently produce zero hits even when their text patterns are clearly present in the source documents. Only the 4 `extractedFactsPerDoc`-based detectors (customer_concentration_high/extreme, revenue_growth_anomalous, burn_rate_runway_short) ever fire.

**Root cause:**
The Run Red Flag Detector node's wrapper jsCode was originally written assuming `aggregated.source_manifest` was an array of `{ source_name, source_type }` objects. When source_manifest was redefined as a **string array** (per D-6 architecture formalization, the canonical shape became `["CoreWeave Press Release", "CoreWeave Analyst Report", ...]`), the RFD wrapper was not updated. The loop `for (const entry of source_manifest) { if (entry && entry.source_name && entry.source_type) { ... } }` iterates strings, finds neither `.source_name` nor `.source_type` on a string primitive, never adds anything to `sourceTypeBySource`, leaves the lookup empty, and thus every document gets `source_type: 'unknown'` in `documentsRaw`. The `firstRegulatoryMatch()` helper then filters everything out via `if (d.source_type !== 'regulatory_filing') continue;`. Result: 6 of 10 RFD detectors are dead code.

This bug shipped in Phase 3 closure and survived undetected through Phase 4 step 1, step 2 (meta-eval calibration), and step 3a (regex extension). It was discovered only when Phase 4 step 3 verification tried to confirm the regex change worked — the new "Material weaknesses exist..." pattern was being matched by the regex (we have unit tests proving this), but the wrapper never gave it any regulatory text to scan.

The deeper lesson: when D-6 formalized the architecture and changed source_manifest to a string array, we updated DOWNSTREAM consumers that used the new shape (Memo prompt, Coordinator) but didn't audit OTHER consumers that quietly used the OLD shape. The RFD wrapper was the silent victim.

**Workaround:**
The fix is one block: replace the source_manifest-iteration with extraction_outputs-iteration in `n8n/workflow.json`'s Run Red Flag Detector node. Each ExtractionOutput already carries both `source_name` and `source_type`, and `extractionOutputs` is already defined right above the broken block.

```js
// BEFORE (broken — strings have no .source_name / .source_type):
const sourceTypeBySource = {};
for (const entry of (aggregated.source_manifest || [])) {
  if (entry && entry.source_name && entry.source_type) {
    sourceTypeBySource[entry.source_name] = entry.source_type;
  }
}

// AFTER (correct — extractionOutputs entries have both fields):
const sourceTypeBySource = {};
for (const eo of extractionOutputs) {
  if (eo && eo.source_name && eo.source_type) {
    sourceTypeBySource[eo.source_name] = eo.source_type;
  }
}
```

**Regression test:**
Live workflow run on CoreWeave (or any deal packet with at least one regulatory_filing) → check `rfd_meta.regulatory_filing_count`. It should equal the number of regulatory_filing source_types in the packet (1 for CoreWeave: the S-1). If it reports 0 despite the packet containing a regulatory_filing, the wrapper is broken.

For Phase 4 step 3 closure specifically: after this fix, the CoreWeave run should produce **3** red_flags (not 2): customer_concentration_extreme HIGH + revenue_growth_anomalous LOW + the new material_weakness HIGH (whose POS regex was extended in P-4.A). The S-1's "Material weaknesses exist in internal control over financial reporting..." sentence is the canonical trigger.

**General lesson (not just RFD):**
Every time a contract field's SHAPE changes (string → object, array element type, etc.), grep for every consumer of that field and audit each one. The framework has no static type-checking on jsCode strings inside workflow.json — the only safety net is empirical observation, which means silent breakage can survive multiple phases. Add a `.collab/INDEX.md`-class "schema-shape contract" registry if this pattern recurs.

**See also:**
- D-6 in `decisions.md` for the source_manifest shape formalization (string array)
- `n8n/workflow.json` Run Red Flag Detector node (the fixed wrapper)
- `code/red-flag-detector.js` (the canonical detector module — unaffected by this bug, only the wrapper was broken)
- The `scripts/inject-prompts.js` mitigation pattern for the doubled-prompt-surface problem; an analogous mitigation for the RFD wrapper would be to extract the wrapper into a `code/rfd-wrapper.js` file with its own unit tests (currently backlog)

<!-- section:entries:end -->
