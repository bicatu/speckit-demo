-- Migration 005: Add User Approval Status
-- Created: 2025-10-19
-- Purpose: Extend users table with approval workflow fields for new user requests

-- Create enum type for approval status
CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN approval_status user_approval_status NOT NULL DEFAULT 'approved',
  ADD COLUMN approval_requested_at TIMESTAMP,
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN rejected_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMP;

-- Create indexes for efficient querying of pending users
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_approval_requested_at ON users(approval_requested_at);

-- Set existing users to approved status (backward compatibility)
-- Note: We set approved_by to the user's own ID and approved_at to their created_at
-- This ensures the constraint will pass for existing users
UPDATE users 
SET approval_status = 'approved',
    approved_by = id,
    approved_at = created_at 
WHERE approval_status = 'approved' AND approved_by IS NULL;

-- Add check constraint to ensure data consistency
ALTER TABLE users
  ADD CONSTRAINT chk_approval_consistency 
  CHECK (
    (approval_status = 'pending' AND approved_by IS NULL AND rejected_by IS NULL AND approved_at IS NULL)
    OR
    (approval_status = 'approved' AND approved_by IS NOT NULL AND rejected_by IS NULL AND approved_at IS NOT NULL)
    OR
    (approval_status = 'rejected' AND approved_by IS NULL AND rejected_by IS NOT NULL AND approved_at IS NOT NULL)
  );

-- Rollback Instructions (if needed):
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_approval_consistency;
-- DROP INDEX IF EXISTS idx_users_approval_requested_at;
-- DROP INDEX IF EXISTS idx_users_approval_status;
-- ALTER TABLE users DROP COLUMN IF EXISTS approved_at, DROP COLUMN IF EXISTS rejected_by, DROP COLUMN IF EXISTS approved_by, DROP COLUMN IF EXISTS approval_requested_at, DROP COLUMN IF EXISTS approval_status;
-- DROP TYPE IF EXISTS user_approval_status;
