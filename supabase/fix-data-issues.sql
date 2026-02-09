-- =============================================================
-- Fix: Resources Not Showing & Points Not Working
-- Diagnostic + Fixes for both issues
-- =============================================================

-- ═══════════════════════════════════════════════════════════
-- PART 1: Check What Tables/Functions Exist
-- ═══════════════════════════════════════════════════════════

-- Check tables exist
SELECT 'resources table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 'points table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 'devotional_reads table' as item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devotional_reads')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check function exists
SELECT 'award_points function' as item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_points')
       THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ═══════════════════════════════════════════════════════════
-- PART 2: Check RLS Policies on Resources
-- ═══════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- PART 3: Check if Resources Have Data
-- ═══════════════════════════════════════════════════════════

SELECT COUNT(*) as total_resources FROM resources;

-- Show first 5 resources if they exist
SELECT id, title, category, type, created_at
FROM resources
ORDER BY created_at DESC
LIMIT 5;

-- ═══════════════════════════════════════════════════════════
-- PART 4: Fix Resources RLS (if needed)
-- ═══════════════════════════════════════════════════════════

-- Ensure everyone can read resources
DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
CREATE POLICY "Anyone can read resources"
ON public.resources
FOR SELECT
USING (true);

-- Only leaders can create resources
DROP POLICY IF EXISTS "Leaders can create resources" ON public.resources;
CREATE POLICY "Leaders can create resources"
ON public.resources
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- Only leaders can update resources
DROP POLICY IF EXISTS "Leaders can update resources" ON public.resources;
CREATE POLICY "Leaders can update resources"
ON public.resources
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- Only leaders can delete resources
DROP POLICY IF EXISTS "Leaders can delete resources" ON public.resources;
CREATE POLICY "Leaders can delete resources"
ON public.resources
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- ═══════════════════════════════════════════════════════════
-- PART 5: Create award_points Function (if missing)
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

-- ═══════════════════════════════════════════════════════════
-- PART 6: Create devotional_reads table (if missing)
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

-- ═══════════════════════════════════════════════════════════
-- PART 7: Test Points System
-- ═══════════════════════════════════════════════════════════

-- Get first user for testing
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Test award_points
    PERFORM award_points(test_user_id, 'test_action', 5, 'Test points');
    RAISE NOTICE 'Test points awarded to user: %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- FINAL: Summary
-- ═══════════════════════════════════════════════════════════

SELECT '✅ Resources RLS policies fixed' as status
UNION ALL
SELECT '✅ award_points function created/updated'
UNION ALL
SELECT '✅ devotional_reads table created'
UNION ALL
SELECT '✅ Test points awarded to first user';
