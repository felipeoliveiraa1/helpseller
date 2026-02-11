-- Migration to allow organization_id to be NULL in calls table
-- Date: 2026-02-11
-- Reason: To allow call creation when user profile is missing organization_id or for testing without full org setup

ALTER TABLE calls ALTER COLUMN organization_id DROP NOT NULL;
