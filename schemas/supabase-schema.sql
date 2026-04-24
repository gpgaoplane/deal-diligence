-- schemas/supabase-schema.sql
-- ---------------------------------------------------------------------
-- Sagard AI Deal Diligence Workspace — Supabase DDL
-- Source of truth: CONTEXT.md §5.8 + design plan §2.11.
-- Applied via Supabase SQL Editor (implementation plan task 2.13).
-- Idempotent via CREATE ... IF NOT EXISTS.
-- ---------------------------------------------------------------------

-- Enable uuid generation (Supabase default has this, but explicit for portability).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main table: one row per deal evaluation run.
CREATE TABLE IF NOT EXISTS public.deal_memos (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                      UUID NOT NULL,
  deal_id                     TEXT NOT NULL,
  company_name                TEXT NOT NULL,

  -- State machine per design plan §2.11: (new) → in_progress → {complete, complete_high_confidence, flagged_for_review, error}
  status                      TEXT NOT NULL CHECK (status IN (
                                'in_progress',
                                'complete',
                                'complete_high_confidence',
                                'flagged_for_review',
                                'error'
                              )),

  -- Memo content (all nullable; populated by pipeline as agents produce them)
  executive_summary           TEXT,
  recommendation              TEXT CHECK (recommendation IS NULL OR recommendation IN (
                                'pass',
                                'pursue',
                                'advance_to_deep_diligence'
                              )),
  recommendation_rationale    TEXT,

  -- Structured upstream outputs (JSONB for query + audit)
  company_snapshot            JSONB,
  investment_thesis           TEXT,
  key_strengths               JSONB,
  key_risks                   JSONB,
  contradictions              JSONB,
  missing_information         JSONB,
  red_flags                   JSONB,
  portfolio_fit               JSONB,
  open_diligence_questions    JSONB,
  confidence_scores           JSONB,

  -- Evaluator output (design plan §2.11 sub-keys: evaluator_score, criteria_scores,
  -- critical_issues, routing_decision, schema_errors, unresolved_sources)
  evaluator_score             INTEGER CHECK (evaluator_score IS NULL OR (evaluator_score BETWEEN 0 AND 60)),
  evaluator_feedback          JSONB,

  -- Audit trail: authoritative source-document manifest as persisted by the Coordinator.
  -- Shape per design plan §2.11:
  --   [{ source_name, source_type, file_id, filename, bytes, page_count }]
  source_documents            JSONB,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness: one row per (run_id, deal_id). run_id alone is unique in practice
-- (UUID v4 collision negligible); including deal_id as part of the key gives
-- us a clean composite for the status-transition contract.
CREATE UNIQUE INDEX IF NOT EXISTS idx_deal_memos_run_deal
  ON public.deal_memos (run_id, deal_id);

-- Query helpers
CREATE INDEX IF NOT EXISTS idx_deal_memos_deal_id       ON public.deal_memos (deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_memos_status        ON public.deal_memos (status);
CREATE INDEX IF NOT EXISTS idx_deal_memos_created_at    ON public.deal_memos (created_at DESC);

-- Auto-update updated_at on row modification.
CREATE OR REPLACE FUNCTION public.deal_memos_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deal_memos_updated_at ON public.deal_memos;
CREATE TRIGGER trg_deal_memos_updated_at
  BEFORE UPDATE ON public.deal_memos
  FOR EACH ROW
  EXECUTE FUNCTION public.deal_memos_touch_updated_at();

-- Row-level security is left DISABLED for the prototype (single user via
-- service_role). Production would enable RLS and add policies per design
-- plan §8 Extension Point 1.

-- Sanity: insert a dummy row and roll back to verify schema works.
-- (Commented out by default; uncomment to self-test after applying.)
-- BEGIN;
-- INSERT INTO public.deal_memos (run_id, deal_id, company_name, status)
-- VALUES (gen_random_uuid(), 'schema-test', 'Schema Test Corp', 'in_progress');
-- SELECT id, run_id, deal_id, status, created_at FROM public.deal_memos WHERE deal_id = 'schema-test';
-- ROLLBACK;
