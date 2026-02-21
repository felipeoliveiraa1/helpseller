-- Migration: Add raw_analysis JSONB column to call_summaries
ALTER TABLE call_summaries ADD COLUMN IF NOT EXISTS raw_analysis JSONB;
