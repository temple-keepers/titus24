-- =============================================================
-- Titus 2:4 — New Features Migration
-- Daily Devotionals, Check-Ins, Prayer Partners, Testimonies,
-- Ask the Elders, Points & Leaderboard
-- =============================================================

-- ─── Daily Devotionals ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  theme text NOT NULL,
  scripture_ref text NOT NULL,
  scripture_text text NOT NULL,
  reflection text NOT NULL,
  affirmation text NOT NULL,
  prayer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read devotionals" ON public.daily_devotionals;
CREATE POLICY "Anyone can read devotionals" ON public.daily_devotionals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Leaders can insert devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can insert devotionals" ON public.daily_devotionals FOR INSERT WITH CHECK (true);

-- ─── Daily Check-Ins ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  gratitude text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own checkins" ON public.daily_checkins;
CREATE POLICY "Users can read own checkins" ON public.daily_checkins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.daily_checkins;
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own checkins" ON public.daily_checkins;
CREATE POLICY "Users can update own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);

-- ─── Prayer Partnerships ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_b_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + interval '7 days'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prayer_partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own partnerships" ON public.prayer_partnerships;
CREATE POLICY "Users can read own partnerships" ON public.prayer_partnerships FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Leaders can manage partnerships" ON public.prayer_partnerships;
CREATE POLICY "Leaders can manage partnerships" ON public.prayer_partnerships FOR ALL USING (true);

-- ─── Testimonies ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  is_anonymous boolean DEFAULT false,
  celebration_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read testimonies" ON public.testimonies;
CREATE POLICY "Anyone can read testimonies" ON public.testimonies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can create testimonies" ON public.testimonies;
CREATE POLICY "Auth users can create testimonies" ON public.testimonies FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete own testimonies" ON public.testimonies;
CREATE POLICY "Users can delete own testimonies" ON public.testimonies FOR DELETE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Anyone can update testimonies" ON public.testimonies;
CREATE POLICY "Anyone can update testimonies" ON public.testimonies FOR UPDATE USING (true);

-- ─── Testimony Celebrations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimony_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id uuid REFERENCES public.testimonies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(testimony_id, user_id)
);

ALTER TABLE public.testimony_celebrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read celebrations" ON public.testimony_celebrations;
CREATE POLICY "Anyone can read celebrations" ON public.testimony_celebrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can celebrate" ON public.testimony_celebrations;
CREATE POLICY "Auth users can celebrate" ON public.testimony_celebrations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can uncelebrate" ON public.testimony_celebrations;
CREATE POLICY "Users can uncelebrate" ON public.testimony_celebrations FOR DELETE USING (auth.uid() = user_id);

-- ─── Elder Questions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.elder_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  is_answered boolean DEFAULT false,
  answer text,
  answered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.elder_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read questions" ON public.elder_questions;
CREATE POLICY "Anyone can read questions" ON public.elder_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can ask questions" ON public.elder_questions;
CREATE POLICY "Auth users can ask questions" ON public.elder_questions FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Leaders can answer questions" ON public.elder_questions;
CREATE POLICY "Leaders can answer questions" ON public.elder_questions FOR UPDATE USING (true);

-- ─── Points ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read points" ON public.points;
CREATE POLICY "Anyone can read points" ON public.points FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can earn points" ON public.points;
CREATE POLICY "Auth users can earn points" ON public.points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Add streak columns to profiles ─────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='checkin_streak') THEN ALTER TABLE public.profiles ADD COLUMN checkin_streak integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='total_points') THEN ALTER TABLE public.profiles ADD COLUMN total_points integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_checkin_date') THEN ALTER TABLE public.profiles ADD COLUMN last_checkin_date date; END IF;
END $$;

-- ─── Realtime for new tables ────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_devotionals;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.elder_questions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.points;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT 'New features migration complete!' AS status;
