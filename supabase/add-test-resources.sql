-- =============================================================
-- Add Test Resources (if none exist)
-- This will help verify the resources page is working
-- =============================================================

-- First, get a leader user ID
DO $$
DECLARE
  leader_id uuid;
BEGIN
  -- Find a leader user
  SELECT id INTO leader_id FROM profiles WHERE role = 'leader' LIMIT 1;

  -- If no leader exists, use first user
  IF leader_id IS NULL THEN
    SELECT id INTO leader_id FROM profiles LIMIT 1;
  END IF;

  IF leader_id IS NOT NULL THEN
    -- Check if created_by column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'resources' AND column_name = 'created_by'
    ) THEN
      -- Add test resources if none exist (with created_by)
      IF NOT EXISTS (SELECT 1 FROM resources) THEN
        INSERT INTO resources (title, category, type, thumbnail, description, why_it_matters, next_step, link, created_by)
        VALUES
        (
          'Understanding Biblical Womanhood',
          'Teaching',
          'article',
          null,
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
          null,
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
          null,
          'Daily reminders of God''s unconditional love for you and your worth in Christ',
          'Knowing your identity in Christ transforms how you see yourself and live each day.',
          'Choose one affirmation to memorize and declare over yourself this week.',
          'https://www.crosswalk.com/faith/spiritual-life/10-things-god-wants-you-to-know.html',
          leader_id
        );
        RAISE NOTICE 'Test resources added successfully (with created_by)';
      ELSE
        RAISE NOTICE 'Resources already exist, skipping test data';
      END IF;
    ELSE
      -- Add test resources without created_by column (older schema)
      IF NOT EXISTS (SELECT 1 FROM resources) THEN
        INSERT INTO resources (title, category, type, thumbnail, description, why_it_matters, next_step, link)
        VALUES
        (
          'Understanding Biblical Womanhood',
          'Teaching',
          'article',
          null,
          'A deep dive into what it means to be a godly woman according to Titus 2:3-5',
          'This teaching helps you understand your identity and calling as a woman of God.',
          'Read the article and journal about one principle that resonated with you.',
          'https://www.desiringgod.org/articles/what-is-biblical-womanhood'
        ),
        (
          'Prayer That Moves Mountains',
          'Guide',
          'video',
          null,
          'Practical guide on developing a powerful prayer life that sees breakthrough',
          'Prayer is the foundation of a vibrant relationship with God and seeing His power manifest.',
          'Commit to 10 minutes of focused prayer daily this week.',
          'https://www.youtube.com/watch?v=example'
        ),
        (
          'You Are Loved - Daily Affirmations',
          'Inspiration',
          'article',
          null,
          'Daily reminders of God''s unconditional love for you and your worth in Christ',
          'Knowing your identity in Christ transforms how you see yourself and live each day.',
          'Choose one affirmation to memorize and declare over yourself this week.',
          'https://www.crosswalk.com/faith/spiritual-life/10-things-god-wants-you-to-know.html'
        );
        RAISE NOTICE 'Test resources added successfully (without created_by)';
      ELSE
        RAISE NOTICE 'Resources already exist, skipping test data';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'No users found in database';
  END IF;
END $$;

-- Show what was added
SELECT
  id,
  title,
  category,
  type,
  CASE WHEN LENGTH(description) > 50
    THEN SUBSTRING(description, 1, 50) || '...'
    ELSE description
  END as description_preview,
  created_at
FROM resources
ORDER BY created_at DESC;

SELECT '✅ Test resources added (if needed)' as status;
