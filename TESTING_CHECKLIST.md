# ✅ Testing Checklist

After running all migrations, test these features:

## 🔐 Security Tests (Critical!)

### Test 1: Leader-Only Actions
- [ ] **As a regular member**: Try to shuffle prayer partnerships → Should NOT see button
- [ ] **As a regular member**: Try to answer elder questions → Should NOT see answer button
- [ ] **As a leader**: Shuffle partnerships → Should work
- [ ] **As a leader**: Answer questions → Should work

### Test 2: Rate Limiting
- [ ] Read devotional and click "I've Read Today's Devotional"
- [ ] Refresh page and try again → Should say "Already marked as read today"
- [ ] Check database: Only ONE entry in `devotional_reads` for today

## 🎯 Points System Tests

### Test 3: Check-In Points
- [ ] Daily check-in → Get +5 points
- [ ] Check database: `points` table has new entry
- [ ] Check profile: `total_points` increased by 5
- [ ] Try checking in again same day → No duplicate points

### Test 4: Streak Calculation
- [ ] Check in Day 1 → Streak = 1
- [ ] Check in Day 2 (next day) → Streak = 2
- [ ] Skip a day, then check in → Streak = 1 (reset)
- [ ] Check in 7 days in a row → Get streak bonus (+10 points)

### Test 5: Other Point Actions
- [ ] Share testimony → +15 points
- [ ] Read devotional → +5 points
- [ ] Create post (Community) → +10 points
- [ ] Add comment → +3 points
- [ ] Pray for someone → +5 points

## 🎉 Testimonies Tests

### Test 6: Celebration Counts
- [ ] Share a testimony
- [ ] Have someone celebrate it → Count = 1
- [ ] Same person uncelebrate → Count = 0
- [ ] Multiple people celebrate → Count increases correctly
- [ ] Check database: Count matches actual celebrations

## 🤝 Prayer Partners Tests

### Test 7: Partnership Shuffle (Leaders Only)
- [ ] Click "Shuffle" with even number of members → All paired
- [ ] Click "Shuffle" with odd number (e.g., 5 members) → 2 pairs, 1 unpaired
- [ ] Check database: Old partnerships marked `is_active = false`
- [ ] Check database: New partnerships marked `is_active = true`

## 📊 Leaderboard Tests

### Test 8: Rank Display
- [ ] User with 0 points → Shows "--" not "#0"
- [ ] User with points → Shows correct rank
- [ ] Multiple users → Sorted correctly by points
- [ ] Point totals match database

## ❓ Ask the Elders Tests

### Test 9: Question Submission
- [ ] Submit question → Shows as anonymous
- [ ] Author can see their own question (but it shows as anonymous to others)
- [ ] Only leaders can see answer button

### Test 10: Answering Questions (Leaders Only)
- [ ] Click "Answer this Question" → Text area appears
- [ ] Type answer and publish → Question marked as answered
- [ ] Answer visible to all users

## 🐛 Error Handling Tests

### Test 11: Error Boundary
- [ ] App doesn't crash on component errors
- [ ] Error boundary shows friendly error message
- [ ] Can reload page from error screen

### Test 12: Network Errors
- [ ] Disconnect internet
- [ ] Try to post/check-in → Shows error message (not silent failure)
- [ ] Reconnect → Can retry action

## ⚡ Performance Tests

### Test 13: Load Times
- [ ] Home page loads quickly (< 2 seconds)
- [ ] Posts load quickly (even with 50+ posts)
- [ ] Leaderboard renders fast (even with 20+ users)
- [ ] Messages load quickly

### Test 14: Realtime Updates
- [ ] Post from one device → Appears immediately on another device
- [ ] New message → Notification appears in real-time
- [ ] RSVP to event → Count updates for other users

---

## 🚨 Critical Issues to Check

If ANY of these fail, stop and report:

❌ **Regular members can perform leader actions**
❌ **Points not being awarded**
❌ **Duplicate points from same action**
❌ **Celebration counts incorrect**
❌ **App crashes with white screen**
❌ **Realtime updates not working**

---

## ✅ All Tests Pass?

Congratulations! Your app is:
- Secure ✅
- Fast ✅
- Reliable ✅
- Bug-free ✅

Deploy to production with confidence! 🚀

---

## 🔍 How to Check Database

To verify database state:

```sql
-- Check points for a user
SELECT * FROM points WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC;

-- Check total points
SELECT id, first_name, total_points FROM profiles ORDER BY total_points DESC;

-- Check devotional reads
SELECT * FROM devotional_reads WHERE date = CURRENT_DATE;

-- Check celebration counts match
SELECT
  t.id,
  t.celebration_count as stored_count,
  COUNT(tc.id) as actual_count
FROM testimonies t
LEFT JOIN testimony_celebrations tc ON tc.testimony_id = t.id
GROUP BY t.id, t.celebration_count
HAVING t.celebration_count != COUNT(tc.id);  -- Should return 0 rows

-- Check partnerships
SELECT * FROM prayer_partnerships WHERE is_active = true;
```

---

**Remember**: Test on staging/development first if you have one! 🎯
