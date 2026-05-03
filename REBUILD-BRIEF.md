# Titus 2:4 — Rebuild Brief

This document is everything the next conversation (or developer) needs to rebuild the Titus 2:4 app from scratch. Hand this to a fresh chat as the starting point.

---

## 1. What Titus 2:4 is

A faith-rooted **digital sisterhood for women** — a place to pray together, encourage one another, study Scripture, and grow together in God's design for love and marriage. The name comes from Titus 2:4: *"That they may teach the young women to be sober, to love their husbands, to love their children..."*

**Audience:** Women across cities and life-stages — single, engaged, married, mothering. International (UK, US, Caribbean, beyond).

**Tone:** Warm, sisterly, scripture-rich. The app refers to users as "sister." Encouragement, never judgment.

**Owner / single admin:** Denise Parris (`dparris2@googlemail.com`). She owns multiple sister apps (Temple Keepers, Totenga, SongShare) — Titus 2:4 is its **own separate Supabase project**, do not assume infrastructure is shared.

---

## 2. The brand

**Palette** (verified from the existing app's CSS):
- **Rose / primary:** `#E8668A` — main brand colour, buttons, accents
- **Soft pink:** `#F78DA7` — secondary accents
- **Pink wash:** `#FCE7EE` — section backgrounds, callouts
- **Sage green:** `#AAC4AA` — secondary brand, "tip" callouts
- **Sage wash:** `#EDF3ED` — calm-tone backgrounds
- **Cream:** `#FFFBF9` — page background
- **Wine / dark text:** `#3D1F2A`
- **Muted text:** `#8B6F75`
- **Gold:** `#C9A45A` — celebration accents (events, badges)

**Typography:**
- Display headings: a serif (Georgia / Times-style)
- Body: system sans-serif

**Voice:**
- "Hello, sister." — never "Hi user"
- Scripture references in callouts (Proverbs 31:25, Jeremiah 29:11, Psalm 121:8 are signature)
- Encourage failures gracefully ("Couldn't do X. Please try again.")
- Toasts say what actually went wrong, not generic "Failed."

---

## 3. Tech stack (the previous build used)

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Vite + React 19 + TypeScript | Working well; keep |
| Styling | Tailwind CSS 3 | With CSS variables for theming |
| Routing | `react-router-dom` v7, **`HashRouter`** | ⚠️ This caused major auth bugs (see §8). Strongly consider `BrowserRouter` instead with Vercel rewrite rule (already in `vercel.json`). |
| Auth + DB | Supabase (Postgres, Auth, Storage, Realtime) | Single project. PKCE flow required. |
| Email sending | Resend, via Supabase SMTP | DNS records (SPF/DKIM/DMARC) already verified for `titus24.app` |
| Hosting | Vercel | Project already linked: `prj_SbP1OTOLZelC9nXlhNZV42uMy6oI` |
| Icons | `lucide-react` | Clean, lightweight |
| Dates | `date-fns` | Local timezone parsing required for date-only fields (`'YYYY-MM-DD'`) — see §8 |

---

## 4. Features — the full app

All of these existed and worked in the previous build. Specify which ones the rebuild keeps.

### Auth & onboarding
- **Sign up** — email + password + first name. Email verification required.
- **Sign in** — email + password.
- **Forgot password** — email a reset link, user lands on a **dedicated "Set new password" screen** (not just signed in). Password change flow uses Supabase's `PASSWORD_RECOVERY` event.
- **Onboarding** — after signup, ask for city + country (one is enough), optional profile photo. Profile is incomplete until at least one is set.
- **Banned / removed** — admins can ban (shows a "Suspended" screen with reason and sign-out) or remove (auto-signs out).

### Home
- Today's devotional card at top
- "This Week" feed — mixed stream of recent posts, prayer requests, upcoming events (within 3 days), birthdays/anniversaries this week, notifications
- Upcoming events list

### Daily Devotional
- Theme, scripture (text + reference), reflection, affirmation, closing prayer
- "I've Read Today's Devotional" button — awards points, marked complete for the day
- Admins can add new devotionals (one per date)

### Community feed
- Sisters share posts (text + optional image)
- Reactions (heart, praise, amen, hug — 4-6 emoji-style)
- Threaded comments with replies
- Pin posts (admin)
- Image upload via Supabase Storage

### Prayer Wall
- Submit a prayer request, choose a **category** (Health, Family, Marriage, Guidance, Praise, Other)
- Optional **anonymous** mode (hides name, prayer still visible)
- Other sisters tap "praying hands" → notifies the author
- Optional encouragement note alongside the prayer reaction
- Mark as "Answered" → moves to Praise Reports view

### Groups (formerly "Pods")
- Tab UI: My Groups / Browse Groups
- Sisters can be in **multiple** groups
- Each group has its own discussion feed (posts/check-ins, reactions, member list)
- **Public groups** browsable; **private groups** invite-only
- Join, leave, member count, full/available status
- Leaders can't leave — they ask an admin to remove them

### Events
- Date, time, **timezone** (admin chooses; default Trinidad time AST)
- Users see event in original timezone PLUS their local equivalent
- RSVP (Going / Maybe / Can't make it)
- Optional reminder (notification N hours before)
- Attendance tracking (admin marks who attended)

### Bible Study
- Multi-day guided studies
- Each day has a scripture, reflection, journal prompt
- Enrol → mark days complete → optional reflection notes (private)
- Multiple studies can run in parallel

### Gallery
- Photo albums (often tied to an event)
- Upload photos with optional captions
- Tap to view full-size

### Messages (DMs)
- 1-on-1 conversations between sisters
- Realtime delivery (Supabase Realtime)
- Read receipts
- Open from a sister's profile via "Send Message" button

### Profile
- View/edit your own (photo, name, city, about, prayer focus, favourite verse)
- View other sisters' profiles via Directory or by tapping their avatar
- Light/dark theme toggle
- Earned badges display

### Notifications
- Bell icon with unread count
- Reactions, comments, replies, prayers, messages, badges, announcements, study reminders
- Tap to jump to the source

### Directory
- All sisters listed with their city
- Tap → view profile
- Search by name

### Search
- Global search across posts, prayer requests, profiles, events

### Resources
- Curated library: books, podcasts, sermons, articles
- Categorised; admin-managed

### Ask Elders
- Sisters submit private questions to leadership
- Elders reply privately

### Prayer Partners
- Admin shuffles members into prayer pairs
- Each partner sees the other's name, city, prayer focus
- "Send a Message" opens DM with that partner

### Leaderboard
- Points & badges
- Encouragement of consistent showing-up: streak for daily check-in, devotional reads, comments, prayers

### Daily Check-in
- Simple "I'm here today" button, tracks streak, awards points

### Guide
- In-app help / FAQ — short pages on how to use each feature
- Admin-editable

### Admin Dashboard (admin role only)
- Members management (view, role change, ban/unban)
- Posts moderation (delete, pin)
- Prayer requests moderation
- Attendance recording
- Follow-up notes (admins keep notes per sister)
- Bible study creation
- Resources management
- Events creation/editing
- Announcements (broadcast notifications)
- Devotionals (per-date)
- Members directory/search
- Mentor / mentee assignment
- Pods / Groups management (create, set visibility, max members, manual member assignment, auto-assign all unassigned)
- Guide sections (CMS)
- Email broadcast (audience: all, leaders, members; logs sent)
- Celebrations calendar (monthly grid view of birthdays + anniversaries)

### Roles
- `member` — default
- `elder` — leadership tier (publicly badged "Elder")
- `admin` — full access to dashboard. **Publicly displayed as "Elder"** everywhere except the admin dashboard itself (privacy convention).

---

## 5. Database schema (essentials)

All tables in `public` schema with **Row-Level Security enabled**. The previous build had ~25 tables; the important ones:

| Table | Purpose | Notable columns |
|---|---|---|
| `profiles` | User profile, role, ban status | `id` (uuid, FK to auth.users), `role`, `status`, `area`, `city`, `country`, `theme` |
| `posts` | Community feed | `author_id`, `content`, `image_url`, `is_pinned` |
| `comments` | Post comments | `post_id`, `parent_id` (for replies), `author_id`, `content` |
| `reactions` | Post reactions | `post_id`, `user_id`, `type` |
| `prayer_requests` | Prayer Wall | `author_id`, `content`, `category`, `is_anonymous`, `is_answered`, `answered_at` |
| `prayer_responses` | "Praying for you" + encouragement | `prayer_request_id`, `user_id`, `content` |
| `events` | Events | `date`, `time`, `timezone`, `title`, `description`, `location` |
| `rsvps`, `event_reminders`, `attendance` | Event peripherals | |
| `bible_studies`, `study_days`, `study_progress`, `study_enrollments` | Bible Study | |
| `gallery_albums`, `gallery_photos` | Gallery | |
| `messages` | DMs | `sender_id`, `receiver_id`, `content`, `read_at` |
| `notifications` | In-app notifications | `user_id`, `type`, `title`, `body`, `link`, `is_read` |
| `daily_devotionals` | Per-date devotional content | `date`, `theme`, `scripture_text`, `scripture_ref`, `reflection`, `affirmation`, `prayer` |
| `devotional_reads` | Daily read tracking | `user_id`, `date` (UNIQUE constraint on this pair) |
| `badges`, `user_badges` | Achievement system | |
| `pods`, `pod_members`, `pod_checkins` | Groups | `pods.visibility` ('public'/'private'), `pods.max_members` |
| `resources` | Resource library | |
| `follow_up_notes` | Admin notes per member | |
| `guide_sections` | In-app help CMS | |
| `testimonies`, `testimony_celebrations` | Praise reports + reactions | |

**Storage buckets** (public): `avatars`, `gallery`, `post-images`. Files served via public URL, no need for SELECT policies on `storage.objects` (those just enable listing, which the app doesn't need).

---

## 6. Infrastructure already provisioned (DO NOT recreate)

**Don't ask the user to redo any of this.** It exists and works.

### Domain
- `titus24.app` — registered with **GoDaddy**
- DNS managed at **SiteGround**
- DNS records currently set up:
  - SPF (verified, Resend) — `v=spf1 include:amazonses.com ~all` on `send.titus24.app`
  - DKIM (verified, Resend) — `resend._domainkey` TXT
  - MX (Resend bounce handling) on `send.titus24.app`
  - DMARC — `_dmarc` TXT: `v=DMARC1; p=none; aspf=r; adkim=r;`

### Vercel
- Project ID: `prj_SbP1OTOLZelC9nXlhNZV42uMy6oI`
- Team: `team_4yOGxbMSUXPGpXpUwlXLiWDl`
- **Production deploys from the `main` branch**
- Domains attached: `titus24.app`, `www.titus24.app`, `titus24.vercel.app`
- Currently `www.titus24.app` is the primary; apex `titus24.app` not fully working (needs DNS check)

### Supabase
- Project ID: `nbkvtvposonkeuufplzt`
- Project name: "Titus 2:4"
- Region: eu-west-1
- This is a **dedicated** project — separate from Temple Keepers / Totenga / SongShare
- All schema and RLS policies live here

### Resend
- Domain `titus24.app` verified
- API key created and stored in Supabase SMTP settings
- Supabase Auth → Emails → SMTP Settings has:
  - Host `smtp.resend.com`, Port 465, Username `resend`, Password = API key
  - Sender: `noreply@titus24.app`, Sender name: Titus 2:4

### Email templates (all 5 customised — already saved in Supabase)
- **Confirm signup** — warm welcome, Jeremiah 29:11
- **Reset password** — Proverbs 31:25
- **Magic link** — Psalm 121:8
- **Change email address** — Proverbs 16:9
- **Invite user** — Proverbs 27:17
- **Reauthentication** — Psalm 46:10

All use the same shell: rose top band, Titus 2:4 wordmark, Georgia headings, sage tip card, footer with "With love and prayers, The Titus 2:4 Sisterhood."

The HTML for these is in the conversation history, but if needed, ask the user to copy them from the existing Supabase project.

### Supabase URL Configuration (must be set)
- **Site URL:** `https://www.titus24.app`
- **Redirect URLs allowlist:**
  - `https://www.titus24.app/**`
  - `https://titus24.app/**`
  - `https://titus24.vercel.app/**`
  - `http://localhost:5173/**`

---

## 7. Critical auth requirements (don't get this wrong again)

This is where the previous build kept breaking. Whichever framework you rebuild in, **make sure these requirements are met from day one**:

1. **Use PKCE flow** — `flowType: 'pkce'` in the Supabase client config. Recovery tokens then arrive as `?code=...` query params instead of `#access_token=...` hash.

2. **If using HashRouter:** PKCE is *required* because hash routes and Supabase implicit-flow tokens both want the URL hash and clobber each other. **Strongly recommend BrowserRouter** instead — it sidesteps this whole class of bugs. (`vercel.json` already has the SPA rewrite rule for it.)

3. **Listen for the `PASSWORD_RECOVERY` auth event.** When it fires, render a dedicated password-change screen *ahead of any other routing*. Don't let the user "into the app" before they've set a new password.

4. **Persist the recovery flag in `sessionStorage`.** The `PASSWORD_RECOVERY` event only fires once on URL hash detection — if the user refreshes the password-change page, the flag is lost unless persisted.

5. **Always destructure `{ error }` from Supabase mutations** and surface it to the user. The previous build had ~30 silent failures where the UI showed "success" toasts for operations that had been denied by RLS. The pattern that worked:
   ```ts
   const failIfError = (e, action) => {
     if (e) { addToast('error', `Couldn't ${action}. ${e.message ?? ''}`); return true; }
     return false;
   };
   ```

6. **Date-only columns** (e.g. `events.date`) parsed with `new Date('YYYY-MM-DD')` give UTC midnight — wrong for any user east of UTC. Always parse such fields as local Y/M/D:
   ```ts
   const [y, m, d] = s.split('-').map(Number);
   new Date(y, m - 1, d); // local midnight
   ```

7. **SECURITY DEFINER functions need EXECUTE revoked from PUBLIC** when they're trigger-only or RLS-only helpers. Otherwise both `anon` and `authenticated` can call them from the REST API. The exception: functions actually used by the client (`award_points`, `get_member_activity_stats`) need EXECUTE granted to `authenticated`.

---

## 8. Things that went wrong in the previous build (avoid)

Honest debrief of what kept breaking:

- **HashRouter + implicit Supabase auth flow** — root cause of password reset never showing the new-password screen. Fix: PKCE, or switch to BrowserRouter.
- **Silent Supabase write failures** — RLS denials returned "0 rows affected" without throwing, the UI showed success toasts for things that didn't happen. Pattern to copy: `failIfError` helper, applied consistently.
- **Hard-coded `'Admin'` badge in Pods** breaking the "admin → Elder" public-facing convention. Use a single shared `publicRole(role)` util and call it everywhere user-facing.
- **`window.history.replaceState({}, '')`** used to clear router state — React Router v7 doesn't observe it, so the location.state stays set and effects re-fire. Use `useNavigate(path, { state: null })`.
- **`addPodMember` switched to non-throwing** while AdminDashboard's `handleAutoAssign` still expected a throw — admin saw inflated "N members assigned" counts. Lesson: changing a function's contract requires checking every caller.
- **Auth recovery state** lost on page refresh because `PASSWORD_RECOVERY` only fires once. Lesson: persist any "session-mode" flags in `sessionStorage`.
- **`devotional_reads` insert** failed when the user double-tapped because of unique constraint on `(user_id, date)`. Use `upsert` with `onConflict: 'user_id,date', ignoreDuplicates: true`.
- **Branch confusion** — Vercel deploys from `main`, the previous Claude was pushing to `master`. Set up `main` as the only working branch from day one, or configure Vercel to deploy from whatever branch you actually use.

---

## 9. Recommended rebuild approach

Suggested order (a fresh chat could follow this):

1. **Set up project skeleton**: Vite + React + TypeScript + Tailwind + react-router (BrowserRouter — see §7) + supabase-js. Use the existing Supabase project (don't create a new one — schema is already there).
2. **Wire auth correctly**: PKCE flow, password recovery handler with sessionStorage persistence. Test forgot-password end-to-end before building anything else.
3. **Build the layout shell**: brand colours as CSS variables, top nav + bottom nav, dark/light theme, toast system, error boundaries on every route.
4. **Build features in this order** (each one fully working before the next):
   - Profile + Onboarding
   - Home (devotional + this-week feed)
   - Community feed
   - Prayer Wall
   - Events
   - Groups
   - Bible Study
   - Messages
   - Gallery, Resources, Directory, Search, Notifications, Profile, Leaderboard
   - Admin Dashboard
5. **Don't ship admin features and member features at the same time.** Member experience first, admin second.
6. **For every Supabase mutation**: destructure error, toast on failure, only update local state on success. No exceptions.
7. **Keep the same database schema.** Don't migrate; the data is already there.
8. **Reuse the existing email templates and DNS — don't rebuild.**

---

## 10. Starter prompt for the new chat

Copy and paste this into a fresh Claude conversation as your opening message:

> I'm rebuilding my web app **Titus 2:4** from scratch. It's a digital sisterhood for women — faith, prayer, community, marriage. The previous build accumulated too many issues across auth, error handling, and routing, and I want a clean foundation.
>
> I have a complete spec at `C:\Users\sagac\Titus24\REBUILD-BRIEF.md` — please read that first as your starting context. It covers the brand, full feature list, database schema, infrastructure already in place (Vercel, Supabase, Resend, DNS), and seven critical auth/data lessons from the previous build.
>
> **Don't recreate any infrastructure** — Supabase project, Resend, DNS records, email templates, and Vercel project all exist and work. Reuse them.
>
> Start by reading the brief, asking me any clarifying questions about scope or priorities, then propose a step-by-step rebuild plan starting with auth (which is where the previous build kept breaking).

---

## What's currently committed to the live repo

Everything in `C:\Users\sagac\Titus24` on branch `main` is the previous build's most recent state, including all of today's incremental fixes (silent-error sweep, password recovery flow, security patches, Pods/Groups overhaul). You can either:

- **Keep this repo, start a new branch off `main`**, build the rebuild there, and switch Vercel to deploy from it once ready
- Or **start a fresh repo** and migrate the database schema to a new Supabase project (more work, not recommended)

Recommendation: keep this repo. The git history is your safety net.

---

*Last updated: 2026-05-03. Rebuild brief generated after a long, painful session. The pain wasn't wasted — it produced this document.*
