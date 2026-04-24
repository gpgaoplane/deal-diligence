---
status: reference-only
type: design
owner: shared
last-updated: 2026-04-24T03:30:00-04:00
read-if: "you need the v1 (2026-04-23) baseline for design philosophy and architectural topology — but the authoritative design for build phases is at `docs/plans/2026-04-24-deal-diligence-design.md`"
skip-if: "your question is about current build specifics — go to the docs/plans/ design plan instead"
related: [CONTEXT.md, IMPLEMENTATION.md, docs/plans/2026-04-24-deal-diligence-design.md, schemas/agent-output-schemas.json]
---

# Sagard AI Deal Diligence Workspace — Design Document

> **Superseded for build phases on 2026-04-24.** The authoritative design specification is now `docs/plans/2026-04-24-deal-diligence-design.md`. This document remains a valid reference for original design philosophy, component purposes, and architectural rationale, but where the plan refines a section, the plan wins. See the diff table in §14 of the plan for a section-by-section map.

**Purpose:** This document explains *how the system works* — component internals, data contracts, specialist frameworks, error handling, and design principles. It is the authoritative reference for all architectural and behavioral questions about the system.

**Companion documents:**
- `CONTEXT.md` — project scope, constraints, locked decisions, rationales
- `IMPLEMENTATION.md` — phased build plan with ordered tasks and acceptance criteria
- `CLAUDE.md` — Claude Code's working instructions for this repo

**Update frequency:** Rarely. Only when the system's architecture or component behavior genuinely changes.

**Last updated:** April 23, 2026

---

## 1. Design Philosophy

Every component in this system is shaped by seven principles. When in doubt, return to these.

### 1.1 Humans Own Judgment; AI Owns Synthesis

The system compresses evidence triangulation and structured analysis; it does not make investment decisions. Every agent is designed to *support* the human reviewer, not to *replace* them. The go/no-go recommendation is a directional signal, not a decision. This principle is immutable.

### 1.2 Deterministic Code for Deterministic Work

Pattern matching, threshold checking, arithmetic, and regex-matchable signals belong in deterministic code, not in LLM reasoning. LLMs are used for synthesis, analysis, and structured extraction — tasks where flexibility and judgment matter. Any time a component's output could be computed with rules, it *should* be computed with rules.

### 1.3 Every Claim Is Cited

Citation is not optional. Every material claim in the final memo includes a traceable source reference. Claims that cannot be cited are marked `UNSUPPORTED` and omitted. This is enforced at the schema level, not just the prompt level.

### 1.4 Framework-Grounded Reasoning

Each LLM-based agent operates within a specific analytical framework (IC Memo Taxonomy, Triangulation Analysis, Institutional LP Diligence Checklist, etc.). Frameworks are encoded in system prompts and enforced through output schemas. This produces analysis that looks like how institutional investors actually reason, rather than generic LLM output.

### 1.5 Observable by Default

Every LLM call is traced to Langfuse with full prompt, completion, cost, latency, and metadata. Every agent run is groupable by `run_id`. Every prompt is versioned. The audit trail exists from day one because regulated-industry AI without it is not production-ready.

### 1.6 Fail Loudly, Degrade Gracefully

Structured output validation errors, missing citations, contradictions between agent outputs — these should surface immediately, not silently propagate. When an agent produces low-confidence output, the evaluator flags it for human review rather than presenting it confidently.

### 1.7 Swappable Components

LLM provider, vector store, notification channel, and storage backend are all parameterized. Swapping Qwen for Claude is a one-variable change. Swapping Simple Vector Store for Supabase pgvector is a single node replacement. This is not over-engineering; it is the flexibility Sagard will need to align with their data residency and tooling choices.

---

## 2. System Topology

The system consists of four layers. Each layer has a specific responsibility and boundary.

### 2.1 Orchestration Layer (n8n)

**Responsibility:** Define the workflow, route data between agents, manage the Form Trigger entry point, handle credentials, expose the webhook endpoint.

**Components:**
- Form Trigger node (webhook at `/webhook/deal-diligence`)
- Set nodes for run metadata initialization
- AI Agent nodes (7 specialist agents)
- Execute Workflow node (for Red Flag Detector sub-workflow)
- HTTP Request nodes (for Langfuse prompt fetching, Slack webhook)
- Supabase node for data persistence
- IF node for evaluator score routing

**Runs:** Locally in Docker. Workflow JSON is the version-controlled artifact.

### 2.2 Reasoning Layer (LLM + Frameworks)

**Responsibility:** Perform the analytical work — extraction, contradiction detection, gap analysis, portfolio fit, memo generation, evaluation.

**Components:**
- Qwen3.5-Plus via Alicloud DashScope OpenAI-compatible API
- Specialist system prompts (stored in Langfuse Prompt Management, versioned)
- Structured output schemas enforced per agent

**Runs:** Alicloud-hosted; called from local n8n via HTTP.

### 2.3 Deterministic Layer (JavaScript)

**Responsibility:** Compute rule-based findings that must not be entrusted to an LLM — concentration thresholds, material weakness string matches, going concern language, related party transactions above thresholds.

**Components:**
- Red Flag Detector sub-workflow (JavaScript in an n8n Code node)
- Financial ratio helper functions (if needed)

**Runs:** Locally within n8n.

### 2.4 Persistence & Observability Layer

**Responsibility:** Store outputs, preserve traces, notify humans, manage versioned prompts.

**Components:**
- Supabase (Postgres) — `deal_memos` table for final outputs
- Langfuse Cloud — LLM call traces, cost tracking, prompt versioning
- Slack Free — human notification channel
- Simple Vector Store — in-memory document embeddings for retrieval

**Runs:** Hosted SaaS (Supabase, Langfuse, Slack) + in-process (Simple Vector Store).

---

## 3. Component-by-Component Deep Dive

### 3.1 Form Trigger

**Purpose:** Entry point for deal evaluation requests.

**Inputs:**
- `company_name` (text, required) — Display name for the deal
- `documents` (file[], 2-4 required) — PDF uploads

**Outputs:**
- Parsed form payload with uploaded file binaries

**Design notes:**
- Expose at a predictable path (`/webhook/deal-diligence`) so the demo can hit it consistently
- Accept 2-4 documents (minimum 2 needed for contradiction detection to have signal; more than 4 bloats context)
- Document types expected: regulatory filing, company press release, analyst teardown, expert call transcript, management deck

### 3.2 Coordinator (Run Metadata)

**Purpose:** Initialize the run, generate identifiers that group all downstream agent traces.

**Inputs:** Form trigger output.

**Outputs:**
```json
{
  "run_id": "<uuid>",
  "deal_id": "<slugified company_name>",
  "company_name": "<original>",
  "timestamp_started": "<iso8601>",
  "documents": [<passed through>]
}
```

**Design notes:**
- `run_id` is a UUID v4; used as Langfuse session_id
- `deal_id` is `company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`
- All downstream agents attach `run_id` and `deal_id` to every LLM call metadata

### 3.3 Document Ingestion

**Purpose:** Transform uploaded PDFs into retrievable chunks with source metadata.

**Subcomponents:**
1. **Extract from File** (n8n native) — PDF → text
2. **Default Data Loader** — text → document objects
3. **Recursive Character Text Splitter** — chunk size 1000 tokens, overlap 100 tokens
4. **Embeddings** — Alicloud `text-embedding-v3` via HTTP Request node
5. **Simple Vector Store (insert mode)** — stores embeddings with metadata

**Metadata attached per chunk:**
```json
{
  "source_name": "Cerebras S-1 Filing",
  "source_type": "regulatory_filing|press_release|analyst_report|expert_transcript|management_deck",
  "page": 23,
  "chunk_index": 4,
  "run_id": "<uuid>"
}
```

**Design notes:**
- Chunk size chosen for Qwen3.5-Plus context budget; can be tuned
- `source_type` classification is inferred from filename or derived via a lightweight LLM classification step
- Simple Vector Store is in-memory and resets per run — this is intentional (each deal is a fresh context)

### 3.4 Extraction Agent

**Purpose:** Map every source document into the canonical IC Memo Taxonomy.

**Framework: IC Memo Taxonomy**

Standard investment memo structure adopted by institutional PE/VC firms:
1. Company Overview (business model, founding, headcount, geography)
2. Investment Thesis (bull case as management presents it)
3. Market Opportunity (TAM/SAM/SOM, growth drivers, timing)
4. Business Model (revenue streams, pricing, unit economics)
5. Financial Performance (revenue, margins, growth, profitability, burn)
6. Unit Economics (CAC, LTV, payback period, cohort retention)
7. Competitive Position (competitors, moat, differentiation)
8. Management Assessment (backgrounds, track record, key person risk)
9. Customer Profile (concentration, retention, NPS, references)
10. Key Risks (business, financial, operational, regulatory, competitive)
11. Deal Structure (if disclosed: valuation, terms, use of proceeds)

**Input:** Document chunks from Simple Vector Store, one invocation per source document.

**Output schema:**
```json
{
  "source_name": "Cerebras S-1 Filing",
  "source_type": "regulatory_filing",
  "extracted_facts": {
    "company_overview": {
      "description": "...",
      "founding_year": 2016,
      "headcount": null,
      "geography": "Sunnyvale, CA",
      "citations": ["S-1 cover page", "S-1 p. 14"]
    },
    "financial_performance": {
      "revenue_latest_period": { "value": 136400000, "period": "6M 2025", "citation": "S-1 p. 67" },
      "revenue_growth_yoy": { "value": 3.4, "period": "6M 2025 vs 6M 2024", "citation": "S-1 p. 67" },
      "gross_margin": { "value": null, "citation": null },
      "operating_loss": { "value": -96000000, "period": "6M 2025", "citation": "S-1 p. 68" }
    },
    "management_claims": [
      { "claim": "Industry-leading AI inference performance", "citation": "S-1 p. 4" },
      { "claim": "Strong customer diversification", "citation": "press release p. 2" }
    ],
    "risk_factors": [
      { "factor": "Customer concentration — two customers represent 86% of revenue", "citation": "S-1 Risk Factors p. 23" },
      { "factor": "Material weaknesses in internal controls over financial reporting", "citation": "S-1 Risk Factors p. 41" }
    ]
  }
}
```

**Design notes:**
- Every fact carries a citation — the schema enforces this
- Values that cannot be extracted are `null` with `citation: null`; never invented
- `management_claims` deliberately captures what management *says*, so the Contradiction Agent can verify against reality
- `risk_factors` captures disclosed risks; the Gap Analysis Agent compares disclosed vs. expected

### 3.5 Contradiction Agent

**Purpose:** Identify claims that conflict across sources; classify each finding.

**Framework: Triangulation Analysis**

For each material claim from any source, classify its verification status:
- **CORROBORATED** — Multiple independent sources confirm the claim
- **UNCONTRADICTED** — Single source, no conflicting evidence found
- **DISPUTED** — Sources present conflicting information on the claim
- **UNSUPPORTED** — Claim exists in only one source and no supporting evidence found elsewhere

**Input:** Extracted facts from all documents + access to Simple Vector Store as a tool for retrieval.

**Output schema:**
```json
{
  "contradictions": [
    {
      "claim": "Strong customer diversification",
      "sources_making_claim": ["Cerebras press release p. 2"],
      "contradicting_evidence": [
        {
          "source": "Cerebras S-1 Filing",
          "citation": "S-1 Risk Factors p. 23",
          "evidence": "Two customers represent 86% of revenue"
        }
      ],
      "nature_of_conflict": "Management claims diversification while regulatory disclosure shows extreme concentration",
      "severity": "HIGH",
      "classification": "DISPUTED"
    }
  ],
  "verified_claims": [
    {
      "claim": "Cerebras CS-3 chip represents the latest wafer-scale generation",
      "sources": ["S-1 p. 5", "Futurum teardown", "press release"],
      "classification": "CORROBORATED"
    }
  ]
}
```

**Design notes:**
- The agent has Vector Store access as a tool (via n8n AI Agent's tool-use pattern) so it can retrieve original context when needed
- Severity is about *material impact on investment thesis*, not semantic distance
- A DISPUTED HIGH-severity claim is a critical finding; it propagates prominently in the final memo
- The agent must cite both sides of every DISPUTED finding

### 3.6 Gap Analysis Agent

**Purpose:** Identify information an institutional LP would expect but that is missing from the deal packet.

**Framework: Institutional LP Diligence Checklist**

A structured checklist covering four diligence categories:

**Financial Diligence:**
- Audited financial statements (latest 3 years)
- Gross margin breakdown by revenue line
- Unit economics (CAC, LTV, payback period)
- Cohort retention data
- Customer concentration (top 5, top 10 as % of revenue)
- Cash runway and burn rate
- Debt structure and covenants
- Auditor history and changes

**Commercial Diligence:**
- Market sizing methodology (TAM/SAM/SOM)
- Competitive moat and differentiation evidence
- Customer references and NPS
- Pricing power evidence
- Go-to-market strategy and efficiency
- Sales cycle length and win rates

**Operational Diligence:**
- Management background and track record
- Organizational structure and key person risk
- Governance structure (board composition)
- Internal controls and audit findings
- Technology stack and scalability

**Legal / Regulatory Diligence:**
- Regulatory licenses and status
- Pending litigation
- Related party transactions
- IP ownership and licensing
- Jurisdictional exposure

**Input:** Extracted facts + contradictions + access to document vector store.

**Output schema:**
```json
{
  "missing_information": [
    {
      "category": "financial_diligence|commercial_diligence|operational_diligence|legal_regulatory",
      "item": "Cohort retention data by customer vintage",
      "importance": "HIGH|MEDIUM|LOW",
      "suggested_source": "Request from management as part of follow-up diligence"
    }
  ]
}
```

**Design notes:**
- Importance is calibrated to deal stage: a Series B company without audited financials is HIGH importance; a pre-seed company is LOW
- Each missing item becomes a candidate for the `open_diligence_questions` in the final memo
- The checklist is adaptive: some items are more critical for certain sector/stage combinations (handled via prompt conditional logic)

### 3.7 Red Flag Detector (Deterministic Sub-Workflow)

**Purpose:** Apply rule-based detection to high-signal patterns that must not be entrusted to an LLM.

**Framework: Deterministic Pattern Matching**

JavaScript-based checks against extracted facts and raw document text:

| Flag | Detection logic | Default severity |
|---|---|---|
| `customer_concentration_high` | Any single customer >30% of revenue | MEDIUM |
| `customer_concentration_extreme` | Any single customer >50% of revenue OR top 2 >70% | HIGH |
| `material_weakness` | Regex match on "material weakness" in document text | HIGH |
| `going_concern` | Regex match on "going concern" or "substantial doubt" | HIGH |
| `related_party_above_threshold` | Related party transaction disclosure >5% of revenue | MEDIUM |
| `revenue_growth_anomalous` | YoY growth >500% (may indicate small base or non-recurring) | LOW |
| `burn_rate_runway_short` | Implied runway <12 months based on cash and burn | MEDIUM |
| `auditor_change_recent` | Auditor change within past 2 years | MEDIUM |
| `dual_class_structure` | Triple-class or founder-controlled dual-class shares | LOW |
| `s1_previously_withdrawn` | Previous S-1 filing withdrawn | MEDIUM |

**Input:** Extracted facts JSON + raw document text (for regex matching).

**Output schema:**
```json
{
  "red_flags": [
    {
      "flag_type": "customer_concentration_extreme",
      "severity": "HIGH",
      "evidence": {
        "actual_value": 86,
        "threshold": 70,
        "source": "S-1 Risk Factors p. 23",
        "raw_text": "Two customers together represented approximately 86% of our revenue..."
      },
      "deterministic": true
    }
  ]
}
```

**Design notes:**
- `deterministic: true` is an explicit field to distinguish rule-based flags from LLM-generated analysis
- Thresholds are configurable via a constants block at the top of the JS file
- The regex patterns are carefully tuned to avoid false positives on negated statements ("no material weakness")
- This component must remain LLM-free; if a future change makes an LLM call easier, resist it

### 3.8 Portfolio Fit Agent

**Purpose:** Evaluate how the target deal aligns with Sagard's thesis and existing portfolio.

**Framework: Sagard Thesis Alignment**

Four-dimensional evaluation:
1. **Strategic Fit** — Does the target's sector align with Sagard's focus areas (fintech, healthtech, climate tech, select AI)?
2. **Stage Fit** — Does the target's stage match Sagard's typical investment stage (Series B+, growth equity, credit)?
3. **Synergy Potential** — Does the target benefit from or benefit Sagard's existing portfolio companies (KOHO, Wealthsimple, Boosted.AI, others)?
4. **Anti-Pattern Check** — Are there reasons Sagard would specifically *not* want this deal (e.g., $20B AI infra IPO is outside typical scope)?

**Input:** Extracted facts + `sagard-portfolio.json` (simulated Sagard portfolio).

**Output schema:**
```json
{
  "portfolio_fit": {
    "strategic_fit": {
      "score": 0.35,
      "rationale": "AI infrastructure is outside Sagard's stated primary focus areas (fintech, healthtech, climate tech); limited overlap with existing AI positions which are application-layer (Boosted.AI)."
    },
    "stage_fit": {
      "score": 0.20,
      "rationale": "Late-stage IPO candidate is larger than Sagard's typical private investment target; public market exposure not aligned with current fund strategies."
    },
    "synergy_potential": [
      {
        "portfolio_company": "Boosted.AI",
        "synergy_type": "technology_adjacency",
        "description": "Both serve AI-driven financial analytics; different layers of the stack",
        "strength": "LOW"
      }
    ],
    "anti_patterns": [
      {
        "pattern": "$20B+ AI infrastructure IPO",
        "concern": "Outside Sagard's typical check size and stage; public market exposure deviates from alternative asset strategy"
      }
    ],
    "overall_thesis_alignment": "LOW",
    "recommended_action": "pass"
  }
}
```

**Design notes:**
- Scores are 0.0-1.0 for interpretability
- `overall_thesis_alignment` is categorical: LOW / MEDIUM / HIGH
- `recommended_action` is *directional only* — the final recommendation remains the human's to make
- `sagard-portfolio.json` is pre-loaded and static for the prototype; production would pull from Sagard's actual portfolio data

### 3.9 Memo Generation Agent

**Purpose:** Synthesize all upstream outputs into a structured IC-grade investment memo with enforced citations.

**Framework: IC Memo Structure with Citation Enforcement**

Standard IC memo format:
1. Executive Summary (3-5 sentences)
2. Recommendation (pass / pursue / advance_to_deep_diligence) with rationale
3. Company Snapshot
4. Investment Thesis (bull case)
5. Key Strengths (3-5 with citations)
6. Key Risks (3-7 with citations and severity)
7. Contradictions Identified
8. Missing Information & Open Diligence Questions
9. Red Flags Surfaced
10. Portfolio Fit Assessment
11. Confidence Scores

**Input:** Extraction output + Contradiction output + Gap Analysis output + Red Flag Detector output + Portfolio Fit output.

**Output schema:** (see Section 4.5 for full schema)

**Citation enforcement:**
- Every entry in `key_strengths` and `key_risks` MUST include a `sources` array
- If the agent cannot cite, it marks the claim as `UNSUPPORTED` and omits it
- This is enforced at both prompt level and schema validation level

**Design notes:**
- The agent receives a comprehensive context bundle; the prompt structure guides synthesis without prescribing phrasing
- `confidence_scores` are per-section (0.0-1.0) and reflect the agent's assessment of its own evidence quality
- The memo is designed to be readable by a human investment committee member without additional context

### 3.10 Evaluator Agent

**Purpose:** Quality-check the generated memo before it reaches human review.

**Framework: Six-Criteria Quality Check**

Six criteria, each scored 0-10:
1. **Citation completeness** — Does every material claim have a source citation?
2. **Contradiction acknowledgment** — Are upstream contradictions addressed in the memo?
3. **Missing information coverage** — Are upstream gaps reflected as diligence questions?
4. **Red flag propagation** — Are deterministic flags included and weighted appropriately?
5. **Reasoning coherence** — Does the recommendation logically follow from the evidence?
6. **Hallucination check** — Are there claims in the memo not supported by extracted facts?

**Input:** Full memo output + all upstream agent outputs for cross-checking.

**Output schema:**
```json
{
  "evaluator_score": 47,
  "criteria_scores": {
    "citation_completeness": 9,
    "contradiction_acknowledgment": 8,
    "missing_information_coverage": 8,
    "red_flag_propagation": 10,
    "reasoning_coherence": 7,
    "hallucination_check": 5
  },
  "critical_issues": [
    {
      "issue_type": "potential_hallucination",
      "description": "Memo claims 'Cerebras has 400+ employees' but this figure is not present in any upstream extraction",
      "severity": "MEDIUM"
    }
  ],
  "routing_decision": "complete|flagged_for_review|complete_high_confidence"
}
```

**Scoring thresholds:**
- < 35/60 → `flagged_for_review` (mandatory human review before any further processing)
- 35-50/60 → `complete` (standard human review)
- 50+/60 → `complete_high_confidence` (human review, flagged as high-confidence output)

**Design notes:**
- Evaluator uses the same LLM as specialist agents (Qwen3.5-Plus) but with a fundamentally different prompt shape — it is a *reviewer*, not a generator
- Critical issues are flagged regardless of overall score — even a 48/60 memo with a hallucination is still concerning
- The evaluator does not rewrite the memo; it reports findings and the routing decision

### 3.11 Persistence Layer (Supabase)

**Purpose:** Store final memos in a queryable, audit-ready structure.

**Schema:** See `CONTEXT.md` Section 5.8 for full DDL.

**Design notes:**
- Every memo gets a unique UUID primary key
- `run_id` groups this memo with its Langfuse traces
- Structured fields are JSONB, queryable with Postgres JSON operators
- `status` field enables filtering (e.g., `WHERE status = 'flagged_for_review'` for review queue)
- Row-level security can be added in production for multi-user access control; not included in prototype

### 3.12 Observability Layer (Langfuse)

**Purpose:** Trace every LLM call with full fidelity; version specialist prompts; track cost and latency.

**Trace structure:**
- Every LLM call is a Langfuse generation event
- Every agent run is a Langfuse span
- Every deal evaluation is a Langfuse session (grouped by `run_id`)

**Metadata attached to every generation:**
```json
{
  "session_id": "<run_id>",
  "deal_id": "<slugified company_name>",
  "agent_name": "extraction_agent|contradiction_agent|...",
  "prompt_name": "deal-diligence/extraction-agent",
  "prompt_version": "v1",
  "tags": ["deal-diligence", "sagard-demo"]
}
```

**Prompt versioning:**
- Every specialist prompt is stored in Langfuse Prompt Management
- n8n fetches prompts at runtime via the official Langfuse node
- Prompt changes are tracked with version, timestamp, and author
- Prompts can be tagged (e.g., `production`, `experimental`) and retrieved by tag

**Design notes:**
- Langfuse is the audit trail — compliance can replay any run by `run_id`
- Cost tracking enables per-deal economics visibility
- Prompt versioning means "what prompt generated this memo six months ago" is answerable

### 3.13 Notification Layer (Slack)

**Purpose:** Alert the investment team when a new memo is ready for review.

**Message format:**
```
🔔 New deal memo ready for review

Company: Cerebras Systems Inc.
Recommendation: PASS (directional)
Evaluator Quality Score: 47/60

Key flags:
- Customer concentration: 86% (EXTREME)
- Material weakness in internal controls
- Complex capital structure

Review at: <Supabase record link>
Langfuse trace: <Langfuse session link>
```

**Design notes:**
- Sent via Slack incoming webhook (no OAuth needed for prototype)
- Production would use Slack app with richer formatting (blocks, buttons for Accept/Flag)
- Message includes deep links to both the memo and the trace for full auditability

---

## 4. Data Contracts

Authoritative JSON schemas for every inter-agent handoff. Agents must produce exactly these shapes; consumers can rely on them.

### 4.1 Extraction Agent Output

```json
{
  "source_name": "string",
  "source_type": "regulatory_filing|press_release|analyst_report|expert_transcript|management_deck",
  "extracted_facts": {
    "company_overview": { "description": "string", "founding_year": "number|null", "headcount": "number|null", "geography": "string", "citations": ["string"] },
    "investment_thesis": { "bull_case": "string", "citations": ["string"] },
    "market_opportunity": { "tam": "number|null", "sam": "number|null", "som": "number|null", "growth_drivers": ["string"], "citations": ["string"] },
    "business_model": { "revenue_streams": ["string"], "pricing": "string|null", "citations": ["string"] },
    "financial_performance": { "revenue_latest_period": { "value": "number|null", "period": "string", "citation": "string" }, "revenue_growth_yoy": { "value": "number|null", "period": "string", "citation": "string" }, "gross_margin": { "value": "number|null", "citation": "string|null" }, "operating_loss": { "value": "number|null", "period": "string", "citation": "string|null" } },
    "unit_economics": { "cac": "number|null", "ltv": "number|null", "payback_period_months": "number|null", "citations": ["string"] },
    "competitive_position": { "competitors": ["string"], "moat": "string|null", "citations": ["string"] },
    "management_assessment": { "key_personnel": ["string"], "key_person_risk": "boolean|null", "citations": ["string"] },
    "customer_profile": { "concentration_top_1": "number|null", "concentration_top_5": "number|null", "retention_rate": "number|null", "citations": ["string"] },
    "risk_factors": [{ "factor": "string", "citation": "string" }],
    "management_claims": [{ "claim": "string", "citation": "string" }],
    "deal_structure": { "valuation": "number|null", "amount_raising": "number|null", "use_of_proceeds": "string|null", "citations": ["string"] }
  }
}
```

### 4.2 Contradiction Agent Output

```json
{
  "contradictions": [{
    "claim": "string",
    "sources_making_claim": ["string"],
    "contradicting_evidence": [{ "source": "string", "citation": "string", "evidence": "string" }],
    "nature_of_conflict": "string",
    "severity": "HIGH|MEDIUM|LOW",
    "classification": "DISPUTED|UNSUPPORTED|CORROBORATED|UNCONTRADICTED"
  }],
  "verified_claims": [{ "claim": "string", "sources": ["string"], "classification": "CORROBORATED|UNCONTRADICTED" }]
}
```

### 4.3 Gap Analysis Agent Output

```json
{
  "missing_information": [{
    "category": "financial_diligence|commercial_diligence|operational_diligence|legal_regulatory",
    "item": "string",
    "importance": "HIGH|MEDIUM|LOW",
    "suggested_source": "string"
  }]
}
```

### 4.4 Red Flag Detector Output

```json
{
  "red_flags": [{
    "flag_type": "string",
    "severity": "HIGH|MEDIUM|LOW",
    "evidence": { "actual_value": "number|string", "threshold": "number|string|null", "source": "string", "raw_text": "string" },
    "deterministic": true
  }]
}
```

### 4.5 Memo Generation Agent Output

```json
{
  "executive_summary": "string",
  "recommendation": "pass|pursue|advance_to_deep_diligence",
  "recommendation_rationale": "string",
  "company_snapshot": { "description": "string", "stage": "string", "sector": "string", "geography": "string" },
  "investment_thesis": "string",
  "key_strengths": [{ "strength": "string", "severity": "HIGH|MEDIUM|LOW", "sources": ["string"], "confidence": "number" }],
  "key_risks": [{ "risk": "string", "severity": "HIGH|MEDIUM|LOW", "sources": ["string"], "confidence": "number" }],
  "contradictions": [{ "claim": "string", "severity": "HIGH|MEDIUM|LOW", "sources": ["string"] }],
  "missing_information": [{ "item": "string", "importance": "HIGH|MEDIUM|LOW" }],
  "red_flags": [{ "flag_type": "string", "severity": "HIGH|MEDIUM|LOW" }],
  "portfolio_fit": { "overall_alignment": "HIGH|MEDIUM|LOW", "rationale": "string" },
  "open_diligence_questions": ["string"],
  "confidence_scores": {
    "overall": "number",
    "financial_analysis": "number",
    "competitive_positioning": "number",
    "management_assessment": "number",
    "portfolio_fit": "number"
  }
}
```

### 4.6 Evaluator Agent Output

```json
{
  "evaluator_score": "number",
  "criteria_scores": {
    "citation_completeness": "number",
    "contradiction_acknowledgment": "number",
    "missing_information_coverage": "number",
    "red_flag_propagation": "number",
    "reasoning_coherence": "number",
    "hallucination_check": "number"
  },
  "critical_issues": [{ "issue_type": "string", "description": "string", "severity": "HIGH|MEDIUM|LOW" }],
  "routing_decision": "complete|flagged_for_review|complete_high_confidence"
}
```

---

## 5. Error Handling and Failure Modes

### 5.1 Document Parsing Failures

**Symptoms:** PDF text extraction returns garbage, missing text, or only partial content.

**Handling:** The Extract from File node should surface errors rather than silently pass empty content. If extraction quality is low (heuristic: <500 chars from a >10-page PDF), the workflow logs a warning and proceeds with whatever was extracted. The final memo's `confidence_scores.overall` is penalized proportionally.

### 5.2 LLM API Failures

**Symptoms:** Alicloud returns 5xx, rate limits, or malformed JSON.

**Handling:** The HTTP Request node has retry logic (3 attempts with exponential backoff). If all retries fail, the workflow routes to an error handling branch that logs the failure to Supabase with `status: 'error'` and sends a Slack message indicating the error.

### 5.3 Schema Validation Failures

**Symptoms:** An agent returns JSON that doesn't match the expected schema.

**Handling:** Each agent output is validated against its schema (via a dedicated Code node after the agent). If validation fails, the workflow retries the agent with a schema-enforced prompt addendum: "Your previous response did not match the required schema. Please regenerate with exact adherence to this schema: {...}". If retry also fails, the evaluator is informed and this counts against the overall quality score.

### 5.4 Missing Citations

**Symptoms:** Memo Generation Agent produces a claim without a source citation.

**Handling:** Two layers of defense:
1. **Prompt level:** System prompt explicitly instructs the agent to mark uncited claims as `UNSUPPORTED` and omit them
2. **Evaluator level:** The Evaluator Agent's `citation_completeness` criterion detects missing citations and penalizes the score

### 5.5 Hallucination Detection

**Symptoms:** Memo claims something not supported by any upstream agent's output.

**Handling:** The Evaluator Agent is specifically tasked with `hallucination_check` — comparing every claim in the memo against the union of upstream outputs. Any unsupported claim surfaces as a `critical_issue` regardless of overall score.

### 5.6 Total Workflow Failure

**Symptoms:** Workflow crashes partway through with no memo produced.

**Handling:** A final error-handling branch catches unhandled exceptions, logs to Supabase with `status: 'error'` and the stack trace, sends a Slack alert. The user sees "Deal evaluation failed; please retry or escalate." No partial memo is surfaced — partial outputs are worse than no output in a compliance context.

---

## 6. Observability Design

### 6.1 What Gets Traced

Every LLM call: full prompt, full completion, model name, tokens consumed, cost (calculated), latency, metadata.

Every agent run: start timestamp, end timestamp, duration, input payload (truncated), output payload (truncated), status.

Every deal evaluation: run_id, deal_id, documents ingested, total agent runs, total cost, total duration, final status, evaluator score.

### 6.2 Trace Structure in Langfuse

```
Session (run_id) ────────────────────────────────────
  ├── Span: extraction_agent
  │   └── Generation: Qwen3.5-Plus call
  ├── Span: contradiction_agent
  │   ├── Generation: Qwen3.5-Plus call
  │   └── Generation: Vector Store tool call (if using tool-use)
  ├── Span: gap_analysis_agent
  │   └── Generation: Qwen3.5-Plus call
  ├── Span: red_flag_detector (deterministic — no LLM calls)
  ├── Span: portfolio_fit_agent
  │   └── Generation: Qwen3.5-Plus call
  ├── Span: memo_generation_agent
  │   └── Generation: Qwen3.5-Plus call
  └── Span: evaluator_agent
      └── Generation: Qwen3.5-Plus call
```

### 6.3 Querying the Audit Trail

The audit trail supports these questions:
- "Show me all deals evaluated in the past week" → Langfuse session list filtered by timestamp
- "Why did the system recommend PASS for Cerebras?" → Drill into session, view memo generation span, see full prompt + completion
- "Which prompt version generated this memo?" → Metadata on memo generation generation
- "What was the total cost of this deal evaluation?" → Session total from Langfuse dashboard
- "Which agent took longest to run?" → Span durations within session

---

## 7. Extension Points

Explicitly designed-in expansion paths for production deployment.

### 7.1 Multi-User Access Control

The prototype is single-user. Production would add:
- Supabase Row Level Security policies on `deal_memos`
- Langfuse user attribution via metadata
- n8n credential scoping per user

### 7.2 Additional Specialist Agents

The architecture supports adding agents without restructuring. Candidates for production:
- **Comparable Transactions Agent** — finds similar past deals in CRM/portfolio history
- **Market Sizing Validator** — cross-checks claimed TAM against external data sources
- **Management Background Agent** — pulls LinkedIn/Crunchbase data on key personnel
- **Regulatory Exposure Agent** — checks jurisdictional and industry-specific compliance posture

### 7.3 Real-Time Portfolio Data

Prototype uses static `sagard-portfolio.json`. Production would replace with:
- API integration to Sagard's portfolio management system
- Real-time portfolio company KPI monitoring
- Active vs. latent conflict detection (e.g., competitive overlap with existing holdings)

### 7.4 Continuous Monitoring Mode

Beyond initial screening, the same agent architecture can monitor existing portfolio companies:
- Scheduled re-ingestion of portfolio company updates
- Delta detection across reporting periods
- Alert routing when red flags emerge post-investment

### 7.5 Human Feedback Loop

Production should add:
- Human reviewer markup on generated memos (annotations, corrections)
- Fine-tuning data collection from accepted/rejected memo sections
- Agent prompt iteration informed by reviewer feedback

---

## 8. Out of Scope

Explicitly not attempted in this prototype, to prevent scope creep:

- **Final investment decision automation** — Permanently out of scope (violates the human-in-the-loop principle)
- **CRM integration** — Not required for this demo; mentioned in production narrative only
- **Multi-language document support** — English documents only
- **OCR for scanned PDFs** — Assumes extractable text; production would add OCR for image-based PDFs
- **Real-time collaborative review** — Single-reviewer model for prototype
- **Automated outreach based on recommendations** — All downstream action remains human
- **Financial model building** — The system extracts and analyzes; it does not build DCF or comp models
- **Legal contract analysis** — Term sheet and contract parsing is distinct work; out of scope
- **Video / audio diligence materials** — PDF-only for prototype; production would add transcription

---

## 9. Design Decision Index

Quick reference to decisions documented in `CONTEXT.md` Section 5.10:

- Why local n8n — Version control, Claude Code as builder, data residency narrative
- Why Qwen3.5-Plus — Free credits; swappable architecture
- Why Supabase — Real database, queryable, production-appropriate
- Why Langfuse — Cover letter consistency; Pari's domain alignment
- Why specialist frameworks — Primary intellectual differentiator
- Why deterministic Red Flag Detector — Governance; "LLM didn't hallucinate this" narrative
- Why citation enforcement — Regulated-industry requirement
- Why Evaluator agent — Quality gate; evaluation-first design
- Why CoreWeave + Cerebras — Sector parity + topicality; dev/demo separation
- Why three-agent build pattern — Alignment with Sagard's stated toolchain

---

**End of DESIGN.md**

*Changes to architectural decisions require updating both this document and `CONTEXT.md` Section 5.10.*
