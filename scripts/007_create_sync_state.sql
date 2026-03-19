-- Sync state table for tracking HubSpot polling timestamps
create table if not exists sync_state (
  id text primary key,
  last_polled_at timestamptz not null default now(),
  last_record_id text,
  metadata jsonb default '{}',
  updated_at timestamptz default now()
);

-- Insert initial state for HubSpot deals and contacts
insert into sync_state (id, last_polled_at) 
values 
  ('hubspot_deals', '2024-01-01T00:00:00Z'),
  ('hubspot_contacts', '2024-01-01T00:00:00Z')
on conflict (id) do nothing;
