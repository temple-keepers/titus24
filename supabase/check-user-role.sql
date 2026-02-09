-- Check your current user's role
SELECT
  id,
  email,
  first_name,
  last_name,
  role
FROM public.profiles
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- If you need to update your role to 'leader':
-- UPDATE public.profiles SET role = 'leader' WHERE email = 'YOUR_EMAIL_HERE';
