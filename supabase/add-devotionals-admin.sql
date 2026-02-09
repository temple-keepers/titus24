-- =============================================================
-- Add Daily Devotionals Admin Management
-- Allows leaders to create and manage devotional content
-- =============================================================

-- Create daily_devotionals table
CREATE TABLE IF NOT EXISTS public.daily_devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  theme text NOT NULL,
  scripture_ref text NOT NULL,
  scripture_text text NOT NULL,
  reflection text NOT NULL,
  affirmation text NOT NULL,
  prayer text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can read devotionals" ON public.daily_devotionals;
CREATE POLICY "Anyone can read devotionals"
ON public.daily_devotionals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leaders can insert devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can insert devotionals"
ON public.daily_devotionals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can update devotionals"
ON public.daily_devotionals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can delete devotionals"
ON public.daily_devotionals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
);

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_daily_devotionals_date ON public.daily_devotionals(date);

-- Update trigger
CREATE OR REPLACE FUNCTION update_devotional_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_devotional_updated_at_trigger ON public.daily_devotionals;
CREATE TRIGGER update_devotional_updated_at_trigger
BEFORE UPDATE ON public.daily_devotionals
FOR EACH ROW
EXECUTE FUNCTION update_devotional_updated_at();

SELECT '✅ daily_devotionals table created with RLS policies' as status;
