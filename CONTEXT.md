---
status: active
type: project-scope
owner: shared
last-updated: 2026-04-25T09:14:33-04:00
read-if: "you are any agent working on this project — this is the authoritative scope and locked-decisions doc"
skip-if: "never on first session; re-read §5 and §5.10 before proposing changes to locked decisions"
related: [DESIGN.md, IMPLEMENTATION.md, docs/STATUS.md, .claude/memory/context.md, .claude/memory/decisions.md]
---

# Sagard AI Deal Diligence Workspace — Master Context Document

**Purpose of this document:** This is the single source of truth for AI coding agents (Claude Code, Codex, and any future collaborators) working on the Sagard AI Builder / Forward Deployed Engineer take-home project. Read this end-to-end before taking any action. Update the Progress Log section as you work.

**Last updated:** April 23, 2026 (v2 — switched to local n8n)
**Original deadline:** April 24, 2026 (passed; project continues without an active deadline)
**Primary operator:** Will (Xinyuan) Guo
**Target evaluator:** Parinaz Sobhani, Managing Director & Head of AI, Sagard

---

## 1. Project Brief (Exact Requirements from Sagard)

From Pari Sobhani's email dated April 23, 2026 1:46 PM:

> "For this step, we'd like you to build something. Design and prototype an AI system that helps an Investments team member at Sagard do something they couldn't do before (or do it significantly better) — think workflow automation or a lightweight application.
>
> Your system should:
> - Take on real cognitive or operational work — not just formatting or summarizing
> - Include one decision that stays human, and a brief explanation of why
> - Connect to at least 2 tools or systems
>
> To submit, please send:
> 1. A short demo video (2–3 minutes) showing the system actually working — not a slideshow, a live demo (via YouTube, Vimeo, Google Drive, or Dropbox)
> 2. A written explanation (max 250 words) covering:
>    - What the human can now do that they couldn't before
>    - What the AI is responsible for
>    - Where the AI has to stop
>    - What would break first if this scaled to 10x the volume
>
> We're not looking for perfect — we're looking for real and shippable. **Bonus points if your solution uses tools we work with: Claude Code, Codex, and n8n.**"

**Original deadline: April 24, 2026 (passed; project continues post-deadline without an active due date).**

---

## 2. Evaluator Context — Who You Are Building For

Parinaz Sobhani is not a typical hiring manager. Build with her specifically in mind.

**Background:**
- PhD in NLP from University of Ottawa
- Previously Head of AI at Georgian Partners (Canada's largest VC) where she built and led a 10-person AI team supporting 50+ portfolio companies
- Joined Sagard September 2024 as first-ever Head of AI, tasked with making Sagard "AI-first"
- Has evaluated hundreds of AI implementations; instantly distinguishes demo-ware from production thinking
- Has publicly written and spoken about: evaluation frameworks, governance in finance AI, reasoning vs. pattern matching in LLMs, and the importance of portfolio company adoption patterns

**What she will evaluate:**
- Architectural maturity (not just "does it work")
- Governance thinking (provenance, auditability, evaluation)
- Framework-grounded reasoning (not just "wire up an LLM")
- Understanding of investment workflows specifically
- Evidence that the candidate can operate at Sagard's standard
- Evidence that the candidate works the way her team works (Claude Code, Codex, version-controlled artifacts)

**Red flags she will catch:**
- Generic LLM wrapper with no specialist framing
- No evaluation layer
- No observability or audit trail
- No citations / provenance on generated claims
- LLM asked to do deterministic computation (math, regex-matchable patterns)
- Naive "upload docs, get summary" with no new capability
- Framing that shows the candidate didn't understand the investment workflow
- Cloud-native hand-wave when the prototype is in a regulated-industry context

---

## 3. Company Context — Sagard

**Who they are:**
- Global multi-strategy alternative asset manager
- Over $45B AUM, 190+ portfolio companies, 540 professionals
- Active in venture capital, private equity, private credit, real estate
- Founded 2016, HQ Montreal, offices across North America, Europe, Middle East
- Backed by Desmarais family (Power Corporation), Abu Dhabi sovereign wealth fund, Bank of Montreal, Groupe Bruxelles Lambert, Robert W. Baird & Co.

**Relevant portfolio companies (for Portfolio Fit agent context):**
- KOHO — fintech, spending cards and accounts
- Wealthsimple — digital investment platform
- Boosted.AI — portfolio management AI tools
- Additional fintech, healthtech, climate tech positions

**Stated AI focus areas:**
- Fintech (via Diagram, Portage Ventures)
- Healthtech
- Climate tech
- AI infrastructure (limited — Sagard typically does not invest in $20B+ AI infrastructure IPOs)

**Their stack and stated tool preferences:**
- Claude Code (mentioned explicitly by Pari)
- Codex (mentioned explicitly by Pari)
- n8n (mentioned explicitly by Pari)
- Internal implication: they likely use Slack (corporate standard for firms of this size), Google Workspace or Microsoft 365

---

## 4. Candidate Context — Will Guo's Positioning

**Positioning statement for this role:**
"Enterprise-grade AI engineer with forward-deployed delivery discipline and institutional finance domain fluency, uniquely combining production agentic systems experience with alternative asset management context."

**Relevant experience to reference in any documentation or commentary:**
- Dalamula Technology — 50+ client engagements with end-to-end AI system ownership
- Agentic News Intelligence Platform — production multi-agent pipeline on GCP with 7-layer DAG, coordinator + 6 sub-agents, RAG via Vertex AI Vector Search, DeepEval evaluation, Langfuse observability
- Super Claude Framework — published on Claude Code marketplace, encoding harness engineering practices
- Agentic Full-Suite Marketing Team — multi-agent coordinator with 6 specialists, HubSpot CRM integration
- Inception Capital — evaluated 120+ companies across AI/Web3/fintech, drove two IC approvals, hands-on institutional investment workflow exposure
- UCLA Anderson MFE — quantitative modeling, financial statements, risk metrics, portfolio analytics foundation

**Key differentiators to emphasize:**
1. Day-one adopter of every major agentic wave (LangGraph, Google ADK, CrewAI, AutoGen, MCP, OpenClaw)
2. Institutional investment domain fluency from Inception Capital + UCLA MFE
3. Harness engineering expertise encoded in Super Claude Framework
4. End-to-end production deployment across 61+ documented implementations

---

## 5. Project Architecture — Decisions Locked

### 5.1 Project Concept

**Name:** AI Deal Diligence Workspace

**Tagline:** "Converts a fragmented deal packet into a structured, cited, auditable investment memo with contradiction detection, gap analysis, and deterministic red-flag surfacing — while preserving the investment team's final go/no-go judgment."

**Core value proposition:** An investment team member at Sagard today manually reads through CIMs, expert call transcripts, financial statements, and news, then synthesizes this into a preliminary screening memo over hours. The Diligence Workspace compresses this to minutes while surfacing contradictions and gaps a human reviewer might miss, and routes the final advance/pass decision to the human.

### 5.2 Human-in-the-Loop Boundary (Critical — This Must Be Clearly Articulated)

**The one decision that stays human:** Whether to advance the deal to deeper diligence (or pass).

**Why this decision stays human:**
- Capital allocation decisions carry fiduciary responsibility to LPs
- Investment committee accountability is a governance requirement
- Pattern recognition across deals is a judgment call that requires institutional context the system cannot replicate
- Regulatory and compliance environments require human accountability for material investment decisions

**What the AI is responsible for:**
- Structured fact extraction from all source documents
- Cross-document contradiction detection
- Gap analysis against institutional LP diligence standards
- Deterministic red-flag pattern matching (customer concentration, material weaknesses, going concern, etc.)
- Sagard portfolio fit assessment
- Draft IC-grade investment memo with required citations
- Quality self-evaluation via LLM-as-judge before surfacing to human

**Where the AI has to stop:**
- Making the go/no-go recommendation beyond a directional signal (pursue / advance / pass)
- Final memo sign-off without human review
- Any downstream action (scheduling calls, notifying third parties, moving deals in CRM)

### 5.3 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Form Trigger (n8n)                          │
│         Company Name + 2-4 Deal Documents (PDF)                  │
│     (exposed at http://localhost:5678/webhook/deal-diligence)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │   Coordinator   │
                  │  (run_id, etc)  │
                  └────────┬────────┘
                           │
           ┌───────────────▼───────────────┐
           │     Document Ingestion         │
           │ Extract → Chunk → Embed →      │
           │   Simple Vector Store           │
           └───────────────┬───────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────▼────┐          ┌─────▼──────┐        ┌─────▼──────┐
│Extraction│────────▶│Contradiction│───────▶│Gap Analysis│
│ Agent   │          │   Agent    │        │   Agent    │
└────┬────┘          └────────────┘        └─────┬──────┘
     │                                            │
     │                                      ┌─────▼──────┐
     │                                      │ Red Flag   │
     │                                      │ Detector   │
     │                                      │(determ. JS)│
     │                                      └─────┬──────┘
     │                                            │
     └──────────────┬─────────────────────────────┘
                    │
           ┌────────▼────────┐
           │ Portfolio Fit   │
           │     Agent       │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ Memo Generation │
           │   Agent         │
           │ (w/ citations)  │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ Evaluator Agent │
           │ (LLM-as-judge)  │
           └────────┬────────┘
                    │
         ┌──────────▼──────────┐
         │  IF quality < 35    │
         │    → flagged        │
         │  ELSE → complete    │
         └──────────┬──────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐
│Supabase │   │  Slack    │  │ Langfuse  │
│ (memo)  │   │  Notify   │  │ (traces)  │
└─────────┘   └───────────┘  └───────────┘
```

**Deployment mode:** All n8n workflow execution runs locally in Docker. Only Supabase, Langfuse, and Slack are hosted (SaaS free tiers). LLM calls route from local n8n to Alicloud DashScope.

### 5.4 Technology Stack — Locked Decisions

| Component | Choice | Rationale (see Section 5.10 for detailed reasoning) |
|---|---|---|
| Workflow orchestration | **Local n8n via Docker Compose** | Version-controlled workflow JSON; aligns with Claude Code as primary builder; stronger finance-industry narrative |
| Container runtime | Docker + Docker Compose | Standard, reproducible local environment |
| LLM (prototype) | Qwen3-Max (`qwen3-max-2026-01-23`) via Alicloud DashScope OpenAI-compatible endpoint | Will has free Alicloud credits; parameterized for easy swap |
| LLM (production narrative) | Claude via AWS Bedrock, Anthropic API, or GCP Vertex AI | Data residency alignment for Canadian finance firm |
| Embeddings | Alicloud text-embedding-v3 | Matches LLM provider for prototype |
| Vector store | n8n Simple Vector Store (in-memory) | Zero-setup for prototype; Supabase pgvector for production |
| Primary data store | Supabase (Postgres, hosted) | Real database, queryable, production-appropriate |
| Observability | Langfuse Cloud via `n8n-nodes-openai-langfuse` community node | Only workable Langfuse integration for n8n as of April 2026 |
| Prompt management | Langfuse Prompt Management (official n8n node) | Versioned specialist prompts with audit trail |
| Human notification | Slack Free (via incoming webhook) | Industry standard for financial firms; no OAuth needed for webhook |
| Repository | GitHub (`deal-diligence`) | Version-controlled workflow JSON + prompts + documentation |
| Primary build agent | Claude Code | Explicitly mentioned by Sagard; primary authoring of workflow JSON and code |
| Secondary review agent | Codex | Explicitly mentioned by Sagard; second-opinion review of Claude Code's output |
| Strategic guidance agent | Claude Chat (Opus) | Architecture decisions, context stewardship, prompt engineering |
| Optional demo helper | ngrok | If demo needs public webhook URL; otherwise localhost |

**Explicitly rejected options (do not reintroduce without new information):**
- n8n Cloud (UI-driven, not version-controllable, weaker finance-industry narrative)
- Airtable (signals prototype rather than production)
- Email notification (less demo-able than Slack)
- Telegram (ambiguous positioning for finance firm)
- Synthetic / fictional company documents (real SEC filings are more credible)
- OpenAI/GPT (no clean rationale given Alicloud credits exist)
- Custom-hosted Langfuse (overkill for prototype timeline)

### 5.5 Specialist Agent Frameworks

Each sub-agent encodes a specific analytical framework in its system prompt. This is deliberate and is the project's primary intellectual differentiator.

| Agent | Framework | Purpose |
|---|---|---|
| Extraction | IC Memo Taxonomy | Extracts facts into canonical investment memo structure |
| Contradiction | Triangulation Analysis | Cross-source evidence verification with MECE classification |
| Gap Analysis | Institutional LP Diligence Checklist | Identifies missing items across Financial, Commercial, Operational, Legal/Regulatory diligence |
| Red Flag Detector | Deterministic Pattern Matching | JavaScript-based regulatory/financial red flag detection — NOT LLM-based |
| Portfolio Fit | Sagard Thesis Alignment | Strategic fit, stage fit, synergy potential, anti-pattern check |
| Memo Generation | IC Memo Structure with Citation Enforcement | Standard IC memo format; every claim requires citation |
| Evaluator | Six-Criteria Quality Check | Citation completeness, contradiction acknowledgment, gap coverage, red flag propagation, reasoning coherence, hallucination detection |

### 5.6 Test Cases

**Development case: CoreWeave**
- Filed S-1 March 3, 2025, IPO completed March 2025
- Known issues system must surface: 77% customer concentration (Microsoft 62%), material weaknesses in internal controls, debt-heavy balance sheet ($14.5B+ total financing, mostly debt), Nvidia GPU dependency, triple-class share structure, hyperscaler disintermediation risk

**Demo case: Cerebras**
- Filed S-1 April 17, 2026 (6 days before deadline — maximum topicality)
- Known issues system must surface: 86% revenue concentration in two UAE-based entities (G42 + related), material weaknesses in internal controls, $20B OpenAI deal is mostly backlog not recognized revenue, withdrew prior 2024 S-1, complex capital structure

**Why this pairing:**
- Dev case is thoroughly analyzed in public, so issues are known
- Demo case is current and unfamiliar, so passing it demonstrates generalization
- Both are AI infrastructure IPOs with similar risk patterns but distinct specific issues

### 5.7 Document Source URLs

**Cerebras (demo case):**
- S-1 Filing: SEC EDGAR search → "Cerebras Systems Inc" → April 17, 2026 S-1
- Press release: https://www.cerebras.ai/press-release/cerebras-systems-announces-filing-of-registration-statement-for-proposed-initial-ipo
- Futurum teardown: https://futurumgroup.com/insights/cerebras-s-1-teardown-is-the-23b-wafer-scale-ipo-the-end-of-gpu-homogeneity/
- Motley Fool analysis: https://www.fool.com/investing/2026/04/20/cerebras-ipo-date-stock-price-ai-stocks-nvda-stock/

**CoreWeave (dev case):**
- S-1 Filing: SEC EDGAR search → "CoreWeave Inc" → March 3, 2025 S-1
- Fortune article: https://finance.yahoo.com/news/ai-startup-coreweave-files-2025-030641690.html
- Mostly Metrics teardown: https://www.mostlymetrics.com/p/coreweave-ipo-s1-breakdown
- Level Headed Investing case study: https://www.levelheadedinvesting.com/p/when-growth-runs-on-debt-the-coreweave-case-study

### 5.8 Supabase Schema

```sql
CREATE TABLE deal_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  deal_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'complete', 'flagged_for_review')),
  executive_summary TEXT,
  recommendation TEXT CHECK (recommendation IN ('pass', 'pursue', 'advance_to_deep_diligence')),
  key_strengths JSONB,
  key_risks JSONB,
  contradictions JSONB,
  missing_information JSONB,
  red_flags JSONB,
  portfolio_fit JSONB,
  open_diligence_questions JSONB,
  confidence_scores JSONB,
  evaluator_score INTEGER,
  evaluator_feedback JSONB,
  source_documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_memos_deal_id ON deal_memos(deal_id);
CREATE INDEX idx_deal_memos_status ON deal_memos(status);
CREATE INDEX idx_deal_memos_created_at ON deal_memos(created_at DESC);
```

### 5.9 Langfuse Configuration

**Project name:** `sagard-deal-diligence`

**Prompt entries to version:**
- `deal-diligence/extraction-agent`
- `deal-diligence/contradiction-agent`
- `deal-diligence/gap-analysis-agent`
- `deal-diligence/portfolio-fit-agent`
- `deal-diligence/memo-generation-agent`
- `deal-diligence/evaluator-agent`

All tagged `production` and `v1`.

**Standard trace metadata:**
```json
{
  "session_id": "<run_id>",
  "deal_id": "<slugified company name>",
  "agent_name": "<extraction_agent | contradiction_agent | etc>",
  "tags": ["deal-diligence", "sagard-demo"]
}
```

### 5.10 Decision Rationales (Read Before Changing Any Locked Decision)

This section captures the reasoning behind each significant architectural decision. Any AI agent or human considering a change to a locked decision must read the relevant rationale first. Decisions are not religious — but they are deliberate. If you want to change one, bring new information.

**Why local n8n over n8n Cloud:**
- Workflow JSON is version-controllable in the repo, which makes Claude Code a first-class builder (Claude Code cannot operate an n8n Cloud UI, but it can read and write `workflow.json`)
- Codex can review workflow JSON as code — which satisfies the "use Codex as reviewer" pattern Pari signaled
- For a Canadian finance firm, "this ran entirely on my local machine" is a stronger data-residency narrative than "this ran on n8n's multi-tenant cloud"
- Docker-based setup is reproducible and demonstrates engineering discipline; it mirrors how production n8n actually gets deployed at enterprises

**Why Alicloud Qwen over Claude/GPT/Gemini:**
- Will has free Alicloud credits; all other providers require spend
- Qwen3-Max is a strong reasoning model sufficient for specialist agent tasks
- The entire LLM layer is parameterized via a single `Set` node at workflow start — swapping models is a one-variable change
- The production narrative always references Claude via Bedrock, Anthropic direct, or Vertex AI as the data-residency-appropriate path for a real Sagard deployment
- Demo framing: "LLM-agnostic architecture; production would route to whatever aligns with Sagard's data residency requirements"

**Why Supabase over Airtable/Google Sheets/Notion:**
- Real Postgres — queryable, supports row-level security, appropriate for enterprise deployment
- Airtable signals "prototype" rather than "production-ready"
- Free tier is ample for demo (500MB database)
- pgvector upgrade path exists if we want to replace Simple Vector Store later
- SQL queryability matters if Pari asks "how would you query all deals by sector"

**Why Langfuse for observability:**
- Will's cover letter explicitly claimed Langfuse instrumentation across all Dalamula deployments
- Not including Langfuse creates a credibility gap vs. the cover letter
- Free tier (50k observations/month) is sufficient
- Pari's background at Georgian means she specifically understands and values observability in finance AI
- Prompt Management as a feature demonstrates audit trail thinking (versioned prompts with change history)

**Why the specialist framework pattern:**
- "Just wire up an LLM" is what 95% of applicants will do; Pari will pass on those
- Framework-grounded system prompts demonstrate understanding of how institutional investment actually works
- Triangulation, MECE, IC memo taxonomy, institutional LP diligence checklists are the vocabulary of real investment work — using them correctly signals domain fluency
- This is the project's primary intellectual differentiator

**Why deterministic Red Flag Detector (not LLM):**
- Finance AI's killer objection is "how do you know the model didn't hallucinate?"
- The correct answer: "the high-stakes pattern matching is deterministic code, not LLM reasoning"
- Customer concentration threshold checks, material weakness string matching, etc. are exactly the wrong use of LLM capacity
- Having at least one deterministic tool in the agentic system demonstrates architectural judgment

**Why citation enforcement in Memo Generation:**
- In regulated environments, every claim in an investment memo must be traceable to a source
- Without citations, the system is demo-ware; with citations, it's auditable infrastructure
- This is exactly the kind of governance detail Pari will specifically look for

**Why the Evaluator agent (LLM-as-judge):**
- Adds a self-check quality gate before human review
- Pari's Georgian work specifically involved evaluation frameworks for AI systems
- Demonstrates understanding that production AI needs quality gates, not just generation
- Cheap to implement (one extra agent call), high signal

**Why CoreWeave for dev + Cerebras for demo:**
- Same sector (AI infrastructure) reduces prompt variance
- CoreWeave has well-documented issues in public coverage (77% concentration, material weaknesses, debt structure) — makes ground truth easy to verify during development
- Cerebras is current (filed April 17, 2026) — maximum topicality signals the system handles fresh data
- Running the same workflow on an unseen company at demo time proves generalization, not memorization

**Why Claude Code + Codex + Claude Chat three-agent pattern:**
- Pari explicitly named Claude Code and Codex as bonus-point tools
- Demonstrating fluency with multi-agent coding workflows directly aligns with how her team operates
- Claude Chat for strategy, Claude Code for building, Codex for review = the "how modern AI engineers work" signal

---

## 6. Repository Structure

**Note (2026-04-24):** This section was updated when the repo adopted the `multi-agent-collab` framework (v0.3.0). The framework added `.collab/`, `.claude/`, `.codex/`, `docs/agents/`, `docs/STATUS.md`, `docs/project-conventions.md`, `AI_AGENTS.md`, and `AGENTS.md`. The original `.progress-log.md` was superseded by per-agent work logs. Planning docs (`CONTEXT.md`, `DESIGN.md`, `IMPLEMENTATION.md`) remain at root for now — they may be archived via `npx @gpgaoplane/multi-agent-collab archive <path>` once content is fully migrated to framework-native surfaces and the originals go stale.

```
deal-diligence/
├── README.md                          # Project overview, pointer to AGENTS.md/AI_AGENTS.md/CONTEXT.md
├── AGENTS.md                          # Framework entrypoint (any agent reads this first)
├── AI_AGENTS.md                       # Shared contract: onboarding, behavioral rules, routing pointer
├── CONTEXT.md                         # THIS FILE — master scope + locked decisions
├── DESIGN.md                          # Component internals, data contracts, frameworks
├── IMPLEMENTATION.md                  # Phased execution plan with acceptance gates
├── .env.example                       # Template for required environment variables
├── .env                               # Will's local secrets (gitignored, never committed)
├── .gitignore                         # Standard + .env + n8n-data volumes + outputs
├── docker-compose.yml                 # Local n8n stack definition
├── .collab/                           # Framework shared state (owned: shared)
│   ├── VERSION                        # skill version (0.3.0)
│   ├── ACTIVE.md                      # presence board (agents currently running)
│   ├── INDEX.md                       # authoritative file registry (path, type, owner, status, last-updated)
│   ├── ROUTING.md                     # 11-row fan-out matrix
│   ├── PROTOCOL.md                    # End-of-Task Protocol + Receipt format
│   ├── config.yml                     # runtime knobs (strict mode, update channel)
│   ├── agents.d/                      # per-agent descriptors (claude.yml, codex.yml)
│   └── archive/                       # staled / superseded files move here
├── .claude/                           # Claude Code adapter + memory (owned: claude)
│   ├── CLAUDE.md                      # Claude's project adapter / session-start entrypoint
│   └── memory/
│       ├── state.md                   # live work state (branch, active task, watermark)
│       ├── context.md                 # durable project invariants (I-1…I-n)
│       ├── decisions.md               # design decisions (D-1…D-n) + cross-refs to §5.10
│       └── pitfalls.md                # recurring bugs / gotchas / workarounds
├── .codex/                            # Codex adapter + memory (owned: codex)
│   ├── CODEX.md
│   └── memory/
│       ├── state.md
│       ├── context.md
│       ├── decisions.md
│       └── pitfalls.md
├── docs/
│   ├── STATUS.md                      # project-wide phase state (current, done, in-progress, up-next)
│   ├── project-conventions.md         # shared conventions (uncertainty ladder, commit format, prompt checklist, n8n JSON rules)
│   ├── agents/
│   │   ├── claude.md                  # Claude Code work log (append-only, Receipts)
│   │   └── codex.md                   # Codex work log
│   └── plans/                         # dated design/implementation sub-plans (created as needed)
│       └── YYYY-MM-DD-<topic>-{design,implementation}.md
├── prompts/
│   ├── extraction-agent.md
│   ├── contradiction-agent.md
│   ├── gap-analysis-agent.md
│   ├── portfolio-fit-agent.md
│   ├── memo-generation-agent.md
│   └── evaluator-agent.md
├── n8n/
│   ├── workflow.json                  # full workflow export (version-controlled source of truth)
│   ├── sub-workflows/
│   │   └── red-flag-detector.json     # deterministic JS sub-workflow
│   └── n8n-data/                      # local n8n data volume (gitignored)
├── code/
│   ├── red-flag-detector.js           # deterministic pattern matching (no LLM)
│   ├── sagard-portfolio.json          # simulated portfolio for fit analysis
│   └── sec-edgar-downloader.py        # helper for fetching SEC filings
├── schemas/
│   ├── supabase-schema.sql            # database DDL
│   └── agent-output-schemas.json      # JSON schemas enforcing citation etc.
├── scripts/
│   ├── up.sh                          # start local n8n stack
│   ├── down.sh                        # tear down
│   ├── import-workflow.sh             # import workflow.json into local n8n
│   └── export-workflow.sh             # export workflow.json after UI changes
├── test-cases/
│   ├── coreweave/                     # dev case (CoreWeave S-1 + commentary)
│   └── cerebras/                      # demo case (Cerebras S-1 + commentary)
└── outputs/
    ├── coreweave-memo.json
    └── cerebras-memo.json              # submission artifact
```

---

## 7. Local Setup Runbook

### 7.1 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2+
- Node.js 18+ (for any helper scripts)
- Python 3.10+ (for SEC EDGAR downloader)
- Git
- A local port available: `5678` (n8n default)

### 7.2 Required Accounts and API Keys (Before First Run)

- **Alicloud DashScope** — API key for Qwen3-Max (`qwen3-max-2026-01-23`)
- **Supabase** — project URL, anon key, service role key
- **Langfuse Cloud** — public key, secret key, base URL (`https://cloud.langfuse.com` or `https://us.cloud.langfuse.com`)
- **Slack Free workspace** — incoming webhook URL for `#investment-team` channel
- **n8n** — Will chooses a basic auth username + password for the local instance

### 7.3 Environment Variables (`.env` file)

Template in `.env.example`. Claude Code should never commit the actual `.env` — it is in `.gitignore`.

```
# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<set_by_will>
GENERIC_TIMEZONE=America/Toronto

# Alicloud
ALICLOUD_API_KEY=<set_by_will>
ALICLOUD_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
ALICLOUD_MODEL=qwen3-max-2026-01-23
ALICLOUD_EMBEDDING_MODEL=text-embedding-v3

# Supabase
SUPABASE_URL=<set_by_will>
SUPABASE_ANON_KEY=<set_by_will>
SUPABASE_SERVICE_ROLE_KEY=<set_by_will>

# Langfuse
LANGFUSE_PUBLIC_KEY=<set_by_will>
LANGFUSE_SECRET_KEY=<set_by_will>
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Slack
SLACK_WEBHOOK_URL=<set_by_will>
```

### 7.4 docker-compose.yml Structure

The `docker-compose.yml` should define a single n8n service with:
- Port mapping `5678:5678`
- Environment variables loaded from `.env`
- Volume mount for `./n8n/n8n-data:/home/node/.n8n` (persists workflows and credentials)
- Volume mount for `./test-cases:/files` (for document uploads in testing)
- Community node installation via `N8N_COMMUNITY_PACKAGES` environment variable or filesystem mount

**Community nodes to pre-install:**
- `n8n-nodes-openai-langfuse` (for Langfuse tracing)
- `@langfuse/n8n-nodes-langfuse` (for Langfuse prompt management)

### 7.5 First-Time Setup Sequence

1. `cp .env.example .env` → Fill in real values (Will)
2. `./scripts/up.sh` → Start n8n locally
3. Visit `http://localhost:5678`, log in with basic auth credentials
4. Verify community nodes are installed in Settings → Community Nodes
5. `./scripts/import-workflow.sh` → Import `n8n/workflow.json`
6. Create credentials in n8n UI (one-time per credential type) referencing environment variables
7. Test run the workflow with a sample document from `test-cases/coreweave/`

### 7.6 Daily Development Sequence

1. `./scripts/up.sh` → Bring up n8n
2. Work in n8n UI or modify `n8n/workflow.json` directly via Claude Code
3. After UI changes: `./scripts/export-workflow.sh` → Update `workflow.json` in repo
4. Commit changes
5. `./scripts/down.sh` → Tear down when done

---

## 8. How AI Agents Should Operate Against This Project

### 8.1 Claude Code — Primary Builder

**Your role:** Execute the build plan. Write code, generate n8n workflow JSON, maintain the repository. You are the hands-on builder.

**Before doing anything:**
1. Read `AGENTS.md` and `AI_AGENTS.md` — framework entrypoints
2. Read this entire CONTEXT.md file, especially §5 and §5.10
3. Read all files in `prompts/` and `docs/` if they exist
4. Check `docs/STATUS.md` (project phase) and `docs/agents/claude.md` (your own prior work log) to see what's been done
5. Understand the decisions in Section 5 are locked — do not re-debate them without explicit permission from Will; Section 5.10 has the rationales for each
6. If you identify a genuine architectural concern, flag it in a commit message prefixed `ARCHITECTURAL-CONCERN:` and let Will decide

**What you own:**
- `docker-compose.yml`
- `n8n/workflow.json` and sub-workflow JSON files
- Shell scripts in `scripts/`
- Code files in `code/`
- Schema files in `schemas/`
- Prompt files in `prompts/` (first drafts; Claude Chat refines)
- Documentation in `docs/` (except this CONTEXT.md)

**What you do NOT own:**
- CONTEXT.md (maintained by Claude Chat only)
- Final prompt wording (Claude Chat has final sign-off on specialist prompts)
- `.env` (Will maintains; you use `.env.example` only)

**Commit discipline:**
- Small, focused commits
- Commit message format: `[component] action — brief description`
  - Example: `[prompts] add extraction agent system prompt with IC memo taxonomy`
  - Example: `[n8n] wire contradiction agent with vector store tool access`
- Append a dated entry to `docs/agents/claude.md` after each meaningful commit, ending with a Task Receipt per `.collab/PROTOCOL.md`. (Originally this said `.progress-log.md`; superseded by the multi-agent-collab framework on 2026-04-24.)

**When you are uncertain:**
1. Check this CONTEXT.md first
2. Check existing files in the repo
3. Check Langfuse prompt registry if the question is about agent prompts
4. If still unclear, flag the uncertainty in code comments prefixed `// TODO-CLARIFY:` and proceed with your best interpretation; Will will review

**What you should NOT do:**
- Reintroduce rejected options from Section 5.4 without explicit permission
- Change the human-in-the-loop boundary (Section 5.2) — this is fixed
- Add components not in the architecture diagram without flagging first
- Delete or rewrite this CONTEXT.md — only Claude Chat updates the master context
- Commit secrets or `.env` to the repo

### 8.2 Codex — Second-Opinion Reviewer

**Your role:** Review Claude Code's output for correctness. Generate alternative implementations when Will wants to compare approaches. Handle specific components when Will asks for parallel work.

**Before reviewing:**
1. Read this CONTEXT.md in full
2. Read the specific file or PR you are asked to review
3. Cross-reference against the locked decisions in Section 5 and rationales in Section 5.10

**What good review looks like:**
- Catches errors, inconsistencies, or missed edge cases
- Validates against the framework specifications in Section 5.5
- Checks citation enforcement is actually implemented where required
- Verifies deterministic code stays deterministic (Red Flag Detector must not call LLM)
- Flags if specialist frameworks have drifted from their intent
- Reviews workflow JSON for correctness (node wiring, credential references, schema conformance)

**When disagreeing with Claude Code:**
- Present the disagreement as "alternative: consider X because Y"
- Do not silently rewrite — let Will decide between approaches
- If Claude Code's output has a clear bug, fix it and note the fix reason

### 8.3 Claude Chat (Opus) — Strategist

**Will's role orchestration with Claude Chat:**
- Final architectural decisions
- Prompt engineering and framework design
- Demo script and written explanation drafting
- Arbitration when Claude Code and Codex disagree
- Maintains this CONTEXT.md (only Claude Chat updates this master document)

---

## 9. Workflow Execution Semantics

### 9.1 Data Flow Between Agents

Each agent produces structured JSON that the next agent consumes. Schemas are authoritative — agents must return exactly the schema specified.

**Extraction Agent → Contradiction Agent:**
```json
{
  "documents": [
    {
      "source_name": "Cerebras S-1 Filing",
      "source_type": "regulatory_filing",
      "extracted_facts": {
        "company_overview": { ... },
        "financial_performance": { ... },
        "management_claims": [ ... ],
        "risk_factors": [ ... ]
      }
    }
  ]
}
```

**Contradiction Agent → Gap Analysis Agent:**
```json
{
  "contradictions": [
    {
      "claim": "...",
      "sources": ["Source A", "Source B"],
      "nature_of_conflict": "...",
      "severity": "HIGH|MEDIUM|LOW",
      "classification": "DISPUTED|UNSUPPORTED|CORROBORATED|UNCONTRADICTED"
    }
  ],
  "extracted_facts": <pass-through from Extraction>
}
```

**Gap Analysis Agent → Portfolio Fit Agent:**
```json
{
  "missing_information": [
    {
      "category": "financial_diligence|commercial_diligence|operational_diligence|legal_regulatory",
      "item": "...",
      "importance": "HIGH|MEDIUM|LOW",
      "suggested_source": "..."
    }
  ],
  ...
}
```

**Red Flag Detector output (deterministic):**
```json
{
  "red_flags": [
    {
      "flag_type": "customer_concentration_high",
      "severity": "HIGH",
      "evidence": { "actual_value": 86, "threshold": 30, "source": "S-1 Risk Factors" },
      "deterministic": true
    }
  ]
}
```

**Memo Generation Agent output (with citations enforced):**
```json
{
  "executive_summary": "...",
  "recommendation": "pursue|advance_to_deep_diligence|pass",
  "key_risks": [
    {
      "risk": "...",
      "severity": "HIGH|MEDIUM|LOW",
      "sources": ["Document name, page/section"],
      "confidence": 0.0-1.0
    }
  ],
  ...
}
```

**Citation enforcement rule:** Every `risk`, `strength`, and material claim MUST include a `sources` array. If the model cannot cite, it must mark the claim as `UNSUPPORTED` and omit from the memo.

### 9.2 Evaluator Quality Criteria

Each criterion scored 0-10:
1. **Citation completeness** — Does every material claim have a source citation?
2. **Contradiction acknowledgment** — Are upstream contradictions addressed in the memo?
3. **Missing information coverage** — Are upstream gaps reflected as diligence questions?
4. **Red flag propagation** — Are deterministic flags included?
5. **Reasoning coherence** — Does the recommendation follow from evidence?
6. **Hallucination check** — Are there claims not supported by extracted facts? (Flag any)

**Scoring threshold:** Below 35/60 → `flagged_for_review`; 35-50 → `complete`; 50+ → `complete_high_confidence`.

---

## 10. Demo Plan

### 10.1 Demo Video (2-3 minutes)

**Narrative arc:**
1. **[0:00-0:15]** Hook — "An investment associate at Sagard today spends hours triangulating across a deal packet. Let me show what happens when that workflow is re-architected."
2. **[0:15-0:30]** Briefly show `docker-compose up` in terminal, then the n8n interface at `localhost:5678` — reinforces the self-hosted narrative
3. **[0:30-0:50]** Show the Form Trigger, upload Cerebras documents
4. **[0:50-1:45]** Watch the n8n canvas execute — point out the 7 specialist agents, highlight the deterministic red flag detector as a non-LLM component
5. **[1:45-2:30]** Show the output memo in Supabase with citations, contradictions found, red flags surfaced
6. **[2:30-2:50]** Show Langfuse traces — demonstrate audit trail and cost per agent
7. **[2:50-3:00]** Close — "The final decision stays with the investment team. Capital allocation is a fiduciary judgment."

### 10.2 Written Explanation (250 words max)

**Draft framework:**
- Paragraph 1 (80 words): What the human can now do — compress hours of evidence triangulation into minutes, surface issues a manual review might miss
- Paragraph 2 (70 words): What the AI is responsible for — extraction, contradiction detection, gap analysis, red flag detection, memo drafting with citations, quality self-evaluation
- Paragraph 3 (50 words): Where the AI stops — the go/no-go decision remains human because capital allocation carries fiduciary responsibility
- Paragraph 4 (50 words): What breaks at 10x — access control for multi-user deals, audit trail granularity, false positive fatigue, long-context cost scaling

### 10.3 Submission Email Framing

The reply to Pari should briefly note:
- System is local-first (runs in Docker), cloud-optional
- Built using Claude Code as primary builder, Codex as reviewer, Claude Chat for strategy
- Workflow is fully version-controlled in the shared GitHub repo
- Observability, evaluation, and audit trail are first-class concerns

---

## 11. Progress Log

**Superseded on 2026-04-24 by the multi-agent-collab framework.** This section is kept as a strategic milestone journal only — one-line strategic entries (scope shifts, evaluator decisions, phase closeouts), maintained by Claude Chat / Will. Day-to-day working entries live in `docs/agents/<agent>.md` per agent, and project-wide phase state lives in `docs/STATUS.md`.

### 2026-04-23
- **Claude Chat / Will** — Finalized architecture v1, locked decisions, produced initial CONTEXT.md
- **Claude Chat / Will** — Switched from n8n Cloud to local n8n; updated CONTEXT.md to v2 with Docker setup, repo structure, runbook, and decision rationales (Section 5.10)

### 2026-04-24
- **Claude Code / Will** — Adopted `multi-agent-collab` v0.3.0; repo migrated to framework layout with per-agent memory, presence, Receipts, and delta-read. Full migration detail in `docs/agents/claude.md` entry dated 2026-04-24T02:15:00-04:00.

---

## 12. Open Questions / Risks

**Known risks to project completion:**

1. **Langfuse community node quality** — `n8n-nodes-openai-langfuse` is community-maintained; if it fails, fallback is manual HTTP logging to Langfuse via HTTP Request node
2. **Qwen-family token limits / latency** — S-1 filings can be 300+ pages; chunking strategy must handle this (1000 tokens per chunk, retrieval-based approach rather than full-document inclusion)
3. **Local n8n Docker setup friction** — Community node installation via env vars can be fragile; allow extra time for this in Phase 1
4. **Time to record demo** — Budget 2 hours minimum for recording including retakes
5. **SEC EDGAR PDF quality** — If text extraction is poor, may need to supplement with cleaner third-party summaries
6. **Port 5678 conflicts** — If another service uses it, adjust `N8N_PORT` in `.env`

**Open questions to resolve during build:**

1. Should Portfolio Fit agent also pull live public Sagard portfolio data, or rely entirely on pre-loaded JSON? (Default: pre-loaded JSON for prototype speed)
2. Should the Evaluator agent use a different model (stronger) than the specialist agents, or same model with different prompt? (Default: same model, different prompt, for cost parity)
3. Should the demo show both CoreWeave and Cerebras runs, or just Cerebras? (Default: just Cerebras to stay within 3 minutes)
4. For the demo video, record against localhost only, or use ngrok to show a public URL? (Default: localhost, with visible `docker-compose up` to reinforce self-hosted narrative)

---

## 13. Submission Checklist

- [ ] Local n8n stack running via Docker Compose
- [ ] Workflow JSON committed to repo
- [ ] All 6 specialist prompts committed to `prompts/`
- [ ] Red Flag Detector JavaScript committed to `code/`
- [ ] Supabase schema applied, test record written successfully
- [ ] Langfuse traces visible for all agent calls
- [ ] Slack webhook posts successfully
- [ ] n8n workflow tested end-to-end on CoreWeave documents
- [ ] Same workflow tested on Cerebras documents — output quality verified
- [ ] Demo video recorded (2-3 minutes, uploaded to YouTube/Vimeo/Drive)
- [ ] Written explanation drafted and reviewed (≤250 words)
- [ ] GitHub repository populated with all artifacts
- [ ] Email reply to Pari with video link + written explanation + repo link

---

**End of CONTEXT.md**

*This document is maintained by Claude Chat (Opus). Claude Code and Codex should read this document but not modify it. All updates to locked decisions require Will's explicit approval. Section 5.10 (Decision Rationales) is especially important — read it before suggesting any changes to architectural choices.*
