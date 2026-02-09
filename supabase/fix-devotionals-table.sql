-- Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_devotionals'
ORDER BY ordinal_position;

-- Add created_by column if it doesn't exist
ALTER TABLE public.daily_devotionals
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.daily_devotionals
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Verify the fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_devotionals'
ORDER BY ordinal_position;

SELECT '✅ Fixed daily_devotionals table structure' as status;
