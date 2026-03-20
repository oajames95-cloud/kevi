-- Add hubspot_owner_id column to reps table for matching HubSpot owners to reps
alter table reps add column if not exists hubspot_owner_id text;

-- Add index for efficient lookups
create index if not exists idx_reps_hubspot_owner_id on reps(hubspot_owner_id);
