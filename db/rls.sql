-- Row Level Security setup for Supabase.
-- Run this in the Supabase SQL editor AFTER applying the Drizzle migrations.
--
-- The app is a single-user workspace. Server-side code connects through
-- DATABASE_URL (postgres role, bypasses RLS) and enforces auth in middleware.
-- These policies lock the tables down for any access through the Supabase
-- anon/authenticated API keys, so exposed keys can't read your pipeline.

alter table companies enable row level security;
alter table contacts enable row level security;
alter table timeline_events enable row level security;
alter table messages enable row level security;
alter table follow_ups enable row level security;
alter table automations enable row level security;
alter table automation_runs enable row level security;
alter table settings enable row level security;

-- Authenticated users (the workspace owner) get full access via the API.
-- Anonymous users get nothing.
do $$
declare t text;
begin
  foreach t in array array[
    'companies','contacts','timeline_events','messages',
    'follow_ups','automations','automation_runs','settings'
  ] loop
    execute format(
      'create policy "authenticated full access" on %I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end $$;
