-- =============================================================
-- Diagnostic: Check if Points System is Set Up Correctly
-- Run this to see what's missing
-- =============================================================

-- Check if points table exists
SELECT 'Points table exists' as check_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points') as result;

-- Check if award_points function exists
SELECT 'award_points function exists' as check_name,
       EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'award_points') as result;

-- Check if profiles has total_points column
SELECT 'profiles.total_points exists' as check_name,
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'profiles' AND column_name = 'total_points') as result;

-- Check if devotional_reads table exists
SELECT 'devotional_reads table exists' as check_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devotional_reads') as result;

-- Check current points entries
SELECT 'Total points entries' as check_name, COUNT(*)::text as result FROM points;

-- Check user profiles with points
SELECT 'Users with points' as check_name, COUNT(*)::text as result
FROM profiles WHERE total_points > 0;

-- Show function definition if it exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'award_points';
