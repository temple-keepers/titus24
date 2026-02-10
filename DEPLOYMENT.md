# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- [x] A Supabase project created
- [x] All database migrations run
- [x] At least one leader account created
- [x] Environment variables configured

## Quick Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

6. Click "Deploy"

## Deploy to Netlify

### Using Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. Add Environment Variables in Site Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

6. Deploy

### Add Redirects for SPA Routing

Create `public/_redirects`:
```
/*    /index.html   200
```

## Database Setup

### 1. Run Migrations in Order

Execute these SQL files in your Supabase SQL Editor:

```sql
-- 1. Main schema and RLS setup
supabase/00-FIX-EVERYTHING.sql

-- 2. Fix RLS policies
supabase/fix-rls-policies.sql

-- 3. Add devotionals feature
supabase/add-devotionals-admin.sql

-- 4. Make devotional fields optional
supabase/make-devotional-fields-optional.sql

-- 5. Migrate new features (if adding testimonies, prayer partners, etc.)
supabase/migrate-new-features.sql

-- 6. Remove duplicate policies (performance)
supabase/remove-duplicate-policies.sql

-- 7. Optimize RLS performance
supabase/optimize-rls-performance.sql

-- 8. Fix security warnings (IMPORTANT - Run this last!)
supabase/fix-security-warnings.sql
```

### 2. Enable Password Protection

**IMPORTANT**: Enable leaked password protection in Supabase Auth:

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Scroll to **Password Requirements**
3. Enable **"Check against list of leaked passwords (HaveIBeenPwned)"**
4. Click **Save**

This prevents users from using compromised passwords.

### 3. Create Initial Admin Account

1. Sign up through the app
2. Go to Supabase Dashboard → Authentication → Users
3. Find your user
4. Go to Table Editor → `profiles`
5. Update your profile:
   - Set `role` to `'leader'`

### 4. Verify RLS Policies

Run this query to check all RLS policies:
```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Post-Deployment Checks

### ✅ Essential Tests

1. **Authentication**
   - [ ] Sign up new user
   - [ ] Login with existing user
   - [ ] Password reset
   - [ ] Logout

2. **User Features**
   - [ ] Create a post
   - [ ] Add a comment
   - [ ] React to a post
   - [ ] Submit a prayer request
   - [ ] Upload profile photo
   - [ ] Toggle dark mode
   - [ ] Install PWA

3. **Leader Features** (must be logged in as leader)
   - [ ] Create event
   - [ ] Create resource
   - [ ] Create devotional
   - [ ] View admin dashboard
   - [ ] Record attendance

4. **Performance**
   - [ ] Page load time < 3 seconds
   - [ ] Images load properly
   - [ ] Realtime updates work
   - [ ] Offline mode works (PWA)

## Monitoring & Maintenance

### Regular Tasks

1. **Weekly**
   - Check Supabase logs for errors
   - Review user feedback
   - Monitor database size

2. **Monthly**
   - Update dependencies: `npm update`
   - Check for security updates: `npm audit`
   - Review and optimize database queries

3. **As Needed**
   - Backup database (Supabase does this automatically)
   - Scale resources if needed
   - Update content (devotionals, resources)

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

- Ensure variables start with `VITE_`
- Restart dev server after changes
- Check for typos in variable names
- Verify values are correct in Supabase dashboard

### RLS Errors

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Re-run RLS policies
\i supabase/fix-rls-policies.sql
```

### Images Not Uploading

1. Check Supabase Storage bucket exists
2. Verify bucket is public
3. Check RLS policies on storage.objects
4. Verify image file size < 5MB

## Custom Domain Setup

### Vercel

1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as shown
5. Wait for SSL certificate (automatic)

### Netlify

1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Follow DNS instructions
4. Enable HTTPS (automatic)

## Performance Optimization

### Already Implemented
- Code splitting (vendor, supabase, icons)
- Image optimization on upload
- Lazy loading components
- Production build minification

### Optional Improvements
- Add service worker for offline functionality
- Implement CDN for static assets
- Add image lazy loading library
- Enable Vercel/Netlify Analytics

## Support

For deployment issues:
1. Check this guide
2. Review error logs in hosting platform
3. Check Supabase logs
4. Consult hosting platform documentation

## Next Steps After Deployment

1. Add custom domain (optional)
2. Set up email provider in Supabase Auth
3. Customize email templates
4. Add analytics (Google Analytics, Plausible, etc.)
5. Set up monitoring (Sentry, LogRocket, etc.)
6. Create user documentation
7. Announce launch! 🎉
