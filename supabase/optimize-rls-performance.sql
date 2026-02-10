-- =============================================================
-- Performance Optimization: Fix RLS auth.uid() calls
-- Wraps auth.uid() in subselects to evaluate once per query
-- instead of once per row (significant performance improvement)
-- =============================================================

-- This fixes all "Auth RLS Initialization Plan" warnings
-- Replace auth.uid() with (select auth.uid()) in all policies

-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ((select auth.uid()) = id);

-- ═══════════════════════════════════════════════════════════
-- POSTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;
CREATE POLICY "Posts are viewable by authenticated users" ON public.posts
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own posts, leaders can delete any" ON public.posts;
CREATE POLICY "Users can delete own posts, leaders can delete any" ON public.posts
FOR DELETE USING (
  (select auth.uid()) = author_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update any post" ON public.posts;
CREATE POLICY "Leaders can update any post" ON public.posts
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;
CREATE POLICY "Comments are viewable by authenticated users" ON public.comments
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own comments, leaders can delete any" ON public.comments;
CREATE POLICY "Users can delete own comments, leaders can delete any" ON public.comments
FOR DELETE USING (
  (select auth.uid()) = author_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- REACTIONS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Reactions are viewable by authenticated users" ON public.reactions;
CREATE POLICY "Reactions are viewable by authenticated users" ON public.reactions
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.reactions;
CREATE POLICY "Users can manage own reactions" ON public.reactions
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;
CREATE POLICY "Users can delete own reactions" ON public.reactions
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- PRAYER REQUESTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Prayer requests are viewable by authenticated users" ON public.prayer_requests;
CREATE POLICY "Prayer requests are viewable by authenticated users" ON public.prayer_requests
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can create prayers" ON public.prayer_requests;
CREATE POLICY "Users can create prayers" ON public.prayer_requests
FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own prayers" ON public.prayer_requests;
CREATE POLICY "Authors can update own prayers" ON public.prayer_requests
FOR UPDATE USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors + leaders can delete prayers" ON public.prayer_requests;
CREATE POLICY "Authors + leaders can delete prayers" ON public.prayer_requests
FOR DELETE USING (
  (select auth.uid()) = author_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- PRAYER RESPONSES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Prayer responses are viewable by authenticated users" ON public.prayer_responses;
CREATE POLICY "Prayer responses are viewable by authenticated users" ON public.prayer_responses
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can add prayer responses" ON public.prayer_responses;
CREATE POLICY "Users can add prayer responses" ON public.prayer_responses
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own prayer responses" ON public.prayer_responses;
CREATE POLICY "Users can remove own prayer responses" ON public.prayer_responses
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- RSVPS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "RSVPs are viewable by authenticated users" ON public.rsvps;
CREATE POLICY "RSVPs are viewable by authenticated users" ON public.rsvps
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage own RSVPs" ON public.rsvps;
CREATE POLICY "Users can manage own RSVPs" ON public.rsvps
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own RSVPs" ON public.rsvps;
CREATE POLICY "Users can update own RSVPs" ON public.rsvps
FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own RSVPs" ON public.rsvps;
CREATE POLICY "Users can delete own RSVPs" ON public.rsvps
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- EVENT REMINDERS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can see own reminders" ON public.event_reminders;
CREATE POLICY "Users can see own reminders" ON public.event_reminders
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own reminders" ON public.event_reminders;
CREATE POLICY "Users can manage own reminders" ON public.event_reminders
FOR ALL USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- STUDY ENROLLMENTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Study enrolments are viewable by authenticated users" ON public.study_enrollments;
CREATE POLICY "Study enrolments are viewable by authenticated users" ON public.study_enrollments
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can enrol themselves" ON public.study_enrollments;
CREATE POLICY "Users can enrol themselves" ON public.study_enrollments
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unenrol themselves" ON public.study_enrollments;
CREATE POLICY "Users can unenrol themselves" ON public.study_enrollments
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- STUDY PROGRESS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can see own progress" ON public.study_progress;
CREATE POLICY "Users can see own progress" ON public.study_progress
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.study_progress;
CREATE POLICY "Users can insert own progress" ON public.study_progress
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.study_progress;
CREATE POLICY "Users can update own progress" ON public.study_progress
FOR UPDATE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- GALLERY PHOTOS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Gallery photos are viewable by authenticated users" ON public.gallery_photos;
CREATE POLICY "Gallery photos are viewable by authenticated users" ON public.gallery_photos
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload photos" ON public.gallery_photos;
CREATE POLICY "Users can upload photos" ON public.gallery_photos
FOR INSERT WITH CHECK ((select auth.uid()) = uploaded_by);

DROP POLICY IF EXISTS "Users can delete own photos, leaders can delete any" ON public.gallery_photos;
CREATE POLICY "Users can delete own photos, leaders can delete any" ON public.gallery_photos
FOR DELETE USING (
  (select auth.uid()) = uploaded_by OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can see own messages" ON public.messages;
CREATE POLICY "Users can see own messages" ON public.messages
FOR SELECT USING ((select auth.uid()) IN (sender_id, receiver_id));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════

-- Fix overly permissive policy
DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications" ON public.notifications
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- USER BADGES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "User badges are viewable by authenticated users" ON public.user_badges;
CREATE POLICY "User badges are viewable by authenticated users" ON public.user_badges
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "System can insert badges" ON public.user_badges
FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- PRAYER PARTNERSHIPS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can read own partnerships" ON public.prayer_partnerships;
CREATE POLICY "Users can read own partnerships" ON public.prayer_partnerships
FOR SELECT USING ((select auth.uid()) IN (user_a_id, user_b_id));

DROP POLICY IF EXISTS "Leaders can insert partnerships" ON public.prayer_partnerships;
CREATE POLICY "Leaders can insert partnerships" ON public.prayer_partnerships
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update partnerships" ON public.prayer_partnerships;
CREATE POLICY "Leaders can update partnerships" ON public.prayer_partnerships
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete partnerships" ON public.prayer_partnerships;
CREATE POLICY "Leaders can delete partnerships" ON public.prayer_partnerships
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- TESTIMONIES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Testimonies are viewable by authenticated users" ON public.testimonies;
CREATE POLICY "Testimonies are viewable by authenticated users" ON public.testimonies
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Auth users can create testimonies" ON public.testimonies;
CREATE POLICY "Auth users can create testimonies" ON public.testimonies
FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own testimonies" ON public.testimonies;
CREATE POLICY "Authors can update own testimonies" ON public.testimonies
FOR UPDATE USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Leaders can update any testimony" ON public.testimonies;
CREATE POLICY "Leaders can update any testimony" ON public.testimonies
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Users can delete own testimonies" ON public.testimonies;
CREATE POLICY "Users can delete own testimonies" ON public.testimonies
FOR DELETE USING (
  (select auth.uid()) = author_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- TESTIMONY CELEBRATIONS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Testimony celebrations are viewable by authenticated users" ON public.testimony_celebrations;
CREATE POLICY "Testimony celebrations are viewable by authenticated users" ON public.testimony_celebrations
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Auth users can celebrate" ON public.testimony_celebrations;
CREATE POLICY "Auth users can celebrate" ON public.testimony_celebrations
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can uncelebrate" ON public.testimony_celebrations;
CREATE POLICY "Users can uncelebrate" ON public.testimony_celebrations
FOR DELETE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- ELDER QUESTIONS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Elder questions are viewable by authenticated users" ON public.elder_questions;
CREATE POLICY "Elder questions are viewable by authenticated users" ON public.elder_questions
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Auth users can ask questions" ON public.elder_questions;
CREATE POLICY "Auth users can ask questions" ON public.elder_questions
FOR INSERT WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Leaders can update questions" ON public.elder_questions;
CREATE POLICY "Leaders can update questions" ON public.elder_questions
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Authors can delete own questions" ON public.elder_questions;
CREATE POLICY "Authors can delete own questions" ON public.elder_questions
FOR DELETE USING ((select auth.uid()) = author_id);

-- ═══════════════════════════════════════════════════════════
-- DAILY CHECKINS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can see own checkins" ON public.daily_checkins;
CREATE POLICY "Users can see own checkins" ON public.daily_checkins
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own checkins" ON public.daily_checkins;
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own checkins" ON public.daily_checkins;
CREATE POLICY "Users can update own checkins" ON public.daily_checkins
FOR UPDATE USING ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- DEVOTIONAL READS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can read own devotional reads" ON public.devotional_reads;
CREATE POLICY "Users can read own devotional reads" ON public.devotional_reads
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own devotional reads" ON public.devotional_reads;
CREATE POLICY "Users can insert own devotional reads" ON public.devotional_reads
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════
-- EVENTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
CREATE POLICY "Events are viewable by authenticated users" ON public.events
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can create events" ON public.events;
CREATE POLICY "Leaders can create events" ON public.events
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update events" ON public.events;
CREATE POLICY "Leaders can update events" ON public.events
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete events" ON public.events;
CREATE POLICY "Leaders can delete events" ON public.events
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- RESOURCES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Resources are viewable by authenticated users" ON public.resources;
CREATE POLICY "Resources are viewable by authenticated users" ON public.resources
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can create resources" ON public.resources;
CREATE POLICY "Leaders can create resources" ON public.resources
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update resources" ON public.resources;
CREATE POLICY "Leaders can update resources" ON public.resources
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete resources" ON public.resources;
CREATE POLICY "Leaders can delete resources" ON public.resources
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- BIBLE STUDIES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Bible studies viewable by authenticated users" ON public.bible_studies;
CREATE POLICY "Bible studies viewable by authenticated users" ON public.bible_studies
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can create studies" ON public.bible_studies;
CREATE POLICY "Leaders can create studies" ON public.bible_studies
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can update studies" ON public.bible_studies;
CREATE POLICY "Leaders can update studies" ON public.bible_studies
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

DROP POLICY IF EXISTS "Leaders can delete studies" ON public.bible_studies;
CREATE POLICY "Leaders can delete studies" ON public.bible_studies
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- STUDY DAYS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Study days viewable by authenticated users" ON public.study_days;
CREATE POLICY "Study days viewable by authenticated users" ON public.study_days
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can manage study days" ON public.study_days;
CREATE POLICY "Leaders can manage study days" ON public.study_days
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- GALLERY ALBUMS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Gallery albums viewable by authenticated users" ON public.gallery_albums;
CREATE POLICY "Gallery albums viewable by authenticated users" ON public.gallery_albums
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can manage albums" ON public.gallery_albums;
CREATE POLICY "Leaders can manage albums" ON public.gallery_albums
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

-- ═══════════════════════════════════════════════════════════
-- BADGES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Badges viewable by authenticated users" ON public.badges;
CREATE POLICY "Badges viewable by authenticated users" ON public.badges
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- POINTS
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Points viewable by user" ON public.points;
CREATE POLICY "Points viewable by user" ON public.points
FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Auth users can earn points" ON public.points;
CREATE POLICY "Auth users can earn points" ON public.points
FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- ATTENDANCE
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Attendance viewable by all" ON public.attendance;
CREATE POLICY "Attendance viewable by all" ON public.attendance
FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Leaders can record attendance" ON public.attendance;
CREATE POLICY "Leaders can record attendance" ON public.attendance
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'leader')
);

SELECT '✅ RLS performance optimization complete! All policies now use (select auth.uid())' AS status;
