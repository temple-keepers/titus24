-- =============================================================
-- Fix Resources Table - Add Missing Column
-- =============================================================

-- Check current columns in resources table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;

-- Add missing created_by column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added created_by column';
  ELSE
    RAISE NOTICE 'ℹ️ created_by column already exists';
  END IF;
END $$;

-- Add missing created_at column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE '✅ Added created_at column';
  ELSE
    RAISE NOTICE 'ℹ️ created_at column already exists';
  END IF;
END $$;

-- Show final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;

SELECT '✅ Resources table structure fixed!' as status;
