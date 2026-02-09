# ⚠️ CORRECT MIGRATION ORDER

Run these migrations in Supabase SQL Editor **IN THIS EXACT ORDER**:

## 1️⃣ First: Create New Tables
```sql
-- Run: migrate-new-features.sql
```
This creates the new tables (daily_devotionals, testimonies, elder_questions, etc.)

## 2️⃣ Second: Fix Security Policies
```sql
-- Run: fix-rls-policies.sql
```
This fixes the RLS policies on the new tables

## 3️⃣ Third: Add Performance Indexes
```sql
-- Run: add-indexes-and-fixes.sql
```
This adds indexes and helper functions

## 4️⃣ Optional: Add Missing Columns (if needed)
```sql
-- Run: migrate-columns.sql (only if you haven't run it yet)
```
This adds missing columns to existing tables

---

## ❌ Error You Got

You tried to run `add-indexes-and-fixes.sql` BEFORE running `migrate-new-features.sql`, so the tables don't exist yet.

## ✅ Solution

Run them in the correct order above!
