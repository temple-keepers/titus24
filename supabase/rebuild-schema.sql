-- =============================================================
-- Titus 2:4 — Rebuild Schema (consolidated, idempotent)
--
-- Applied to project rjgclzvzawsqdlmhemnf ("Titus 2:4 App",
-- us-east-1) on 2026-05-03 via Supabase MCP. Re-running is safe.
--
-- Roles: 'member' | 'elder' | 'admin'
-- Status: 'active' | 'banned' | 'removed'
-- =============================================================

-- ─── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email           text,
  first_name      text,
  last_name       text,
  display_name    text,
  avatar_url      text,
  about           text,
  prayer_focus    text,
  favourite_verse text,
  area            text,
  city            text,
  country         text,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'elder', 'admin')),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned', 'removed')),
  theme           text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  banned_reason   text,
  birthday        date,
  anniversary     date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Posts / Comments / Reactions ────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  image_url  text,
  is_pinned  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts(is_pinned, created_at DESC);

CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

CREATE TABLE IF NOT EXISTS public.reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, type)
);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);

-- ─── Prayer Wall ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       text NOT NULL,
  category      text NOT NULL DEFAULT 'other'
                CHECK (category IN ('health','family','marriage','guidance','praise','other')),
  is_anonymous  boolean NOT NULL DEFAULT false,
  is_answered   boolean NOT NULL DEFAULT false,
  answered_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prayers_created ON public.prayer_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS public.prayer_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id   uuid NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content             text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_req ON public.prayer_responses(prayer_request_id);

-- ─── Events / RSVPs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  date        date NOT NULL,
  time        text,
  timezone    text NOT NULL DEFAULT 'America/Port_of_Spain',
  location    text,
  created_by  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

CREATE TABLE IF NOT EXISTS public.rsvps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('going','maybe','cant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- ─── Daily Devotionals ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_devotionals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date NOT NULL UNIQUE,
  theme           text NOT NULL,
  scripture_text  text NOT NULL,
  scripture_ref   text NOT NULL,
  reflection      text NOT NULL,
  affirmation     text NOT NULL,
  prayer          text NOT NULL,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.devotional_reads (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- ─── Pods (Groups) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  visibility  text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  max_members integer NOT NULL DEFAULT 12,
  created_by  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pod_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id    uuid NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('leader','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pod_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pod_checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id     uuid NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pod_checkins_pod ON public.pod_checkins(pod_id, created_at DESC);

-- ─── Messages / Notifications ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ─── Bible Study ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bible_studies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  cover_url     text,
  duration_days integer NOT NULL DEFAULT 7,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_days (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id        uuid NOT NULL REFERENCES public.bible_studies(id) ON DELETE CASCADE,
  day_number      integer NOT NULL,
  scripture_text  text NOT NULL,
  scripture_ref   text NOT NULL,
  reflection      text NOT NULL,
  journal_prompt  text,
  UNIQUE (study_id, day_number)
);

CREATE TABLE IF NOT EXISTS public.study_progress (
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_day_id uuid NOT NULL REFERENCES public.study_days(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, study_day_id)
);

-- ─── Gallery ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  event_id    uuid REFERENCES public.events(id) ON DELETE SET NULL,
  cover_url   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id    uuid NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  url         text NOT NULL,
  caption     text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Resources ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'General',
  description text,
  url         text NOT NULL,
  cover_url   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Elder Questions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.elder_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question    text NOT NULL,
  category    text NOT NULL DEFAULT 'General',
  is_answered boolean NOT NULL DEFAULT false,
  answer      text,
  answered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  answered_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Prayer Partnerships ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_partnerships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end   date NOT NULL DEFAULT (CURRENT_DATE + interval '7 days'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a_id <> user_b_id)
);

-- ─── Guide Sections ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guide_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  icon          text NOT NULL DEFAULT 'BookOpen',
  description   text,
  content       text NOT NULL,
  category      text NOT NULL DEFAULT 'features'
                CHECK (category IN ('getting_started','features','faq')),
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Daily Check-ins / Points ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      text NOT NULL,
  points      integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_user ON public.points(user_id);

-- =============================================================
-- RLS helpers
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','elder')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_leader() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_leader() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================
-- Policies (see migration rebuild_02_rls_and_policies for full set)
-- This file lists them concisely as the live state.
-- =============================================================

-- All policies: see Supabase dashboard for the canonical list.
-- Pattern summary:
--   profiles            : read all auth, update self, admin ALL
--   posts/comments      : read all auth, write self, admin override
--   reactions           : read all auth, write self
--   prayer_requests     : read all auth, write self/admin
--   prayer_responses    : read all auth, insert self
--   events              : read all auth, write leader (admin/elder)
--   rsvps               : read all auth, write self
--   daily_devotionals   : read all auth, write leader
--   devotional_reads    : self only
--   pods                : read all auth, write leader
--   pod_members         : read all auth, join self, leave self/admin
--   pod_checkins        : read all auth, insert self
--   messages            : read sender or receiver, send as self, mark-read receiver
--   notifications       : read own, mark-read own, system insert any
--   bible_studies/days  : read all auth, write leader
--   study_progress      : self only
--   gallery_*           : read all auth, write leader / self upload
--   resources           : read all auth, write leader
--   elder_questions     : read own/leader, ask self, answer leader
--   prayer_partnerships : read participants/leader, write admin
--   guide_sections      : read all auth, write leader
--   daily_checkins      : self only
--   points              : read all auth, insert self

-- =============================================================
-- Auto-create profile on signup
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  fn text := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
BEGIN
  INSERT INTO public.profiles (id, email, first_name, display_name, role, status, theme)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(fn, ''),
    NULLIF(fn, ''),
    'member',
    'active',
    'light'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- handle_new_user is trigger-only — never callable via REST.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- =============================================================
-- Storage buckets + policies
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',     'avatars',     true),
  ('gallery',     'gallery',     true),
  ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated update own avatars" ON storage.objects;
CREATE POLICY "Authenticated update own avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());

DROP POLICY IF EXISTS "Authenticated upload post images" ON storage.objects;
CREATE POLICY "Authenticated upload post images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Authenticated upload gallery" ON storage.objects;
CREATE POLICY "Authenticated upload gallery" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');

-- =============================================================
-- Realtime
-- =============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_responses;
