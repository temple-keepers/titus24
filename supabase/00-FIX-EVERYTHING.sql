-- =============================================================
-- ALL-IN-ONE FIX SCRIPT
-- Fixes: Resources not showing + Points not working
-- Run this ONE script instead of multiple files
-- =============================================================

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Fix Resources Table Structure
-- ═══════════════════════════════════════════════════════════

-- Add missing created_by column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added created_by column to resources';
  END IF;
END $$;

-- Add missing created_at column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Added created_at column to resources';
  END IF;
END $$;

-- Make thumbnail nullable (it should be optional)
DO $$ BEGIN
  -- Check if thumbnail column is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources'
    AND column_name = 'thumbnail'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.resources ALTER COLUMN thumbnail DROP NOT NULL;
    RAISE NOTICE '✅ Made thumbnail column nullable';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Fix Resources RLS Policies
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
CREATE POLICY "Anyone can read resources"
ON public.resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leaders can create resources" ON public.resources;
CREATE POLICY "Leaders can create resources"
ON public.resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update resources" ON public.resources;
CREATE POLICY "Leaders can update resources"
ON public.resources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete resources" ON public.resources;
CREATE POLICY "Leaders can delete resources"
ON public.resources FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

DO $$ BEGIN
  RAISE NOTICE '✅ Resources RLS policies fixed';
END $$;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Create Points System Function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_action text,
  p_points integer,
  p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert point entry
  INSERT INTO public.points (user_id, action, points, description)
  VALUES (p_user_id, p_action, p_points, p_description);

  -- Atomically update total_points
  UPDATE public.profiles
  SET total_points = COALESCE(total_points, 0) + p_points
  WHERE id = p_user_id;

  RAISE NOTICE 'Awarded % points to user %', p_points, p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points TO anon;

DO $$ BEGIN
  RAISE NOTICE '✅ award_points function created';
END $$;

-- ═══════════════════════════════════════════════════════════
-- STEP 4: Create Devotional Reads Table (rate limiting)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.devotional_reads (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.devotional_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own devotional reads" ON public.devotional_reads;
CREATE POLICY "Users can read own devotional reads" ON public.devotional_reads
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devotional reads" ON public.devotional_reads;
CREATE POLICY "Users can insert own devotional reads" ON public.devotional_reads
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_devotional_reads_user_date ON public.devotional_reads(user_id, date);

DO $$ BEGIN
  RAISE NOTICE '✅ devotional_reads table created';
END $$;

-- ═══════════════════════════════════════════════════════════
-- STEP 5: Add Test Resources (if none exist)
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  leader_id uuid;
  resource_count integer;
BEGIN
  -- Count existing resources
  SELECT COUNT(*) INTO resource_count FROM resources;

  IF resource_count = 0 THEN
    -- Find a leader or any user
    SELECT id INTO leader_id FROM profiles WHERE role = 'leader' LIMIT 1;
    IF leader_id IS NULL THEN
      SELECT id INTO leader_id FROM profiles LIMIT 1;
    END IF;

    IF leader_id IS NOT NULL THEN
      INSERT INTO resources (title, category, type, description, why_it_matters, next_step, link, created_by)
      VALUES
      (
        'Understanding Biblical Womanhood',
        'Teaching',
        'article',
        'A deep dive into what it means to be a godly woman according to Titus 2:3-5',
        'This teaching helps you understand your identity and calling as a woman of God.',
        'Read the article and journal about one principle that resonated with you.',
        'https://www.desiringgod.org/articles/what-is-biblical-womanhood',
        leader_id
      ),
      (
        'Prayer That Moves Mountains',
        'Guide',
        'video',
        'Practical guide on developing a powerful prayer life that sees breakthrough',
        'Prayer is the foundation of a vibrant relationship with God and seeing His power manifest.',
        'Commit to 10 minutes of focused prayer daily this week.',
        'https://www.youtube.com/watch?v=example',
        leader_id
      ),
      (
        'You Are Loved - Daily Affirmations',
        'Inspiration',
        'article',
        'Daily reminders of God''s unconditional love for you and your worth in Christ',
        'Knowing your identity in Christ transforms how you see yourself and live each day.',
        'Choose one affirmation to memorize and declare over yourself this week.',
        'https://www.crosswalk.com/faith/spiritual-life/10-things-god-wants-you-to-know.html',
        leader_id
      );

      RAISE NOTICE '✅ Added 3 test resources';
    ELSE
      RAISE NOTICE '⚠️ No users found to assign as resource creator';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Resources already exist (count: %), skipping test data', resource_count;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- FINAL: Show Results
-- ═══════════════════════════════════════════════════════════

-- Show resources
SELECT '=== RESOURCES ===' as section;
SELECT id, title, category, type, created_at
FROM resources
ORDER BY created_at DESC
LIMIT 5;

-- Show points function status
SELECT '=== POINTS FUNCTION ===' as section;
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_points')
  THEN '✅ award_points function EXISTS'
  ELSE '❌ award_points function MISSING'
  END as status;

-- Show devotional_reads table status
SELECT '=== DEVOTIONAL READS TABLE ===' as section;
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devotional_reads')
  THEN '✅ devotional_reads table EXISTS'
  ELSE '❌ devotional_reads table MISSING'
  END as status;

-- Final summary
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as "🎉 STATUS";
SELECT 'Refresh your app and try:' as "📋 NEXT STEPS"
UNION ALL SELECT '1. Go to Resources → Should see 3 test articles'
UNION ALL SELECT '2. Go to Daily Devotional → Check in → Should get +5 points'
UNION ALL SELECT '3. Go to Leaderboard → Should see your points';
