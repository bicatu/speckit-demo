-- Make platform_id nullable in entries table per User Story 3 requirement
-- Spec: "I optionally specify a streaming platform"

ALTER TABLE entries 
  ALTER COLUMN platform_id DROP NOT NULL;
