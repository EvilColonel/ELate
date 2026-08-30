-- PrepScope hackathon prototype schema
-- Run this in Supabase SQL Editor, then enable Anonymous Sign-Ins in Auth settings.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  college text not null check (char_length(college) between 1 and 180),
  branch text not null,
  target_company text not null,
  target_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_company_check check (
    target_company in (
      'Amazon','Google','Infosys','TCS','Apple','Wipro','Cognizant',
      'Goldman Sachs','Accenture','Uber'
    )
  ),
  constraint profiles_role_check check (
    target_role in (
      'SDE-1','SDE-1 Intern','SWE 0','SWE Intern','System Engineer',
      'Assistant System Engineer','Software Engineer',
      'Software Engineer — Java / Spring / Spring Boot',
      'Project Engineer — Elite','Project Engineer — Full Stack Java',
      'Project Engineer','GenC Pro — Cybersecurity','GenC Pro','GenC',
      'New Analyst','Analyst','Software Engineer — Analyst',
      'Associate Software Engineer','Advanced Associate Software Engineer',
      'Software Engineer 1'
    )
  )
);

create table if not exists public.skill_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  skill text not null check (char_length(skill) between 1 and 120),
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company, role, skill)
);

create table if not exists public.interview_records (
  id uuid primary key default gen_random_uuid(),
  experience_id text not null check (char_length(experience_id) between 1 and 180),
  candidate_key text not null check (char_length(candidate_key) between 1 and 180),
  submitted_by uuid references auth.users(id) on delete set null,
  company text not null,
  role text not null,
  round text,
  interview_date date,
  interview_year smallint check (interview_year between 2000 and 2100),
  topic text not null check (char_length(topic) between 1 and 120),
  question_count integer not null default 1 check (question_count between 1 and 100),
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  source_type text not null check (source_type in ('historical', 'external', 'user')),
  source_name text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint interview_records_company_check check (
    company in (
      'Amazon','Google','Infosys','TCS','Apple','Wipro','Cognizant',
      'Goldman Sachs','Accenture','Uber'
    )
  ),
  constraint interview_records_role_check check (
    role in (
      'SDE-1','SDE-1 Intern','SWE 0','SWE Intern','System Engineer',
      'Assistant System Engineer','Software Engineer',
      'Software Engineer — Java / Spring / Spring Boot',
      'Project Engineer — Elite','Project Engineer — Full Stack Java',
      'Project Engineer','GenC Pro — Cybersecurity','GenC Pro','GenC',
      'New Analyst','Analyst','Software Engineer — Analyst',
      'Associate Software Engineer','Advanced Associate Software Engineer',
      'Software Engineer 1'
    )
  ),
  constraint interview_record_has_time check (
    interview_date is not null or interview_year is not null
  ),
  constraint external_source_url_consistency check (
    source_type <> 'external' or source_url is not null
  )
);

create index if not exists interview_records_company_role_idx
  on public.interview_records (company, role);

create index if not exists interview_records_topic_idx
  on public.interview_records (topic);

create index if not exists interview_records_company_role_topic_idx
  on public.interview_records (company, role, topic);

create index if not exists interview_records_date_idx
  on public.interview_records (interview_date desc nulls last);

create index if not exists interview_records_experience_idx
  on public.interview_records (experience_id);

create index if not exists interview_records_candidate_idx
  on public.interview_records (candidate_key);

create index if not exists skill_ratings_user_target_idx
  on public.skill_ratings (user_id, company, role);

alter table public.profiles enable row level security;
alter table public.skill_ratings enable row level security;
alter table public.interview_records enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ratings_select_own" on public.skill_ratings;
create policy "ratings_select_own"
  on public.skill_ratings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ratings_insert_own" on public.skill_ratings;
create policy "ratings_insert_own"
  on public.skill_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.skill_ratings;
create policy "ratings_update_own"
  on public.skill_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Analytics records contain no candidate names/emails/phones.
-- Every app visitor is an authenticated anonymous user, so SELECT is granted to authenticated users.
drop policy if exists "interview_records_read_analytics" on public.interview_records;
create policy "interview_records_read_analytics"
  on public.interview_records for select
  to authenticated
  using (true);

-- Student submissions must identify the current anonymous auth user and cannot pretend to be external/historical data.
drop policy if exists "interview_records_insert_own_user_experience" on public.interview_records;
create policy "interview_records_insert_own_user_experience"
  on public.interview_records for insert
  to authenticated
  with check (
    source_type = 'user'
    and submitted_by = auth.uid()
    and candidate_key = auth.uid()::text
    and source_url is null
  );

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.skill_ratings to authenticated;
grant select, insert on public.interview_records to authenticated;
