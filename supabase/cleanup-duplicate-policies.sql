-- =============================================================
-- Titus 2:4 — Remove Duplicate RLS Policies
-- Keeps the newer/better-named policy, drops the old duplicate
-- =============================================================

-- ─── daily_devotionals ──────────────────────────────────────
DROP POLICY IF EXISTS "Daily devotionals viewable by all" ON public.daily_devotionals;

-- ─── event_reminders ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can see own reminders" ON public.event_reminders;

-- ─── gallery_albums ─────────────────────────────────────────
DROP POLICY IF EXISTS "Gallery albums viewable by authenticated users" ON public.gallery_albums;

-- ─── messages ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;

-- ─── notifications ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

-- ─── points ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Points viewable by user" ON public.points;

-- ─── posts ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;

-- ─── prayer_requests ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Users can create prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Users can update their prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Prayer requests are viewable by authenticated users" ON public.prayer_requests;

-- ─── prayer_responses ───────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their prayer responses" ON public.prayer_responses;
DROP POLICY IF EXISTS "Users can create prayer responses" ON public.prayer_responses;
DROP POLICY IF EXISTS "Prayer responses are viewable by authenticated users" ON public.prayer_responses;

-- ─── profiles ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- ─── reactions ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON public.reactions;
DROP POLICY IF EXISTS "Reactions are viewable by authenticated users" ON public.reactions;

-- ─── resources ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Resources are viewable by authenticated users" ON public.resources;

-- ─── rsvps ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can manage their RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can update their RSVPs" ON public.rsvps;

-- ─── study_days ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Study days viewable by authenticated users" ON public.study_days;

-- ─── study_enrollments ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can unenrol themselves" ON public.study_enrollments;
DROP POLICY IF EXISTS "Users can enrol themselves" ON public.study_enrollments;

-- ─── study_progress ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can record study progress" ON public.study_progress;
DROP POLICY IF EXISTS "Users can view their study progress" ON public.study_progress;
DROP POLICY IF EXISTS "Users can update their study progress" ON public.study_progress;

-- ─── testimonies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Testimonies are viewable by authenticated users" ON public.testimonies;
DROP POLICY IF EXISTS "Leaders can update any testimony" ON public.testimonies;

-- ─── testimony_celebrations ─────────────────────────────────
DROP POLICY IF EXISTS "Testimony celebrations are viewable by authenticated users" ON public.testimony_celebrations;

SELECT 'Duplicate policies removed!' AS status;
