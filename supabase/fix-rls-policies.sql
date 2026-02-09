-- =============================================================
-- Security Fix: Proper RLS Policies
-- Fixes overly permissive policies identified in audit
-- Run this AFTER migrate-new-features.sql
-- =============================================================

-- ─── Daily Devotionals: Only leaders can insert ─────────────
DROP POLICY IF EXISTS "Leaders can insert devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can insert devotionals" ON public.daily_devotionals
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

DROP POLICY IF EXISTS "Leaders can update devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can update devotionals" ON public.daily_devotionals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

DROP POLICY IF EXISTS "Leaders can delete devotionals" ON public.daily_devotionals;
CREATE POLICY "Leaders can delete devotionals" ON public.daily_devotionals
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- ─── Prayer Partnerships: Only leaders can manage ───────────
DROP POLICY IF EXISTS "Leaders can manage partnerships" ON public.prayer_partnerships;
CREATE POLICY "Leaders can insert partnerships" ON public.prayer_partnerships
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

CREATE POLICY "Leaders can update partnerships" ON public.prayer_partnerships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

CREATE POLICY "Leaders can delete partnerships" ON public.prayer_partnerships
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- ─── Testimonies: Only authors can update/delete their own ──
DROP POLICY IF EXISTS "Anyone can update testimonies" ON public.testimonies;
CREATE POLICY "Authors can update own testimonies" ON public.testimonies
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Leaders can update any testimony" ON public.testimonies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- ─── Elder Questions: Only leaders can answer ───────────────
DROP POLICY IF EXISTS "Leaders can answer questions" ON public.elder_questions;
CREATE POLICY "Leaders can update questions" ON public.elder_questions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  )
);

-- ─── Add delete policy for authors ──────────────────────────
CREATE POLICY "Authors can delete own questions" ON public.elder_questions
FOR DELETE USING (auth.uid() = author_id);

-- ─── Testimonies: Authors can delete own ────────────────────
CREATE POLICY "Authors can delete own testimonies" ON public.testimonies
FOR DELETE USING (auth.uid() = author_id OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader'
));

SELECT 'RLS policies fixed - security vulnerabilities patched!' AS status;
