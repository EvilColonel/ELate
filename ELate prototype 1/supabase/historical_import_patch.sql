-- PrepScope historical-data import patch
-- Run this ONCE in Supabase SQL Editor before importing interview_records_import_ready.csv.
-- This migration is for a project where the original schema.sql has already been run.

begin;

-- Historical records often do not contain a per-topic question count.
-- Do not silently turn unknown counts into 1.
alter table public.interview_records
  alter column question_count drop default;

alter table public.interview_records
  alter column question_count drop not null;

-- The student-facing profile remains restricted to the app's approved target-role list.
-- Historical evidence may contain genuine role names outside that list, so allow those
-- names only in interview_records.
alter table public.interview_records
  drop constraint if exists interview_records_role_check;

commit;
