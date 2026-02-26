-- =============================================================
-- Fix Signup Trigger — "Database error saving new user"
-- The handle_new_user() trigger needs to set defaults for ALL
-- columns, including new ones added by migrations.
-- =============================================================

-- Recreate the trigger function with ALL column defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, first_name, last_name, email, role, theme,
    birthday_visible, checkin_streak, total_points
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    '',
    COALESCE(NEW.email, ''),
    'member',
    'light',
    false,
    0,
    0
  );
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Fix user_badges 403 ────────────────────────────────────
-- The badges table may not exist yet or may lack INSERT policy
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'community',
  threshold integer NOT NULL DEFAULT 1
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges viewable by all" ON public.badges;
CREATE POLICY "Badges viewable by all" ON public.badges
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User badges viewable by all" ON public.user_badges;
CREATE POLICY "User badges viewable by all" ON public.user_badges
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;
CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Fix points table policies ──────────────────────────────
-- Make sure auth users can read AND insert points
DROP POLICY IF EXISTS "Anyone can read points" ON public.points;
CREATE POLICY "Anyone can read points" ON public.points
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can earn points" ON public.points;
CREATE POLICY "Auth users can earn points" ON public.points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Ensure default values on profile columns ──────────────
ALTER TABLE public.profiles ALTER COLUMN checkin_streak SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN total_points SET DEFAULT 0;

-- Backfill any NULL values
UPDATE public.profiles SET checkin_streak = 0 WHERE checkin_streak IS NULL;
UPDATE public.profiles SET total_points = 0 WHERE total_points IS NULL;
UPDATE public.profiles SET last_name = '' WHERE last_name IS NULL;
UPDATE public.profiles SET theme = 'light' WHERE theme IS NULL;

SELECT 'Signup trigger fixed!' AS status;
