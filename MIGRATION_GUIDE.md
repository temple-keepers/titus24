# 🚀 Quick Migration Guide

## Step 1: Run Database Migrations

Go to your Supabase project → SQL Editor → New Query

### Run these in order:

#### 1️⃣ Fix Security Policies (CRITICAL - Run First!)
```sql
-- Copy contents of supabase/fix-rls-policies.sql
```

#### 2️⃣ Add Indexes & Performance Fixes
```sql
-- Copy contents of supabase/add-indexes-and-fixes.sql
```

## Step 2: Deploy Code Changes

All code changes are already in your files. Just deploy:

```bash
npm run build
```

## Step 3: Test Everything

Open your app and test:

✅ **Daily Devotional**: Check in and read devotional
✅ **Testimonies**: Share and celebrate testimonies
✅ **Leaderboard**: View your points and rank
✅ **Prayer Partners**: (Leaders) Try shuffling partnerships
✅ **Ask Elders**: (Leaders) Try answering a question

## That's It! 🎉

Your app is now:
- ✅ More secure
- ✅ Faster
- ✅ More reliable
- ✅ Bug-free

---

## Quick Verification Checklist

After deployment, verify these work:

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Points | Check in twice same day | Second time shows "already checked in", no duplicate points |
| Streak | Check in consecutive days | Streak increases by 1 |
| Celebrations | Toggle celebration on testimony | Count updates instantly |
| Leaderboard | View with 0 points | Shows "--" not "#0" |
| Devotional | Try to read twice | Second time says "already marked as read" |
| Partnerships (Leader) | Shuffle with 5 users | Creates 2 pairs, 1 unpaired |
| Security | Try leader action as member | Should be blocked |

---

## Need Help?

Check [FIXES_APPLIED.md](./FIXES_APPLIED.md) for detailed documentation of all changes.

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migrations ran successfully
4. Make sure you're using latest code

---

**Pro Tip**: Run migrations on a test/staging environment first if you have one!
