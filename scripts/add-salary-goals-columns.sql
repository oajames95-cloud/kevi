-- Add salary field to reps for ROI calculations
alter table reps add column if not exists annual_salary_gbp int default 0;

-- Add paste_count and page_title to activity_events (from extension update)
alter table activity_events add column if not exists paste_count int default 0;
alter table activity_events add column if not exists page_title text;
alter table activity_events add column if not exists navigation_type text;

-- Add new fields to rep_status (from extension update)
alter table rep_status add column if not exists page_title text;
alter table rep_status add column if not exists tab_count int default 1;
alter table rep_status add column if not exists paste_count_last_min int default 0;
alter table rep_status add column if not exists navigation_type text;

-- Add goals to companies table
alter table companies add column if not exists goals jsonb default '{
  "activeHoursPerDay": 6,
  "prospectingPct": 35,
  "minFocusBlockMins": 30,
  "keystrokeIntensityPerHour": 600,
  "workingDaysPerMonth": 22
}';
