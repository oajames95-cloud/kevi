-- Kevi.io Database Schema
-- Sales Intelligence Platform

-- Companies table
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Reps table (sales representatives)
create table if not exists reps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text not null,
  extension_token text unique not null default gen_random_uuid()::text,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

-- Activity events from Chrome extension
create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references reps(id) on delete cascade,
  domain text not null,
  category text not null default 'other',
  focus_seconds int not null default 0,
  keystrokes int not null default 0,
  recorded_at timestamptz not null,
  created_at timestamptz default now()
);

-- CRM events from webhooks (HubSpot, Salesforce)
create table if not exists crm_events (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references reps(id) on delete cascade,
  source text not null,
  event_type text not null,
  deal_value numeric default 0,
  deal_stage text,
  payload jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz default now()
);

-- Daily summaries for trend queries (populated by cron job)
create table if not exists daily_summaries (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references reps(id) on delete cascade,
  date date not null,
  total_active_seconds int default 0,
  total_keystrokes int default 0,
  by_category jsonb default '{}',
  by_domain jsonb default '{}',
  meetings_booked int default 0,
  deals_created int default 0,
  pipeline_value numeric default 0,
  unique(rep_id, date)
);

-- Indexes for performance
create index if not exists idx_activity_events_rep_recorded on activity_events(rep_id, recorded_at);
create index if not exists idx_crm_events_rep_occurred on crm_events(rep_id, occurred_at);
create index if not exists idx_daily_summaries_rep_date on daily_summaries(rep_id, date);
create index if not exists idx_reps_company on reps(company_id);
create index if not exists idx_reps_extension_token on reps(extension_token);

-- Enable Row Level Security
alter table companies enable row level security;
alter table reps enable row level security;
alter table activity_events enable row level security;
alter table crm_events enable row level security;
alter table daily_summaries enable row level security;

-- RLS Policies for company isolation
-- Companies: users can only see their own company
create policy "companies_select_own" on companies for select
  using (id in (
    select company_id from reps where email = (select auth.jwt() ->> 'email')
  ));

-- Reps: company isolation
create policy "reps_select_company" on reps for select
  using (company_id in (
    select company_id from reps where email = (select auth.jwt() ->> 'email')
  ));

create policy "reps_insert_company" on reps for insert
  with check (company_id in (
    select company_id from reps where email = (select auth.jwt() ->> 'email')
  ));

create policy "reps_update_company" on reps for update
  using (company_id in (
    select company_id from reps where email = (select auth.jwt() ->> 'email')
  ));

create policy "reps_delete_company" on reps for delete
  using (company_id in (
    select company_id from reps where email = (select auth.jwt() ->> 'email')
  ));

-- Activity events: company isolation via rep
create policy "activity_events_select_company" on activity_events for select
  using (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));

create policy "activity_events_insert_company" on activity_events for insert
  with check (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));

-- CRM events: company isolation via rep
create policy "crm_events_select_company" on crm_events for select
  using (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));

create policy "crm_events_insert_company" on crm_events for insert
  with check (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));

-- Daily summaries: company isolation via rep
create policy "daily_summaries_select_company" on daily_summaries for select
  using (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));

create policy "daily_summaries_insert_company" on daily_summaries for insert
  with check (rep_id in (
    select id from reps where company_id in (
      select company_id from reps where email = (select auth.jwt() ->> 'email')
    )
  ));
