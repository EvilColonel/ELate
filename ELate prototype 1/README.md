# PrepScope

A hackathon placement-preparation prototype built with React, Vite, Tailwind CSS and Supabase.

## Setup

1. Install Node.js 18+ (Node.js 20 LTS is recommended).
2. Run:
   ```bash
   npm install
   ```
3. Create a Supabase project.
4. Open Supabase **SQL Editor** and run `supabase/schema.sql`.
5. In Supabase Auth settings, enable **Anonymous Sign-Ins**.
6. Copy `.env.example` to `.env`.
7. Put your project values in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```
8. Start the website:
   ```bash
   npm run dev
   ```

## Import the historical CSV

Import into `public.interview_records` from the Supabase Table Editor.

The CSV should use long-form rows: one topic from one interview round per row. Required values are:

- `experience_id` — UUID shared by topic rows from the same interview-round experience
- `candidate_key` — anonymous identifier such as `P001`
- `company`
- `role`
- `topic`
- `question_count`
- `source_type` — `historical`, `external`, or `user`
- at least one of `interview_date` or `interview_year`

Recommended columns also include `round`, `difficulty`, `source_name`, and `source_url`. Leave `submitted_by` empty for administrator-imported historical records. Never invent a source URL.

If your old CSV is one row per candidate with many topic columns, convert it to long form before importing.

## Production build

```bash
npm run build
```

The build output is in `dist/`.

## Secrets

Only the Supabase URL and publishable key belong in the frontend `.env`. Never place a service-role key, database password, or secret key in this project or Git.
