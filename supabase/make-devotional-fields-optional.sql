-- Make devotional fields optional (allow NULL)
-- Only date and theme are required

ALTER TABLE public.daily_devotionals
ALTER COLUMN scripture_ref DROP NOT NULL;

ALTER TABLE public.daily_devotionals
ALTER COLUMN scripture_text DROP NOT NULL;

ALTER TABLE public.daily_devotionals
ALTER COLUMN reflection DROP NOT NULL;

ALTER TABLE public.daily_devotionals
ALTER COLUMN affirmation DROP NOT NULL;

ALTER TABLE public.daily_devotionals
ALTER COLUMN prayer DROP NOT NULL;

SELECT '✅ Devotional fields are now optional' as status;
