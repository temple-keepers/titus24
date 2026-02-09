-- =============================================================
-- Titus 2:4 Company — Full Database Schema (Safe Re-run)
-- Drops existing policies before recreating. Safe to run on an
-- existing Supabase project that already has tables.
-- =============================================================

-- ─── Helper Function ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  );
$$;

-- ─── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text DEFAULT '',
  email text DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  photo_url text,
  area text,
  about text,
  prayer_focus text,
  birthday date,
  birthday_visible boolean DEFAULT false,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  digest_day text,
  digest_time text,
  digest_timezone text,
  last_attended date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by all authenticated" ON public.profiles;
CREATE POLICY "Profiles are viewable by all authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Posts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable by all authenticated" ON public.posts;
CREATE POLICY "Posts viewable by all authenticated" ON public.posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts, leaders can delete any" ON public.posts;
CREATE POLICY "Users can delete own posts, leaders can delete any" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR is_leader());

DROP POLICY IF EXISTS "Leaders can update any post" ON public.posts;
CREATE POLICY "Leaders can update any post" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id OR is_leader());

-- ─── Comments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by all authenticated" ON public.comments;
CREATE POLICY "Comments viewable by all authenticated" ON public.comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments, leaders can delete any" ON public.comments;
CREATE POLICY "Users can delete own comments, leaders can delete any" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR is_leader());

-- ─── Reactions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('amen', 'heart', 'praying')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions viewable by all authenticated" ON public.reactions;
CREATE POLICY "Reactions viewable by all authenticated" ON public.reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.reactions;
CREATE POLICY "Users can manage own reactions" ON public.reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;
CREATE POLICY "Users can delete own reactions" ON public.reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Prayer Requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  is_anonymous boolean DEFAULT false,
  is_answered boolean DEFAULT false,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prayers viewable by all authenticated" ON public.prayer_requests;
CREATE POLICY "Prayers viewable by all authenticated" ON public.prayer_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create prayers" ON public.prayer_requests;
CREATE POLICY "Users can create prayers" ON public.prayer_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own prayers" ON public.prayer_requests;
CREATE POLICY "Authors can update own prayers" ON public.prayer_requests
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors + leaders can delete prayers" ON public.prayer_requests;
CREATE POLICY "Authors + leaders can delete prayers" ON public.prayer_requests
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR is_leader());

-- ─── Prayer Responses ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prayer_request_id, user_id)
);

ALTER TABLE public.prayer_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prayer responses viewable by all" ON public.prayer_responses;
CREATE POLICY "Prayer responses viewable by all" ON public.prayer_responses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can add prayer responses" ON public.prayer_responses;
CREATE POLICY "Users can add prayer responses" ON public.prayer_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own prayer responses" ON public.prayer_responses;
CREATE POLICY "Users can remove own prayer responses" ON public.prayer_responses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text NOT NULL,
  location text DEFAULT '',
  what_to_bring text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events viewable by all authenticated" ON public.events;
CREATE POLICY "Events viewable by all authenticated" ON public.events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can create events" ON public.events;
CREATE POLICY "Leaders can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (is_leader());

DROP POLICY IF EXISTS "Leaders can update events" ON public.events;
CREATE POLICY "Leaders can update events" ON public.events
  FOR UPDATE TO authenticated USING (is_leader());

DROP POLICY IF EXISTS "Leaders can delete events" ON public.events;
CREATE POLICY "Leaders can delete events" ON public.events
  FOR DELETE TO authenticated USING (is_leader());

-- ─── RSVPs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('coming', 'maybe', 'no')),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RSVPs viewable by all" ON public.rsvps;
CREATE POLICY "RSVPs viewable by all" ON public.rsvps
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage own RSVPs" ON public.rsvps;
CREATE POLICY "Users can manage own RSVPs" ON public.rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own RSVPs" ON public.rsvps;
CREATE POLICY "Users can update own RSVPs" ON public.rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ─── Event Reminders ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  remind_offset_hours integer DEFAULT 24,
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own reminders" ON public.event_reminders;
CREATE POLICY "Users can see own reminders" ON public.event_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reminders" ON public.event_reminders;
CREATE POLICY "Users can manage own reminders" ON public.event_reminders
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ─── Attendance ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance viewable by all" ON public.attendance;
CREATE POLICY "Attendance viewable by all" ON public.attendance
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can manage attendance" ON public.attendance;
CREATE POLICY "Leaders can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (is_leader());

-- ─── Bible Studies ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bible_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  cover_image text,
  total_days integer NOT NULL DEFAULT 1,
  start_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bible_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studies viewable by all" ON public.bible_studies;
CREATE POLICY "Studies viewable by all" ON public.bible_studies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can create studies" ON public.bible_studies;
CREATE POLICY "Leaders can create studies" ON public.bible_studies
  FOR INSERT TO authenticated WITH CHECK (is_leader());

-- ─── Study Days ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.bible_studies(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  scripture_ref text DEFAULT '',
  scripture_text text,
  reflection_prompt text DEFAULT '',
  UNIQUE(study_id, day_number)
);

ALTER TABLE public.study_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Study days viewable by all" ON public.study_days;
CREATE POLICY "Study days viewable by all" ON public.study_days
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can create study days" ON public.study_days;
CREATE POLICY "Leaders can create study days" ON public.study_days
  FOR INSERT TO authenticated WITH CHECK (is_leader());

-- ─── Study Enrollments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.bible_studies(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(user_id, study_id)
);

ALTER TABLE public.study_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrollments viewable by all" ON public.study_enrollments;
CREATE POLICY "Enrollments viewable by all" ON public.study_enrollments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can enrol themselves" ON public.study_enrollments;
CREATE POLICY "Users can enrol themselves" ON public.study_enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unenrol themselves" ON public.study_enrollments;
CREATE POLICY "Users can unenrol themselves" ON public.study_enrollments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Study Progress ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.bible_studies(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  reflection text,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, study_id, day_number)
);

ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own progress" ON public.study_progress;
CREATE POLICY "Users can see own progress" ON public.study_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.study_progress;
CREATE POLICY "Users can insert own progress" ON public.study_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.study_progress;
CREATE POLICY "Users can update own progress" ON public.study_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ─── Gallery Albums ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Albums viewable by all" ON public.gallery_albums;
CREATE POLICY "Albums viewable by all" ON public.gallery_albums
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can create albums" ON public.gallery_albums;
CREATE POLICY "Leaders can create albums" ON public.gallery_albums
  FOR INSERT TO authenticated WITH CHECK (is_leader());

-- ─── Gallery Photos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photos viewable by all" ON public.gallery_photos;
CREATE POLICY "Photos viewable by all" ON public.gallery_photos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can upload photos" ON public.gallery_photos;
CREATE POLICY "Users can upload photos" ON public.gallery_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can delete own photos, leaders can delete any" ON public.gallery_photos;
CREATE POLICY "Users can delete own photos, leaders can delete any" ON public.gallery_photos
  FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR is_leader());

-- ─── Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own messages" ON public.messages;
CREATE POLICY "Users can see own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- ─── Resources ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Teaching',
  type text NOT NULL DEFAULT 'article' CHECK (type IN ('article', 'video')),
  thumbnail text,
  description text DEFAULT '',
  why_it_matters text,
  next_step text,
  link text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources viewable by all" ON public.resources;
CREATE POLICY "Resources viewable by all" ON public.resources
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Leaders can manage resources" ON public.resources;
CREATE POLICY "Leaders can manage resources" ON public.resources
  FOR ALL TO authenticated USING (is_leader());

-- ─── Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Badges ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '✦',
  category text NOT NULL DEFAULT 'milestones',
  threshold integer DEFAULT 1
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges viewable by all" ON public.badges;
CREATE POLICY "Badges viewable by all" ON public.badges
  FOR SELECT TO authenticated USING (true);

-- ─── User Badges ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges viewable by all" ON public.user_badges;
CREATE POLICY "User badges viewable by all" ON public.user_badges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "System can insert badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ─── Follow-Up Notes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follow_up_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'Texted',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.follow_up_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaders can view follow-up notes" ON public.follow_up_notes;
CREATE POLICY "Leaders can view follow-up notes" ON public.follow_up_notes
  FOR SELECT TO authenticated USING (is_leader());

DROP POLICY IF EXISTS "Leaders can create follow-up notes" ON public.follow_up_notes;
CREATE POLICY "Leaders can create follow-up notes" ON public.follow_up_notes
  FOR INSERT TO authenticated WITH CHECK (is_leader());

-- ─── Seed Badges ────────────────────────────────────────────
INSERT INTO public.badges (slug, title, description, icon, category, threshold) VALUES
  ('first-post', 'First Word', 'Shared your first post', '💬', 'community', 1),
  ('five-posts', 'Faithful Voice', 'Shared 5 posts', '🗣️', 'community', 5),
  ('first-prayer', 'Prayer Starter', 'Submitted first prayer request', '🙏', 'prayer', 1),
  ('prayer-warrior-10', 'Prayer Warrior', 'Prayed for 10 requests', '⚔️', 'prayer', 10),
  ('prayer-warrior-50', 'Intercessor', 'Prayed for 50 requests', '👑', 'prayer', 50),
  ('first-study', 'Student of the Word', 'Completed first study day', '📖', 'study', 1),
  ('study-streak-7', 'Faithful Learner', 'Completed a 7-day study', '🎓', 'study', 7),
  ('first-event', 'Gathered Together', 'Attended first event', '🤝', 'events', 1),
  ('five-events', 'Committed Sister', 'Attended 5 events', '💛', 'events', 5),
  ('profile-complete', 'Open Book', 'Completed full profile', '📝', 'milestones', 1),
  ('one-month', 'Rooted', '1 month in community', '🌱', 'milestones', 1),
  ('six-months', 'Flourishing', '6 months in community', '🌿', 'milestones', 1),
  ('first-comment', 'Encourager', 'Left first comment', '💭', 'community', 1),
  ('ten-comments', 'Voice of Wisdom', 'Left 10 comments', '✨', 'community', 10)
ON CONFLICT (slug) DO NOTHING;

-- ─── Storage Buckets ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT DO NOTHING;

-- Storage policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar auth upload" ON storage.objects;
CREATE POLICY "Avatar auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar auth update" ON storage.objects;
CREATE POLICY "Avatar auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Post images public read" ON storage.objects;
CREATE POLICY "Post images public read" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Post images auth upload" ON storage.objects;
CREATE POLICY "Post images auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Gallery public read" ON storage.objects;
CREATE POLICY "Gallery public read" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Gallery auth upload" ON storage.objects;
CREATE POLICY "Gallery auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Gallery auth delete" ON storage.objects;
CREATE POLICY "Gallery auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery');

-- ─── Enable Realtime ────────────────────────────────────────
-- Using DO block to safely add tables that might already be in the publication
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'posts','comments','reactions','messages','prayer_requests',
    'prayer_responses','notifications','rsvps','events',
    'gallery_photos','user_badges','profiles'
  ])
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
    END;
  END LOOP;
END $$;
