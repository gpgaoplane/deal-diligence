---
status: active
type: pitfalls
owner: claude
last-updated: 2026-04-24T14:00:00-04:00
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

<!-- section:entries:end -->
