-- =============================================================
-- Manual Test: Award Points to Your User
-- Replace 'YOUR-USER-ID-HERE' with your actual user ID
-- =============================================================

-- Step 1: Find your user ID
SELECT id, first_name, email, total_points FROM profiles LIMIT 5;

-- Step 2: Try to call award_points function (replace the UUID)
-- SELECT award_points(
--   'YOUR-USER-ID-HERE'::uuid,
--   'daily_checkin',
--   5,
--   'Manual test check-in'
-- );

-- Step 3: Check if it worked
-- SELECT * FROM points WHERE user_id = 'YOUR-USER-ID-HERE'::uuid ORDER BY created_at DESC LIMIT 5;

-- Step 4: Check total points on profile
-- SELECT id, first_name, total_points FROM profiles WHERE id = 'YOUR-USER-ID-HERE'::uuid;

-------------------------------------------------------------------
-- If award_points function doesn't exist, create it manually:
-------------------------------------------------------------------

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
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points TO authenticated;

-- Now try the test again from Step 2
