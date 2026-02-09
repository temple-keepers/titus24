-- =============================================================
-- Titus 2:4 Company — Safe Column Migration
-- Run this AFTER the main schema.sql to add any columns that
-- might be missing from existing tables.
-- =============================================================

-- ─── profiles: add missing columns ──────────────────────────
DO $$
BEGIN
  -- birthday_visible
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='birthday_visible') THEN
    ALTER TABLE public.profiles ADD COLUMN birthday_visible boolean DEFAULT false;
  END IF;

  -- theme
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='theme') THEN
    ALTER TABLE public.profiles ADD COLUMN theme text DEFAULT 'dark';
  END IF;

  -- digest_day
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_day') THEN
    ALTER TABLE public.profiles ADD COLUMN digest_day text;
  END IF;

  -- digest_time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_time') THEN
    ALTER TABLE public.profiles ADD COLUMN digest_time text;
  END IF;

  -- digest_timezone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_timezone') THEN
    ALTER TABLE public.profiles ADD COLUMN digest_timezone text;
  END IF;

  -- last_attended
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_attended') THEN
    ALTER TABLE public.profiles ADD COLUMN last_attended date;
  END IF;

  -- last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text DEFAULT '';
  END IF;

  -- about
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='about') THEN
    ALTER TABLE public.profiles ADD COLUMN about text;
  END IF;

  -- prayer_focus
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='prayer_focus') THEN
    ALTER TABLE public.profiles ADD COLUMN prayer_focus text;
  END IF;

  -- birthday
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='birthday') THEN
    ALTER TABLE public.profiles ADD COLUMN birthday date;
  END IF;

  -- area
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='area') THEN
    ALTER TABLE public.profiles ADD COLUMN area text;
  END IF;

  -- photo_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='photo_url') THEN
    ALTER TABLE public.profiles ADD COLUMN photo_url text;
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ─── posts: add missing columns ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='is_pinned') THEN
    ALTER TABLE public.posts ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='image_url') THEN
    ALTER TABLE public.posts ADD COLUMN image_url text;
  END IF;
END $$;

-- ─── prayer_requests: add missing columns ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='answered_at') THEN
    ALTER TABLE public.prayer_requests ADD COLUMN answered_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='category') THEN
    ALTER TABLE public.prayer_requests ADD COLUMN category text DEFAULT 'General';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='is_anonymous') THEN
    ALTER TABLE public.prayer_requests ADD COLUMN is_anonymous boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='is_answered') THEN
    ALTER TABLE public.prayer_requests ADD COLUMN is_answered boolean DEFAULT false;
  END IF;
END $$;

-- ─── events: add missing columns ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='what_to_bring') THEN
    ALTER TABLE public.events ADD COLUMN what_to_bring text;
  END IF;
END $$;

-- ─── resources: add missing columns ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='why_it_matters') THEN
    ALTER TABLE public.resources ADD COLUMN why_it_matters text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='next_step') THEN
    ALTER TABLE public.resources ADD COLUMN next_step text;
  END IF;
END $$;

-- ─── gallery_albums: add missing columns ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_albums' AND column_name='event_id') THEN
    ALTER TABLE public.gallery_albums ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Done! All missing columns have been added safely.
SELECT 'Migration complete — all columns verified.' AS status;
