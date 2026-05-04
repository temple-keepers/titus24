# Morning Runbook — Migrating to the new Supabase project

Plain English. Read this top to bottom before doing anything.

## What we're doing

Bringing the **10 sisters, their passwords, and all their content** (posts,
prayers, events, devotionals, groups, messages, etc.) from the old Supabase
project (`Titus 2:4`, eu-west-1) into the new one (`Titus 2:4 App`, us-east-1).

Estimated time: **30–45 minutes** start to finish, almost all of it waiting.

## What you need to have ready

1. Your computer with the project open at `C:\Users\sagac\Titus24`
2. **Both Supabase project passwords** — the database password for each
   project, NOT your Supabase login password. You can find or reset these in
   each project's *Settings → Database → Connection string → URI*.
3. About 45 minutes of uninterrupted time
4. Coffee

## Order of operations

### Step 1 — Take a backup of the OLD project (5 min)

In your browser:

1. Go to [supabase.com](https://supabase.com) and open the **old** project
   (named "Titus 2:4", URL contains `nbkvtvposonkeuufplzt`)
2. Click **Database → Backups** in the left sidebar
3. Click **Take backup** (or note that "Daily backups" already includes today)
4. Confirm a recent backup exists. **Do not skip this.**

### Step 2 — Get the database connection strings (3 min)

For BOTH projects, in *Settings → Database → Connection string*:

- Old project's connection URI → save as `OLD_DB_URL` (somewhere safe, not in git)
- New project's connection URI → save as `NEW_DB_URL`

Both URIs look like: `postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`

### Step 3 — Move the auth users (passwords come with them) (10 min)

This is the part that preserves passwords. We use Postgres's built-in `pg_dump`
tool. If you don't have `psql`/`pg_dump` installed locally, the easiest fix is
to install [Postgres.app](https://postgresapp.com) (Mac) or the Postgres
client tools for Windows.

Open a terminal (PowerShell on Windows) and run, **substituting your URIs**:

```bash
# 1. Dump auth.users + identities from old (passwords included).
pg_dump "$OLD_DB_URL" \
  --schema=auth \
  --table=auth.users \
  --table=auth.identities \
  --data-only \
  --column-inserts \
  -f auth-dump.sql

# 2. Restore it into the new project.
psql "$NEW_DB_URL" -f auth-dump.sql
```

When this finishes, every sister exists in the new project's auth system **with
her existing password**. Don't move on until this step is clean — if you see
errors, stop and tell me.

### Step 4 — Mirror the old project's data into a temporary `old` schema (10 min)

We need the new project to be able to see the old project's data side-by-side
to translate it. Same idea — `pg_dump` from old, restore into new under a
different schema name.

```bash
# 1. Dump the old public schema's data.
pg_dump "$OLD_DB_URL" \
  --schema=public \
  --data-only \
  --column-inserts \
  -f old-data.sql

# 2. Create an `old` schema on the new project that mirrors the old project's
#    public schema, then load the data into it.
pg_dump "$OLD_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner --no-privileges --no-publications \
  | sed 's/public\./old./g; s/SCHEMA public/SCHEMA old/g' \
  > old-schema.sql

psql "$NEW_DB_URL" -c "CREATE SCHEMA IF NOT EXISTS old;"
psql "$NEW_DB_URL" -f old-schema.sql
psql "$NEW_DB_URL" -f old-data.sql
```

### Step 5 — Run the translation script (1 min)

This is the SQL I prepared tonight. It walks through every table, translates
the column names, and inserts into the new project's `public` schema:

```bash
psql "$NEW_DB_URL" -f supabase/migrate-data-old-to-new.sql
```

The last query in that file prints a count for each table. Confirm those
counts match what you expected:

| Table | Expected count |
|---|---|
| profiles | 10 |
| posts | 6 |
| reactions | 9 |
| prayer_requests | 4 |
| events | 1 |
| devotional_reads | 12 |
| notifications | 14 |
| pods | 1 |
| pod_members | 3 |

### Step 6 — Drop the temporary `old` schema (1 min)

Cleanup. The new project should only show its own data.

```bash
psql "$NEW_DB_URL" -c "DROP SCHEMA old CASCADE;"
```

### Step 7 — Test sign-in with one sister's account (5 min)

Pick a sister whose password you know (probably your own admin account). On
the dev server (we'll start it together):

```bash
cd C:\Users\sagac\Titus24
npm run dev
```

Open `http://localhost:5173`, sign in with that account's email + the original
password. You should see her name, her city, her past posts, etc. If anything
is missing or broken, tell me before going further — the old project is
untouched and we can re-run.

### Step 8 — Configure auth in the new project's Supabase dashboard (5 min)

This was the leftover from yesterday. Three things in the **new** project:

- *Authentication → URL Configuration*: site URL `http://localhost:5173`
  for now. Allowlist:
  - `http://localhost:5173/**`
  - `https://www.titus24.app/**`
  - `https://titus24.app/**`
  - `https://titus24.vercel.app/**`
- *Authentication → Emails → SMTP Settings*: paste the same Resend host /
  port / username / password / sender as the old project
- *Authentication → Emails → Templates*: copy each of your 6 customised
  templates from the old project. Open each one in the old project, copy the
  HTML, paste into the new project, save.

### Step 9 — Switch Vercel to deploy from the new branch (later, when ready)

Don't do this now — your live site at titus24.app should still point at the
**old** project until you're 100% sure the rebuild is ready. When ready:

1. In Vercel, switch the production branch from `main` to `rebuild`
2. Update the production environment variables to use the new project's URL
   and anon key
3. Update site URL in the new project's Supabase Auth to `https://www.titus24.app`

## What can go wrong

- **`pg_dump` says "command not found"** — install Postgres client tools.
- **Step 3 errors on `auth.identities`** — that's OK, just remove that line
  and re-run with only `auth.users`. Identities are usually re-created on
  first sign-in.
- **Counts don't match in step 5** — tell me which table is off. The
  translation script uses `ON CONFLICT DO NOTHING` so re-running is safe.
- **Sign-in fails with "Invalid login credentials"** — could be the auth
  step didn't carry the password hashes. Tell me and we'll inspect.

## What we're explicitly NOT bringing over

These tables exist in the old project but aren't in the new app's surface
yet. They're listed at the bottom of the translation script. If you want any
of them ported, tell me which:

- `badges`, `user_badges` — gamification badges
- `testimonies`, `testimony_celebrations` — separate from prayers
- `mentor_assignments`, `mentor_requests` — mentorship pairings
- `follow_up_notes` — admin-only notes per sister
- `attendance` — admin event attendance tracking
- `email_log` — sent-broadcast log
