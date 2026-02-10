-- =============================================================
-- Remove Duplicate RLS Policies
-- Consolidates multiple permissive policies into single policies
-- =============================================================

-- ═══════════════════════════════════════════════════════════
-- ATTENDANCE - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Leaders can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Leaders can view attendance" ON public.attendance;

-- Keep only: "Attendance viewable by all" and "Leaders can record attendance"

-- ═══════════════════════════════════════════════════════════
-- BADGES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Badges viewable by all" ON public.badges;

-- Keep only: "Badges viewable by authenticated users"

-- ═══════════════════════════════════════════════════════════
-- BIBLE STUDIES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Leaders can manage bible studies" ON public.bible_studies;
DROP POLICY IF EXISTS "Leaders can create bible studies" ON public.bible_studies;
DROP POLICY IF EXISTS "Leaders can update bible studies" ON public.bible_studies;
DROP POLICY IF EXISTS "Leaders can delete bible studies" ON public.bible_studies;
DROP POLICY IF EXISTS "Studies viewable by all" ON public.bible_studies;

-- Keep only: "Bible studies viewable by authenticated users", "Leaders can create studies",
-- "Leaders can update studies", "Leaders can delete studies"

-- ═══════════════════════════════════════════════════════════
-- COMMENTS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Users can delete their comments" ON public.comments;
DROP POLICY IF EXISTS "Comments viewable by all authenticated" ON public.comments;

-- Keep only: "Comments are viewable by authenticated users", "Users can create comments",
-- "Users can delete own comments, leaders can delete any"

-- ═══════════════════════════════════════════════════════════
-- DAILY CHECKINS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Users can read own checkins" ON public.daily_checkins;

-- Keep only: "Users can see own checkins", "Users can insert own checkins",
-- "Users can update own checkins"

-- ═══════════════════════════════════════════════════════════
-- DAILY DEVOTIONALS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Devotionals viewable by all" ON public.daily_devotionals;
DROP POLICY IF EXISTS "Daily devotionals viewable by all" ON public.daily_devotionals;

-- Keep only: "Leaders can insert devotionals", "Leaders can update devotionals",
-- "Leaders can delete devotionals"

-- ═══════════════════════════════════════════════════════════
-- DEVOTIONAL READS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Users can track own reads" ON public.devotional_reads;

-- Keep only: "Users can read own devotional reads", "Users can insert own devotional reads"

-- ═══════════════════════════════════════════════════════════
-- ELDER QUESTIONS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Questions viewable by all" ON public.elder_questions;

-- Keep only: "Elder questions are viewable by authenticated users",
-- "Auth users can ask questions", "Leaders can update questions",
-- "Authors can delete own questions"

-- ═══════════════════════════════════════════════════════════
-- EVENTS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Events viewable by all" ON public.events;

-- Keep only: "Events are viewable by authenticated users", "Leaders can create events",
-- "Leaders can update events", "Leaders can delete events"

-- ═══════════════════════════════════════════════════════════
-- GALLERY ALBUMS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Albums viewable by all" ON public.gallery_albums;

-- Keep only: "Gallery albums viewable by authenticated users",
-- "Leaders can manage albums"

-- ═══════════════════════════════════════════════════════════
-- GALLERY PHOTOS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Photos viewable by all" ON public.gallery_photos;

-- Keep only: "Gallery photos are viewable by authenticated users",
-- "Users can upload photos", "Users can delete own photos, leaders can delete any"

-- ═══════════════════════════════════════════════════════════
-- MESSAGES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

-- Keep only: "Users can see own messages", "Users can send messages"

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- System can create notifications already optimized in main script

-- ═══════════════════════════════════════════════════════════
-- POSTS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Posts viewable by all" ON public.posts;
DROP POLICY IF EXISTS "Users can create their posts" ON public.posts;

-- Keep only: "Posts are viewable by authenticated users", "Users can create posts",
-- "Users can delete own posts, leaders can delete any", "Leaders can update any post"

-- ═══════════════════════════════════════════════════════════
-- PRAYER REQUESTS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Prayer requests viewable by all" ON public.prayer_requests;

-- Keep only: "Prayer requests are viewable by authenticated users",
-- "Users can create prayers", "Authors can update own prayers",
-- "Authors + leaders can delete prayers"

-- ═══════════════════════════════════════════════════════════
-- PRAYER RESPONSES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Responses viewable by all" ON public.prayer_responses;

-- Keep only: "Prayer responses are viewable by authenticated users",
-- "Users can add prayer responses", "Users can remove own prayer responses"

-- ═══════════════════════════════════════════════════════════
-- PROFILES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profile" ON public.profiles;

-- Keep only: "Profiles are viewable by authenticated users",
-- "Users can update own profile"

-- ═══════════════════════════════════════════════════════════
-- REACTIONS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Reactions viewable by all" ON public.reactions;

-- Keep only: "Reactions are viewable by authenticated users",
-- "Users can manage own reactions", "Users can delete own reactions"

-- ═══════════════════════════════════════════════════════════
-- RESOURCES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Resources viewable by all" ON public.resources;

-- Keep only: "Resources are viewable by authenticated users",
-- "Leaders can create resources", "Leaders can update resources",
-- "Leaders can delete resources"

-- ═══════════════════════════════════════════════════════════
-- RSVPS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "RSVPs viewable by all" ON public.rsvps;

-- Keep only: "RSVPs are viewable by authenticated users",
-- "Users can manage own RSVPs", "Users can update own RSVPs",
-- "Users can delete own RSVPs"

-- ═══════════════════════════════════════════════════════════
-- STUDY DAYS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Study days viewable by all" ON public.study_days;

-- Keep only: "Study days viewable by authenticated users",
-- "Leaders can manage study days"

-- ═══════════════════════════════════════════════════════════
-- STUDY ENROLLMENTS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Enrollments viewable by all" ON public.study_enrollments;

-- Keep only: "Study enrolments are viewable by authenticated users",
-- "Users can enrol themselves", "Users can unenrol themselves"

-- ═══════════════════════════════════════════════════════════
-- STUDY PROGRESS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.study_progress;

-- Keep only: "Users can see own progress", "Users can insert own progress",
-- "Users can update own progress"

-- ═══════════════════════════════════════════════════════════
-- TESTIMONIES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Testimonies viewable by all" ON public.testimonies;
DROP POLICY IF EXISTS "Leaders can manage testimonies" ON public.testimonies;

-- Keep only: "Testimonies are viewable by authenticated users",
-- "Auth users can create testimonies", "Authors can update own testimonies",
-- "Leaders can update any testimony", "Users can delete own testimonies"

-- ═══════════════════════════════════════════════════════════
-- TESTIMONY CELEBRATIONS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Celebrations viewable by all" ON public.testimony_celebrations;

-- Keep only: "Testimony celebrations are viewable by authenticated users",
-- "Auth users can celebrate", "Users can uncelebrate"

-- ═══════════════════════════════════════════════════════════
-- USER BADGES - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "User badges viewable by all" ON public.user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;

-- Keep only: "User badges are viewable by authenticated users",
-- "System can award badges"

-- ═══════════════════════════════════════════════════════════
-- PRAYER PARTNERSHIPS - Remove duplicates
-- ═══════════════════════════════════════════════════════════

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Partnerships viewable by participants" ON public.prayer_partnerships;

-- Keep only: "Users can read own partnerships", "Leaders can insert partnerships",
-- "Leaders can update partnerships", "Leaders can delete partnerships"

SELECT '✅ Duplicate policies removed! Performance improved.' AS status;
