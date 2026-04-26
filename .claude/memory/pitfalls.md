---
status: active
type: pitfalls
owner: claude
last-updated: 2026-04-25T18:45:00-04:00
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

<!-- section:entries:end -->
