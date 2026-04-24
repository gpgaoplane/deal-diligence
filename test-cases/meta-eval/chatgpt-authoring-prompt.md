---
status: active
type: external-prompt
owner: shared
last-updated: 2026-04-24T15:30:00-04:00
read-if: "you need to author the meta-eval fixtures (task 2.Z), by handing this prompt to an out-of-loop LLM like ChatGPT"
skip-if: "the meta-eval fixtures are already authored and committed"
related: [docs/plans/2026-04-24-deal-diligence-design.md, schemas/agent-output-schemas.json]
---

# ChatGPT Prompt for Meta-Eval Fixture Authorship (Task 2.Z)

> **Instructions for Will:** Open a fresh ChatGPT conversation (ChatGPT-4/5/6 class, not Claude). Paste EVERYTHING below the `---BEGIN PROMPT---` line as a single message. ChatGPT will return two JSON objects. Save them as:
> - `test-cases/meta-eval/intentionally-bad-memo.json`
> - `test-cases/meta-eval/intentionally-good-memo.json`
>
> Then ping Claude Code here; Claude Code will run schema validation to confirm both fixtures pass `schemas/agent-output-schemas.json#/$defs/MemoGenerationOutput`.
>
> **Why ChatGPT specifically and not Claude:** The evaluator prompt that will score these fixtures was authored by Claude Code. A different model family (ChatGPT) minimizes author/scorer self-correlation and produces a more credible calibration signal. See design plan §4.

---BEGIN PROMPT---

# Task: Author Two CoreWeave IC Memo Fixtures for Evaluator Calibration

You are a senior investment professional at an institutional alternative-asset manager. You have reviewed hundreds of IC memos produced by analysts reviewing buyout, growth equity, and pre-IPO investment opportunities. You know — in your gut and from experience — what separates an IC-grade memo from an unacceptable one.

I need you to author **two test fixtures** that will be used to calibrate an AI memo-quality evaluator. The fixtures are the ground-truth: one memo that you, as an investment professional, would judge **unacceptable**, and one that you would judge **IC-grade**. The AI evaluator should be able to tell them apart. If it can't, its scoring isn't trustworthy.

## The subject: CoreWeave, Inc.

Real public company. IPO'd March 2025 on Nasdaq. AI-infrastructure cloud provider (GPU-as-a-service, primarily serving AI/ML workloads). **Use the following known facts as the empirical basis for both fixtures** — these are verifiable from CoreWeave's real S-1 filing and public coverage:

- **Customer concentration:** ~77% of revenue from two customers. Microsoft is by far the largest (~62% of revenue alone). Nvidia is a significant second.
- **Material weaknesses in internal controls over financial reporting** — disclosed in their S-1 Risk Factors.
- **Debt-heavy capital structure.** Total financing raised $14.5B+, predominantly debt. Operating losses are substantial.
- **Triple-class share structure** with founder control.
- **Revenue growth:** explosive (multi-hundred-percent YoY), almost entirely driven by Microsoft's contract.
- **Supply-side dependency:** effectively sole-source on Nvidia GPUs — pricing, allocation, and supply cadence all hinge on Nvidia.
- **Hyperscaler disintermediation risk:** Microsoft (their largest customer) is building its own GPU-cloud capacity; if Microsoft insources, CoreWeave's TAM collapses.
- **No historical profitability path disclosed.**

Treat the CoreWeave S-1 as "Source Document #1" (canonical name: `CoreWeave S-1 Filing`). You may also reference a secondary source (canonical name: `CoreWeave Press Release`) and a third (`CoreWeave Analyst Report`) if needed.

## The output format

Each fixture is a JSON object matching this schema (all fields are required except where marked nullable):

```json
{
  "executive_summary": "<string, 3-5 sentences summarizing the deal, recommendation, key driver>",
  "recommendation": "pass | pursue | advance_to_deep_diligence",
  "recommendation_rationale": "<string, why this directional signal>",
  "company_snapshot": {
    "description": "<string>",
    "stage": "<string, e.g. 'IPO'>",
    "sector": "<string, e.g. 'AI infrastructure'>",
    "geography": "<string>"
  },
  "investment_thesis": "<string, bull case>",
  "key_strengths": [
    {
      "strength": "<string>",
      "severity": "HIGH | MEDIUM | LOW",
      "sources": ["<citation string>"],    // at least 1 source required per claim
      "confidence": <number 0.0-1.0>
    }
  ],
  "key_risks": [
    {
      "risk": "<string>",
      "severity": "HIGH | MEDIUM | LOW",
      "sources": ["<citation string>"],    // at least 1 source required per claim
      "confidence": <number 0.0-1.0>
    }
  ],
  "contradictions": [
    {
      "claim": "<string>",
      "severity": "HIGH | MEDIUM | LOW",
      "sources": ["<citation string>"]     // at least 1 source required
    }
  ],
  "missing_information": [
    {
      "item": "<string>",
      "importance": "HIGH | MEDIUM | LOW"
    }
  ],
  "red_flags": [
    {
      "flag_type": "<string, e.g. 'customer_concentration_extreme'>",
      "severity": "HIGH | MEDIUM | LOW"
    }
  ],
  "portfolio_fit": {
    "overall_alignment": "HIGH | MEDIUM | LOW",
    "rationale": "<string>"
  },
  "open_diligence_questions": ["<string>", "..."],
  "confidence_scores": {
    "overall": <number 0.0-1.0>,
    "financial_analysis": <number 0.0-1.0>,
    "competitive_positioning": <number 0.0-1.0>,
    "management_assessment": <number 0.0-1.0>,
    "portfolio_fit": <number 0.0-1.0>
  }
}
```

Return valid JSON. Do not wrap in markdown code fences in your final answer — I need the raw JSON to paste into files.

## Citation format (strict)

Every string in a `sources` array must match this format exactly — it's validated by a regex:

```
<SourceName> <Locator>
```

Where `<SourceName>` is one of:
- `CoreWeave S-1 Filing`
- `CoreWeave Press Release`
- `CoreWeave Analyst Report`

And `<Locator>` is one of:
- `p. 23` (exact page)
- `p. ~23` (estimated page — use the tilde when the page is approximate)
- `Risk Factors p. 23` (for references to the Risk Factors section specifically)

**Valid examples:**
- `CoreWeave S-1 Filing p. 45`
- `CoreWeave S-1 Filing Risk Factors p. 23`
- `CoreWeave Press Release p. ~2`

**Invalid examples (will fail validation):**
- `CoreWeave SEC filing p. 23` (wrong source name)
- `CoreWeave S-1 Filing, page 23` (wrong locator format)
- `CoreWeave S-1 Filing` (no locator)

If a claim in your memo cannot be cited against the real S-1 (because you don't have page numbers memorized), use plausible-looking page numbers like `p. 23`, `Risk Factors p. 41`, `p. ~67`. The evaluator doesn't check citation accuracy against the real document — it checks format and internal consistency.

## Fixture 1: "intentionally-good-memo.json" — the IC-grade memo

Write a memo you would be **proud** to present to an investment committee for a deal this challenging.

In your professional judgment, an IC-grade memo for CoreWeave:
- **Surfaces every material risk** from the known-facts list above. An IC memo that doesn't mention 77% customer concentration or material weaknesses is missing the core risk picture.
- **Has a coherent narrative.** Executive summary, key risks, key strengths, and the recommendation all tell the same story. If `key_risks` includes HIGH-severity customer concentration and HIGH-severity material weaknesses, the `recommendation` is almost certainly `pass` or `advance_to_deep_diligence` (for more work), not `pursue`. If it's `advance_to_deep_diligence`, the rationale explains what new information would change the picture.
- **Every claim is cited.** No "management believes" without a source. No unsourced assertions.
- **Identifies open diligence questions** that matter — not bureaucratic checklist items but questions that would genuinely change the investment thesis if answered differently.
- **Confidence scores reflect reality.** For a company with material weaknesses, financial_analysis confidence should be meaningfully below 1.0. Intellectual honesty.
- **Portfolio fit is thoughtful.** If the target sector isn't aligned with a typical institutional LP's focus, say so clearly.

Target: 4–6 key risks, 2–4 key strengths, 2–4 contradictions, 3–6 missing information items, 2–4 open diligence questions. All with sources.

## Fixture 2: "intentionally-bad-memo.json" — the unacceptable memo

Write a memo a junior analyst might produce on an off day — plausible-looking at first glance, but failing the IC bar in ways a senior reviewer would catch.

Your "bad" fixture **must** include, at minimum:
1. **At least one uncited claim** — a strength or risk with an empty `sources` array. (This will actually fail schema validation, so instead: give it a `sources: ["Unknown source p. X"]` where the source name isn't a valid canonical one. The schema-validator won't catch format; the downstream citation-validity check will.)

   *Correction — since the schema strictly requires `sources` array with minItems: 1 and valid citation format, all `sources` arrays in your bad fixture MUST have valid-format citations. Instead of uncited claims, use this defect: **a claim that is clearly unsupported by anything plausible from the real S-1** — e.g., a fabricated customer name or a wildly off revenue figure.*

2. **At least one internal inconsistency.** For example: executive summary says "strong customer diversification" but `key_risks` lists 77% concentration as HIGH. Or confidence scores are all 0.9+ despite the risks listed.

3. **At least one "narrative failure" — something a senior reviewer would catch but isn't a simple checklist violation.** Example: all facts are correctly stated and cited, but the `recommendation` is `advance_to_deep_diligence` with rationale praising "exceptional growth potential" while the risk section lists every red flag that would kill the deal. Right facts, wrong conclusion. Or: the `investment_thesis` is generic AI-hype boilerplate ("positioned to benefit from AI tailwinds") without company-specific reasoning. Or: the `open_diligence_questions` are checklist items already answered in `key_risks`.

   This third type of defect is the most important — it's what tests whether the evaluator can reason past mechanical checks to narrative-level judgment.

4. **Inappropriate confidence scores.** Either too high (0.95+ overall despite listed HIGH risks) or mismatched (low financial_analysis but high overall).

5. **Missing or trivialized risks.** Downplay customer concentration — say "some concentration" rather than "77%". Omit material weaknesses entirely. Or include them but with LOW severity.

Keep the "bad" memo plausible. It should NOT be obviously-broken syntax or structurally malformed. It should look like a real analyst's work product that just falls short. Target similar item counts to the good memo — the failure is in quality, not quantity.

## Final constraints

- **Return TWO JSON objects**, one per fixture, with clear labels before each ("### Fixture 1 — intentionally-good-memo.json" and "### Fixture 2 — intentionally-bad-memo.json").
- Both must validate against the schema described above. Re-read the schema once before finalizing.
- Do NOT explain the defects you introduced in the bad fixture — that defeats the calibration. Just write the memo as if a struggling junior analyst wrote it.
- Do NOT read anything else about this project before writing. Your judgment alone produces the calibration signal.

---END PROMPT---
