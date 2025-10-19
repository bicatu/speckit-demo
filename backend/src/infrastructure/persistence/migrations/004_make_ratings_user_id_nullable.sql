-- Migration: Restructure ratings table to support user deletion anonymization (FR-019)
-- This allows ratings to be preserved when a user account is deleted by replacing
-- the composite primary key with a UUID id and making user_id nullable

-- Step 1: Drop the existing primary key constraint
ALTER TABLE ratings DROP CONSTRAINT ratings_pkey;

-- Step 2: Add a UUID id column as the new primary key
ALTER TABLE ratings ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Step 3: Make user_id nullable (it's no longer part of the primary key)
ALTER TABLE ratings ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add a unique constraint to prevent duplicate ratings (nullable user_id allowed)
-- Note: PostgreSQL treats each NULL as distinct, so multiple NULL user_id entries
-- for the same entry_id are allowed, which is correct for anonymized ratings
CREATE UNIQUE INDEX ratings_user_entry_unique ON ratings (user_id, entry_id) WHERE user_id IS NOT NULL;
