-- =============================================================
-- Performance & Data Integrity Fixes
-- Adds indexes, unique constraints, and database functions
-- Run this AFTER fix-rls-policies.sql
-- =============================================================

-- ─── Performance Indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_post_user ON public.reactions(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON public.prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON public.prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_answered ON public.prayer_requests(is_answered);

CREATE INDEX IF NOT EXISTS idx_prayer_responses_request ON public.prayer_responses(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_responses_user ON public.prayer_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON public.messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_user ON public.rsvps(event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_study_progress_user_study ON public.study_progress(user_id, study_id);
CREATE INDEX IF NOT EXISTS idx_study_enrollments_user ON public.study_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_study_days_study ON public.study_days(study_id, day_number);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_album ON public.gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_testimonies_created ON public.testimonies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimony_celebrations_testimony ON public.testimony_celebrations(testimony_id);

CREATE INDEX IF NOT EXISTS idx_elder_questions_created ON public.elder_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elder_questions_answered ON public.elder_questions(is_answered);

CREATE INDEX IF NOT EXISTS idx_points_user_created ON public.points(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);

-- ─── Rate Limiting: Track devotional reads ──────────────────
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

CREATE INDEX IF NOT EXISTS idx_devotional_reads_user_date ON public.devotional_reads(user_id, date);

-- ─── Atomic Points Update Function ──────────────────────────
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.award_points TO authenticated;

-- ─── Function to Calculate Celebration Count ────────────────
CREATE OR REPLACE FUNCTION public.get_celebration_count(testimony_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM public.testimony_celebrations
  WHERE testimony_id = testimony_id_param;
$$;

-- ─── Trigger to Update Celebration Count ────────────────────
CREATE OR REPLACE FUNCTION public.update_testimony_celebration_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonies
    SET celebration_count = celebration_count + 1
    WHERE id = NEW.testimony_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonies
    SET celebration_count = GREATEST(0, celebration_count - 1)
    WHERE id = OLD.testimony_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_celebration_count ON public.testimony_celebrations;
CREATE TRIGGER trigger_update_celebration_count
AFTER INSERT OR DELETE ON public.testimony_celebrations
FOR EACH ROW
EXECUTE FUNCTION public.update_testimony_celebration_count();

-- ─── Function to Check and Award Badges ─────────────────────
CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  p_user_id uuid,
  p_badge_slug text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id uuid;
  v_threshold integer;
  v_category text;
  v_count integer;
  v_already_earned boolean;
BEGIN
  -- Get badge info
  SELECT id, threshold, category INTO v_badge_id, v_threshold, v_category
  FROM public.badges
  WHERE slug = p_badge_slug;

  IF v_badge_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = p_user_id AND badge_id = v_badge_id
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN false;
  END IF;

  -- Count based on badge category
  CASE v_category
    WHEN 'community' THEN
      IF p_badge_slug = 'first-post' OR p_badge_slug = 'five-posts' THEN
        SELECT COUNT(*) INTO v_count FROM public.posts WHERE author_id = p_user_id;
      ELSIF p_badge_slug = 'first-comment' OR p_badge_slug = 'ten-comments' THEN
        SELECT COUNT(*) INTO v_count FROM public.comments WHERE author_id = p_user_id;
      END IF;
    WHEN 'prayer' THEN
      IF p_badge_slug = 'first-prayer' THEN
        SELECT COUNT(*) INTO v_count FROM public.prayer_requests WHERE author_id = p_user_id;
      ELSIF p_badge_slug LIKE 'prayer-warrior%' THEN
        SELECT COUNT(*) INTO v_count FROM public.prayer_responses WHERE user_id = p_user_id;
      END IF;
    WHEN 'study' THEN
      SELECT COUNT(*) INTO v_count FROM public.study_progress WHERE user_id = p_user_id;
    ELSE
      v_count := 0;
  END CASE;

  -- Award badge if threshold met
  IF v_count >= v_threshold THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge_id)
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_award_badge TO authenticated;

-- ─── Fix Default Values ──────────────────────────────────────
-- Remove problematic empty string defaults (use NULL instead)
ALTER TABLE public.profiles ALTER COLUMN last_name DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN email DROP DEFAULT;

SELECT 'Indexes added, functions created, and data integrity improved!' AS status;
