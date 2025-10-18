-- Migration: Make creator_id nullable in entries table for user deletion anonymization (FR-019)
-- This allows entries to be preserved when a user account is deleted

-- Make creator_id nullable
ALTER TABLE entries ALTER COLUMN creator_id DROP NOT NULL;

-- Update foreign key constraint to SET NULL on user deletion
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_creator_id_fkey;
ALTER TABLE entries ADD CONSTRAINT entries_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL;
