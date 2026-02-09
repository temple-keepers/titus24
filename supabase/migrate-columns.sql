-- =============================================================
-- Titus 2:4 Company — Comprehensive Column Migration
-- Adds ALL missing columns to ALL tables safely.
-- Run this in Supabase SQL Editor.
-- =============================================================

-- ─── profiles ───────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_name') THEN ALTER TABLE public.profiles ADD COLUMN last_name text DEFAULT ''; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN ALTER TABLE public.profiles ADD COLUMN email text DEFAULT ''; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='photo_url') THEN ALTER TABLE public.profiles ADD COLUMN photo_url text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='area') THEN ALTER TABLE public.profiles ADD COLUMN area text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='about') THEN ALTER TABLE public.profiles ADD COLUMN about text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='prayer_focus') THEN ALTER TABLE public.profiles ADD COLUMN prayer_focus text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='birthday') THEN ALTER TABLE public.profiles ADD COLUMN birthday date; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='birthday_visible') THEN ALTER TABLE public.profiles ADD COLUMN birthday_visible boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='theme') THEN ALTER TABLE public.profiles ADD COLUMN theme text DEFAULT 'light'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_day') THEN ALTER TABLE public.profiles ADD COLUMN digest_day text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_time') THEN ALTER TABLE public.profiles ADD COLUMN digest_time text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='digest_timezone') THEN ALTER TABLE public.profiles ADD COLUMN digest_timezone text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_attended') THEN ALTER TABLE public.profiles ADD COLUMN last_attended date; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── posts ──────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='image_url') THEN ALTER TABLE public.posts ADD COLUMN image_url text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='is_pinned') THEN ALTER TABLE public.posts ADD COLUMN is_pinned boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='created_at') THEN ALTER TABLE public.posts ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── comments ───────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='parent_id') THEN ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='created_at') THEN ALTER TABLE public.comments ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── reactions ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reactions' AND column_name='created_at') THEN ALTER TABLE public.reactions ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── prayer_requests ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='category') THEN ALTER TABLE public.prayer_requests ADD COLUMN category text DEFAULT 'General'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='is_anonymous') THEN ALTER TABLE public.prayer_requests ADD COLUMN is_anonymous boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='is_answered') THEN ALTER TABLE public.prayer_requests ADD COLUMN is_answered boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='answered_at') THEN ALTER TABLE public.prayer_requests ADD COLUMN answered_at timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_requests' AND column_name='created_at') THEN ALTER TABLE public.prayer_requests ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── prayer_responses ───────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_responses' AND column_name='content') THEN ALTER TABLE public.prayer_responses ADD COLUMN content text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prayer_responses' AND column_name='created_at') THEN ALTER TABLE public.prayer_responses ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── events ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='what_to_bring') THEN ALTER TABLE public.events ADD COLUMN what_to_bring text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='created_at') THEN ALTER TABLE public.events ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── rsvps ──────────────────────────────────────────────────
-- rsvps typically don't need created_at but check for status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rsvps' AND column_name='status') THEN ALTER TABLE public.rsvps ADD COLUMN status text DEFAULT 'coming'; END IF;
END $$;

-- ─── event_reminders ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_reminders' AND column_name='remind_offset_hours') THEN ALTER TABLE public.event_reminders ADD COLUMN remind_offset_hours integer DEFAULT 24; END IF;
END $$;

-- ─── attendance ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attendance' AND column_name='date') THEN ALTER TABLE public.attendance ADD COLUMN date date DEFAULT CURRENT_DATE; END IF;
END $$;

-- ─── bible_studies ──────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bible_studies' AND column_name='cover_image') THEN ALTER TABLE public.bible_studies ADD COLUMN cover_image text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bible_studies' AND column_name='total_days') THEN ALTER TABLE public.bible_studies ADD COLUMN total_days integer DEFAULT 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bible_studies' AND column_name='start_date') THEN ALTER TABLE public.bible_studies ADD COLUMN start_date date; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bible_studies' AND column_name='created_at') THEN ALTER TABLE public.bible_studies ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── study_days ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_days' AND column_name='scripture_text') THEN ALTER TABLE public.study_days ADD COLUMN scripture_text text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_days' AND column_name='reflection_prompt') THEN ALTER TABLE public.study_days ADD COLUMN reflection_prompt text DEFAULT ''; END IF;
END $$;

-- ─── study_enrollments ──────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_enrollments' AND column_name='enrolled_at') THEN ALTER TABLE public.study_enrollments ADD COLUMN enrolled_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── study_progress ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_progress' AND column_name='reflection') THEN ALTER TABLE public.study_progress ADD COLUMN reflection text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_progress' AND column_name='completed_at') THEN ALTER TABLE public.study_progress ADD COLUMN completed_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── gallery_albums ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_albums' AND column_name='description') THEN ALTER TABLE public.gallery_albums ADD COLUMN description text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_albums' AND column_name='event_id') THEN ALTER TABLE public.gallery_albums ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_albums' AND column_name='created_at') THEN ALTER TABLE public.gallery_albums ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── gallery_photos ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_photos' AND column_name='caption') THEN ALTER TABLE public.gallery_photos ADD COLUMN caption text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gallery_photos' AND column_name='created_at') THEN ALTER TABLE public.gallery_photos ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── messages ───────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='created_at') THEN ALTER TABLE public.messages ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── resources ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='thumbnail') THEN ALTER TABLE public.resources ADD COLUMN thumbnail text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='description') THEN ALTER TABLE public.resources ADD COLUMN description text DEFAULT ''; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='why_it_matters') THEN ALTER TABLE public.resources ADD COLUMN why_it_matters text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='next_step') THEN ALTER TABLE public.resources ADD COLUMN next_step text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='resources' AND column_name='created_at') THEN ALTER TABLE public.resources ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── notifications ──────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='link') THEN ALTER TABLE public.notifications ADD COLUMN link text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='is_read') THEN ALTER TABLE public.notifications ADD COLUMN is_read boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='created_at') THEN ALTER TABLE public.notifications ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── badges ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='badges' AND column_name='category') THEN ALTER TABLE public.badges ADD COLUMN category text DEFAULT 'milestones'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='badges' AND column_name='threshold') THEN ALTER TABLE public.badges ADD COLUMN threshold integer DEFAULT 1; END IF;
END $$;

-- ─── user_badges ────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_badges' AND column_name='earned_at') THEN ALTER TABLE public.user_badges ADD COLUMN earned_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── follow_up_notes ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follow_up_notes' AND column_name='status') THEN ALTER TABLE public.follow_up_notes ADD COLUMN status text DEFAULT 'Texted'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follow_up_notes' AND column_name='created_at') THEN ALTER TABLE public.follow_up_notes ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
END $$;

-- ─── Backfill existing rows that have NULL created_at ───────
-- This sets created_at for any existing rows that were inserted before the column existed
UPDATE public.posts SET created_at = now() WHERE created_at IS NULL;
UPDATE public.comments SET created_at = now() WHERE created_at IS NULL;
UPDATE public.reactions SET created_at = now() WHERE created_at IS NULL;
UPDATE public.prayer_requests SET created_at = now() WHERE created_at IS NULL;
UPDATE public.prayer_responses SET created_at = now() WHERE created_at IS NULL;
UPDATE public.events SET created_at = now() WHERE created_at IS NULL;
UPDATE public.bible_studies SET created_at = now() WHERE created_at IS NULL;
UPDATE public.gallery_albums SET created_at = now() WHERE created_at IS NULL;
UPDATE public.gallery_photos SET created_at = now() WHERE created_at IS NULL;
UPDATE public.messages SET created_at = now() WHERE created_at IS NULL;
UPDATE public.resources SET created_at = now() WHERE created_at IS NULL;
UPDATE public.notifications SET created_at = now() WHERE created_at IS NULL;
UPDATE public.user_badges SET earned_at = now() WHERE earned_at IS NULL;
UPDATE public.follow_up_notes SET created_at = now() WHERE created_at IS NULL;
UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;

SELECT 'Migration complete - all columns added and backfilled.' AS status;
