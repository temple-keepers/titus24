-- =============================================================
-- Old (nbkvtvposonkeuufplzt) → New (rjgclzvzawsqdlmhemnf)
-- DATA-ONLY migration script (run AFTER auth.users is restored)
--
-- This file contains the column translations the rebuild needs.
-- Old project uses photo_url / wedding_anniversary / etc.;
-- new project uses avatar_url / anniversary / etc.
--
-- ⚠️  Run on the NEW project, against an `old` schema that
-- contains the dumped tables from the old project. The morning
-- runbook explains how to set that up.
-- =============================================================

-- ─── 1. Profiles ─────────────────────────────────────────────
-- Old role default 'lady' is invalid — coerce to 'member'.
INSERT INTO public.profiles (
  id, email, first_name, last_name, display_name, avatar_url,
  about, prayer_focus, area, city, country, role, status,
  theme, banned_reason, birthday, anniversary, created_at
)
SELECT
  id,
  email,
  NULLIF(first_name, ''),
  last_name,
  COALESCE(NULLIF(first_name, ''), email),  -- display_name fallback
  photo_url,
  about,
  prayer_focus,
  area,
  city,
  country,
  CASE WHEN role IN ('member','elder','admin') THEN role ELSE 'member' END,
  COALESCE(status, 'active'),
  COALESCE(theme, 'light'),
  banned_reason,
  birthday,
  wedding_anniversary,
  created_at
FROM old.profiles
ON CONFLICT (id) DO UPDATE SET
  first_name      = EXCLUDED.first_name,
  last_name       = EXCLUDED.last_name,
  display_name    = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
  avatar_url      = EXCLUDED.avatar_url,
  about           = EXCLUDED.about,
  prayer_focus    = EXCLUDED.prayer_focus,
  area            = EXCLUDED.area,
  city            = EXCLUDED.city,
  country         = EXCLUDED.country,
  role            = EXCLUDED.role,
  status          = EXCLUDED.status,
  theme           = EXCLUDED.theme,
  banned_reason   = EXCLUDED.banned_reason,
  birthday        = EXCLUDED.birthday,
  anniversary     = EXCLUDED.anniversary;

-- ─── 2. Posts ────────────────────────────────────────────────
INSERT INTO public.posts (id, author_id, content, image_url, is_pinned, created_at)
SELECT id, author_id, content, image_url, is_pinned, COALESCE(created_at, "timestamp")
FROM old.posts
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Comments ─────────────────────────────────────────────
INSERT INTO public.comments (id, post_id, parent_id, author_id, content, created_at)
SELECT id, post_id, parent_id, author_id, content, COALESCE(created_at, "timestamp")
FROM old.comments
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Reactions ────────────────────────────────────────────
-- Old types: 'amen','heart','praise','strength','fire'
-- New types: 'heart','praise','amen','hug','pray','celebrate'
INSERT INTO public.reactions (id, post_id, user_id, type, created_at)
SELECT
  id, post_id, user_id,
  CASE type
    WHEN 'amen'     THEN 'amen'
    WHEN 'heart'    THEN 'heart'
    WHEN 'praise'   THEN 'praise'
    WHEN 'strength' THEN 'pray'
    WHEN 'fire'     THEN 'celebrate'
    ELSE 'heart'
  END,
  created_at
FROM old.reactions
ON CONFLICT (post_id, user_id, type) DO NOTHING;

-- ─── 5. Prayer Requests ──────────────────────────────────────
-- Old categories use Title Case + extra options; map to new lowercase set.
INSERT INTO public.prayer_requests (
  id, author_id, content, category, is_anonymous,
  is_answered, answered_at, created_at
)
SELECT
  id, author_id, content,
  CASE LOWER(category)
    WHEN 'health'            THEN 'health'
    WHEN 'family'            THEN 'family'
    WHEN 'relationships'     THEN 'marriage'
    WHEN 'spiritual growth'  THEN 'guidance'
    WHEN 'finances'          THEN 'guidance'
    WHEN 'work'              THEN 'guidance'
    ELSE 'other'
  END,
  is_anonymous,
  is_answered,
  answered_at,
  created_at
FROM old.prayer_requests
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Prayer Responses ─────────────────────────────────────
INSERT INTO public.prayer_responses (id, prayer_request_id, user_id, content, created_at)
SELECT id, prayer_request_id, user_id, content, created_at
FROM old.prayer_responses
ON CONFLICT (id) DO NOTHING;

-- ─── 7. Events ───────────────────────────────────────────────
INSERT INTO public.events (
  id, title, description, date, time, timezone, location, created_by, created_at
)
SELECT
  id, title,
  CASE
    WHEN what_to_bring IS NOT NULL AND what_to_bring <> ''
      THEN description || E'\n\nTo bring: ' || what_to_bring
    ELSE description
  END,
  date, time, timezone, location, created_by, COALESCE(created_at, now())
FROM old.events
ON CONFLICT (id) DO NOTHING;

-- ─── 8. RSVPs ────────────────────────────────────────────────
-- Old status: 'coming','maybe','no' → New: 'going','maybe','cant'
INSERT INTO public.rsvps (id, event_id, user_id, status, created_at)
SELECT
  id, event_id, user_id,
  CASE status
    WHEN 'coming' THEN 'going'
    WHEN 'maybe'  THEN 'maybe'
    WHEN 'no'     THEN 'cant'
  END,
  created_at
FROM old.rsvps
ON CONFLICT (event_id, user_id) DO NOTHING;

-- ─── 9. Daily Devotionals ────────────────────────────────────
INSERT INTO public.daily_devotionals (
  id, date, theme, scripture_text, scripture_ref, reflection,
  affirmation, prayer, created_by, created_at
)
SELECT
  id, date, theme,
  COALESCE(scripture_text, ''),
  COALESCE(scripture_ref, ''),
  COALESCE(reflection, ''),
  COALESCE(affirmation, ''),
  COALESCE(prayer, ''),
  created_by,
  COALESCE(created_at, now())
FROM old.daily_devotionals
ON CONFLICT (date) DO NOTHING;

-- ─── 10. Devotional Reads ────────────────────────────────────
INSERT INTO public.devotional_reads (user_id, date, created_at)
SELECT user_id, date, COALESCE(created_at, now())
FROM old.devotional_reads
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 11. Bible Studies ───────────────────────────────────────
-- cover_image → cover_url, total_days → duration_days
INSERT INTO public.bible_studies (id, title, description, cover_url, duration_days, created_at)
SELECT id, title, description, cover_image, total_days, created_at
FROM old.bible_studies
ON CONFLICT (id) DO NOTHING;

-- ─── 12. Study Days ──────────────────────────────────────────
-- Old has `title` (drop), `reflection_prompt` → `journal_prompt`,
-- old `reflection_prompt` becomes `reflection` since old has no
-- separate reflection field.
INSERT INTO public.study_days (
  id, study_id, day_number, scripture_text, scripture_ref,
  reflection, journal_prompt
)
SELECT
  id, study_id, day_number,
  COALESCE(scripture_text, ''),
  scripture_ref,
  COALESCE(reflection_prompt, ''),
  reflection_prompt
FROM old.study_days
ON CONFLICT (study_id, day_number) DO NOTHING;

-- ─── 13. Study Progress ──────────────────────────────────────
-- Old key: (user_id, study_id, day_number) → JOIN to find study_day_id.
INSERT INTO public.study_progress (user_id, study_day_id, completed_at)
SELECT
  sp.user_id,
  sd.id,
  COALESCE(sp.completed_at, now())
FROM old.study_progress sp
JOIN public.study_days sd
  ON sd.study_id = sp.study_id AND sd.day_number = sp.day_number
ON CONFLICT (user_id, study_day_id) DO NOTHING;

-- ─── 14. Gallery Albums ──────────────────────────────────────
-- cover_image → cover_url, drop created_by
INSERT INTO public.gallery_albums (id, title, description, event_id, cover_url, created_at)
SELECT id, title, description, event_id, cover_image, created_at
FROM old.gallery_albums
ON CONFLICT (id) DO NOTHING;

-- ─── 15. Gallery Photos ──────────────────────────────────────
-- image_url → url
INSERT INTO public.gallery_photos (id, album_id, url, caption, uploaded_by, created_at)
SELECT id, album_id, image_url, caption, uploaded_by, created_at
FROM old.gallery_photos
ON CONFLICT (id) DO NOTHING;

-- ─── 16. Resources ───────────────────────────────────────────
-- Old has many fields; merge why_it_matters + next_step into description.
INSERT INTO public.resources (id, title, category, description, url, cover_url, created_at)
SELECT
  id, title, category,
  TRIM(BOTH E'\n' FROM
    COALESCE(description, '') ||
    CASE WHEN why_it_matters IS NOT NULL AND why_it_matters <> ''
         THEN E'\n\nWhy it matters: ' || why_it_matters ELSE '' END ||
    CASE WHEN next_step IS NOT NULL AND next_step <> ''
         THEN E'\n\nNext step: ' || next_step ELSE '' END
  ),
  link,
  thumbnail,
  COALESCE(created_at, now())
FROM old.resources
ON CONFLICT (id) DO NOTHING;

-- ─── 17. Messages ────────────────────────────────────────────
INSERT INTO public.messages (id, sender_id, receiver_id, content, read_at, created_at)
SELECT id, sender_id, receiver_id, content, read_at, COALESCE(created_at, "timestamp")
FROM old.messages
ON CONFLICT (id) DO NOTHING;

-- ─── 18. Notifications ───────────────────────────────────────
INSERT INTO public.notifications (
  id, user_id, type, title, body, link, is_read, created_at
)
SELECT id, user_id, type, title, body, link, is_read, created_at
FROM old.notifications
ON CONFLICT (id) DO NOTHING;

-- ─── 19. Pods + Pod Members + Pod Checkins ───────────────────
INSERT INTO public.pods (
  id, name, description, visibility, max_members, created_by, is_active, created_at
)
SELECT
  id, name, description,
  COALESCE(visibility, 'public'),
  COALESCE(max_members, 12),
  created_by,
  COALESCE(is_active, true),
  COALESCE(created_at, now())
FROM old.pods
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pod_members (id, pod_id, user_id, role, joined_at)
SELECT id, pod_id, user_id, role, COALESCE(joined_at, now())
FROM old.pod_members
ON CONFLICT (pod_id, user_id) DO NOTHING;

INSERT INTO public.pod_checkins (id, pod_id, user_id, content, created_at)
SELECT id, pod_id, user_id, content, COALESCE(created_at, now())
FROM old.pod_checkins
ON CONFLICT (id) DO NOTHING;

-- ─── 20. Elder Questions ─────────────────────────────────────
INSERT INTO public.elder_questions (
  id, author_id, question, category, is_answered,
  answer, answered_by, answered_at, created_at
)
SELECT
  id, author_id, question,
  COALESCE(category, 'General'),
  COALESCE(is_answered, false),
  answer, answered_by, answered_at,
  COALESCE(created_at, now())
FROM old.elder_questions
ON CONFLICT (id) DO NOTHING;

-- ─── 21. Prayer Partnerships ─────────────────────────────────
-- Drop old.is_active (new schema doesn't have it).
INSERT INTO public.prayer_partnerships (
  id, user_a_id, user_b_id, period_start, period_end, created_at
)
SELECT id, user_a_id, user_b_id, period_start, period_end, COALESCE(created_at, now())
FROM old.prayer_partnerships
ON CONFLICT (id) DO NOTHING;

-- ─── 22. Guide Sections ──────────────────────────────────────
INSERT INTO public.guide_sections (
  id, title, icon, description, content, category,
  display_order, is_active, created_by, created_at, updated_at
)
SELECT
  id, title, icon, description, content,
  COALESCE(category, 'features'),
  COALESCE(display_order, 0),
  COALESCE(is_active, true),
  created_by,
  COALESCE(created_at, now()),
  COALESCE(updated_at, now())
FROM old.guide_sections
ON CONFLICT (id) DO NOTHING;

-- ─── 23. Daily Check-ins ─────────────────────────────────────
-- Drop old.mood / gratitude / challenge / victory / prayer_need /
-- read_scripture — new schema is just "they showed up today".
INSERT INTO public.daily_checkins (user_id, date, created_at)
SELECT user_id, date, COALESCE(created_at, now())
FROM old.daily_checkins
ON CONFLICT (user_id, date) DO NOTHING;

-- ─── 24. Points ──────────────────────────────────────────────
INSERT INTO public.points (id, user_id, action, points, description, created_at)
SELECT id, user_id, action, points, COALESCE(description, ''), COALESCE(created_at, now())
FROM old.points
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- DROPPED INTENTIONALLY (no equivalent in new schema, port later
-- if you want them back):
--   - badges + user_badges (gamification — port when revisiting)
--   - testimonies + testimony_celebrations (separate from prayers)
--   - mentor_assignments + mentor_requests (mentorship feature)
--   - follow_up_notes (admin notes — port for admin)
--   - attendance (event attendance tracking — port for admin)
--   - event_reminders (per-user reminder offsets)
--   - email_log (Resend send log)
--   - study_enrollments (the new app derives enrollment from progress)
-- =============================================================

-- ─── Verification queries ────────────────────────────────────
-- After running, these should all show non-zero counts that match
-- the old project's row counts (modulo the dropped tables).
SELECT 'profiles' AS table, COUNT(*) FROM public.profiles UNION ALL
SELECT 'posts',            COUNT(*) FROM public.posts UNION ALL
SELECT 'reactions',        COUNT(*) FROM public.reactions UNION ALL
SELECT 'prayer_requests',  COUNT(*) FROM public.prayer_requests UNION ALL
SELECT 'events',           COUNT(*) FROM public.events UNION ALL
SELECT 'devotional_reads', COUNT(*) FROM public.devotional_reads UNION ALL
SELECT 'notifications',    COUNT(*) FROM public.notifications UNION ALL
SELECT 'pods',             COUNT(*) FROM public.pods UNION ALL
SELECT 'pod_members',      COUNT(*) FROM public.pod_members;
