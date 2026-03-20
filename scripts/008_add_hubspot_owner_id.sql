-- Add hubspot_owner_id column to reps table for matching HubSpot owners to reps
ALTER TABLE reps ADD COLUMN IF NOT EXISTS hubspot_owner_id TEXT;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_reps_hubspot_owner_id ON reps(hubspot_owner_id);
