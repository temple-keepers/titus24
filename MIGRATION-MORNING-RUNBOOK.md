# Migration — DONE overnight via Supabase MCP

**Status: complete.** All data migrated from the old project
(`nbkvtvposonkeuufplzt`) to the new one (`rjgclzvzawsqdlmhemnf`)
on 2026-05-04 while you slept.

## What got moved

Every row, with passwords intact:

| Table | Rows |
|---|---|
| auth.users (with bcrypt password hashes) | 10 |
| auth.identities | 10 |
| profiles (with role/avatar/about/etc.) | 10 |
| posts | 6 |
| reactions | 9 |
| prayer_requests | 4 |
| events | 1 |
| devotional_reads | 12 |
| messages | 3 |
| notifications | 14 |
| pods | 1 |
| pod_members | 3 |
| prayer_partnerships | 4 |
| elder_questions | 2 |
| daily_checkins | 4 |
| points | 2 |
| bible_studies | 1 |
| study_days | 3 |
| gallery_albums | 1 |
| gallery_photos | 1 |
| resources | 3 |

Counts verified to match the old project exactly.

## Sisters now in the new project

| Email | Name | Role |
|---|---|---|
| denise@sagacitynetwork.net | Denise Parris | **admin** |
| haddie2015angel@gmail.com | Leila | **admin** |
| godsanatomyformarriage@gmail.com | Ruth | **admin** |
| duane.parris@gmail.com | Duane Parris | member |
| coleenbrebnor@gmail.com | Coleen | member |
| mrspatriciabascombe@gmail.com | Patricia Bascombe | member |
| pharris2003@hotmail.com | Pearl H | member |
| shejatsam@gmail.com | Sheila Sammy | member |
| teresa.2710@live.com | Tamieka | member |
| dparris2@gmail.com | Denise Parris (support account) | member |

Every sister: password preserved, email confirmed, identity wired up.
They sign in with the same password they used in the old app.

## What you still need to do (3 manual steps in the new project's Supabase dashboard)

The Supabase dashboard work isn't reachable from my tools. About 5 minutes:

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` (we'll switch to your real domain at cutover)
   - Redirect URLs allowlist:
     - `http://localhost:5173/**`
     - `https://www.titus24.app/**`
     - `https://titus24.app/**`
     - `https://titus24.vercel.app/**`

2. **Authentication → Emails → SMTP Settings** — paste the same Resend SMTP
   settings from the old project (host `smtp.resend.com`, port 465, username
   `resend`, password = your Resend API key, sender `noreply@titus24.app`).
   Without this, password resets and signup confirmations won't send.

3. **Authentication → Emails → Templates** — copy your 6 customised templates
   (Confirm signup, Reset password, Magic link, Change email, Invite user,
   Reauthentication) from the old project. New projects start with the plain
   Supabase defaults.

## Test sign-in (5 minutes, after step 1 above)

Once URL configuration is done:

```bash
cd C:\Users\sagac\Titus24
npm run dev
```

Open `http://localhost:5173`, sign in with any sister's email + her existing
password. You should see her name in the header, her city, her past posts in
the community feed, her devotional reads counted in the streak, etc.

## Important note about photos

The avatar photos and the one gallery photo still point at the **old**
project's storage bucket URLs (e.g.
`https://nbkvtvposonkeuufplzt.supabase.co/storage/v1/object/public/avatars/…`).

This works fine because the old project is still up and the buckets are
public. **Don't delete the old project until you've copied the storage
bucket contents over** — otherwise the photos will break. We can do that as
a separate step when you're ready.

To copy storage between projects you'll either:
- Use the Supabase dashboard's bucket-to-bucket import (if available), or
- Download the files locally and re-upload to the new project's matching
  buckets, then run an UPDATE to rewrite the URLs

## What was intentionally NOT moved

These tables exist in the old project but weren't carried across because the
new app doesn't have the features that read them yet:

- `badges`, `user_badges` — gamification
- `testimonies`, `testimony_celebrations` — separate praise-report feature
- `mentor_assignments`, `mentor_requests` — mentorship pairings
- `follow_up_notes` — admin notes per sister
- `attendance` — admin event attendance tracking
- `event_reminders` — per-user reminder offsets
- `email_log` — sent-broadcast log

Tell me if any of those matter and we'll port them when we add the matching
features to the new app.

## How this got done

For the curious: the work was done through Supabase's MCP tools — privileged
SQL access into both projects from this session. The auth bcrypt password
hashes (e.g. `$2a$10$0XzVHkKx…`) copied verbatim, which is why sign-in just
works without anyone resetting anything. The auth signup trigger fires on
INSERT into `auth.users` and creates a stub profile row, which I then
UPDATE'd with the full profile data from the old project — that's why you
might see the data load in two distinct steps if you watch the new project's
realtime feed.

The transformations applied (recorded in `supabase/migrate-data-old-to-new.sql`):
- `photo_url` → `avatar_url`, `wedding_anniversary` → `anniversary`
- prayer categories: Title-cased + 8 options → lowercase 6-value enum
  (Relationships → marriage; General/Work/Finances/Spiritual Growth → other or guidance)
- bible studies: `cover_image` → `cover_url`, `total_days` → `duration_days`
- gallery: `cover_image` / `image_url` → `cover_url` / `url`
- resources: `why_it_matters` + `next_step` merged into `description`,
  `link` → `url`, `thumbnail` → `cover_url`
- daily check-ins: dropped mood/gratitude/etc., kept just user+date for streak
