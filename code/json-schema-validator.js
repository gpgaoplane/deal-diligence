// code/json-schema-validator.js
// ---------------------------------------------------------------------
// Hand-rolled JSON Schema (draft-07 subset) validator.
// Context: D-3 in .claude/memory/decisions.md, P-1 in pitfalls.md.
//
// Why hand-rolled: n8n Code node sandbox blocks new Function() /
// eval(), which ajv.compile() requires. This validator uses pure
// recursion — no code generation. Safe inside the sandbox.
//
// Supported keywords (design plan §3.2):
//   - $ref (internal only, to #/$defs/<name>)
//   - type (string OR array; includes "null" for null-unions)
//   - required
//   - enum
//   - const
//   - pattern (strings)
//   - minLength, minItems, minimum, maximum
//   - properties (recursive)
//   - items (single sub-schema)
//   - anyOf
//
// Intentionally unsupported (design constraint — schemas must stay
// within this subset): external $ref, oneOf, allOf, format,
// additionalProperties, dependencies, patternProperties, contains.
//
// Paste-friendly: self-contained, no external deps, pure CommonJS.
// Can be inlined verbatim into an n8n Code node OR required from a
// Node script outside the sandbox.
// ---------------------------------------------------------------------
'use strict';

function createValidator(rootSchema) {
  if (!rootSchema || typeof rootSchema !== 'object') {
    throw new TypeError('createValidator: rootSchema must be an object');
  }

  // Resolve an internal $ref like "#/$defs/Foo" against rootSchema.
  function resolveRef(ref) {
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      throw new Error('Unsupported $ref (must be internal, starting with #/): ' + ref);
    }
    const parts = ref.slice(2).split('/');
    let node = rootSchema;
    for (const raw of parts) {
      // JSON Pointer escapes: ~0 = ~, ~1 = /
      const p = raw.replace(/~1/g, '/').replace(/~0/g, '~');
      if (node == null || typeof node !== 'object') {
        throw new Error('$ref failed to resolve: ' + ref);
      }
      node = node[p];
    }
    if (node == null) throw new Error('$ref resolved to null/undefined: ' + ref);
    return node;
  }

  // Type check including "null" and array-of-types.
  function matchesType(data, type) {
    if (type === 'null') return data === null;
    if (type === 'string') return typeof data === 'string';
    if (type === 'number') return typeof data === 'number' && !Number.isNaN(data);
    if (type === 'integer') return Number.isInteger(data);
    if (type === 'boolean') return typeof data === 'boolean';
    if (type === 'array') return Array.isArray(data);
    if (type === 'object') return data !== null && typeof data === 'object' && !Array.isArray(data);
    return false;
  }

  // Recursively validate data against schema. Pushes errors into `errors`.
  function validate(data, schema, path, errors) {
    if (schema == null) return;

    // $ref — dereference and recurse into the resolved schema.
    if (schema.$ref) {
      const resolved = resolveRef(schema.$ref);
      validate(data, resolved, path, errors);
      return;
    }

    // anyOf — at least one subschema must pass.
    if (Array.isArray(schema.anyOf)) {
      for (const sub of schema.anyOf) {
        const subErrors = [];
        validate(data, sub, path, subErrors);
        if (subErrors.length === 0) return; // one branch passed
      }
      errors.push({ path, message: 'no anyOf branch matched' });
      return;
    }

    // type — primary gate. If type fails, skip nested checks (avoid noise).
    if (schema.type !== undefined) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.some(t => matchesType(data, t))) {
        errors.push({
          path,
          message: `type mismatch: expected ${types.join('|')}, got ${data === null ? 'null' : typeof data}`,
        });
        return;
      }
    }

    // enum / const.
    if (Array.isArray(schema.enum)) {
      if (!schema.enum.some(v => deepEqual(v, data))) {
        errors.push({ path, message: `value not in enum: ${JSON.stringify(schema.enum)}` });
      }
    }
    if (schema.const !== undefined && !deepEqual(schema.const, data)) {
      errors.push({ path, message: `value not equal to const: ${JSON.stringify(schema.const)}` });
    }

    // String constraints.
    if (typeof data === 'string') {
      if (typeof schema.minLength === 'number' && data.length < schema.minLength) {
        errors.push({ path, message: `string shorter than minLength ${schema.minLength}` });
      }
      if (typeof schema.pattern === 'string') {
        let re;
        try { re = new RegExp(schema.pattern); }
        catch (e) { errors.push({ path, message: 'invalid pattern regex: ' + e.message }); return; }
        if (!re.test(data)) {
          errors.push({ path, message: `pattern mismatch: ${schema.pattern}` });
        }
      }
    }

    // Number constraints.
    if (typeof data === 'number') {
      if (typeof schema.minimum === 'number' && data < schema.minimum) {
        errors.push({ path, message: `number below minimum ${schema.minimum}` });
      }
      if (typeof schema.maximum === 'number' && data > schema.maximum) {
        errors.push({ path, message: `number above maximum ${schema.maximum}` });
      }
    }

    // Array constraints + items recursion.
    if (Array.isArray(data)) {
      if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
        errors.push({ path, message: `array shorter than minItems ${schema.minItems}` });
      }
      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          validate(data[i], schema.items, `${path}[${i}]`, errors);
        }
      }
    }

    // Object constraints: required + properties recursion.
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(schema.required)) {
        for (const key of schema.required) {
          if (!Object.prototype.hasOwnProperty.call(data, key)) {
            errors.push({ path: `${path}/${key}`, message: 'required property missing' });
          }
        }
      }
      if (schema.properties && typeof schema.properties === 'object') {
        for (const key of Object.keys(schema.properties)) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            validate(data[key], schema.properties[key], `${path}/${key}`, errors);
          }
        }
      }
    }
  }

  // Deep equality for enum / const checks.
  function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    if (typeof a === 'object') {
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (const k of ka) if (!deepEqual(a[k], b[k])) return false;
      return true;
    }
    return false;
  }

  /**
   * Validate `data` against the schema at rootSchema#/<pointer>, e.g.
   * "$defs/ExtractionOutput".
   *
   * @param {*} data
   * @param {string} defName — name under $defs, or explicit JSON pointer like "$defs/X".
   * @returns {{valid: boolean, errors: Array<{path: string, message: string}>}}
   */
  function validateDef(data, defName) {
    const ref = defName.startsWith('$defs/') ? `#/${defName}` : `#/$defs/${defName}`;
    const errors = [];
    validate(data, { $ref: ref }, '', errors);
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate `data` against the ROOT schema (top-level, not via $defs).
   */
  function validateRoot(data) {
    const errors = [];
    validate(data, rootSchema, '', errors);
    return { valid: errors.length === 0, errors };
  }

  return { validateDef, validateRoot, resolveRef };
}

module.exports = { createValidator };
