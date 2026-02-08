# Deployment Guide

## Branch Strategy

- **`dev`** - Development branch for active development
- **`production`** - Staging/pre-production testing
- **`live`** - Production/live environment (main branch)

## Vercel Deployment Setup

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables

**⚠️ CRITICAL: This step is required or you'll get "Invalid API key" errors!**

Add these in Vercel Dashboard → Settings → Environment Variables:

1. Go to **Settings** → **Environment Variables**
2. Add these two variables:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase Project URL (from Supabase Dashboard → Settings → API)
   - **Environment**: Select all (Production, Preview, Development)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon/public key (from Supabase Dashboard → Settings → API)
   - **Environment**: Select all (Production, Preview, Development)

3. Click **Save**

**To get your Supabase credentials:**
- Go to Supabase Dashboard → Settings → API
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ Important:** After adding variables, you must **Redeploy** your project for changes to take effect!

### 3. Supabase Configuration

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/oauth
   https://your-app-*.vercel.app/auth/oauth  (for preview deployments)
   ```
3. Set **Site URL** to your production domain:
   ```
   https://your-app.vercel.app
   ```

### 4. Deploy Branches

#### Development (dev branch)
- Auto-deploys on push to `dev`
- Preview URL: `https://your-app-dev.vercel.app`
- Use for testing new features

#### Production (production branch)
- Auto-deploys on push to `production`
- Preview URL: `https://your-app-production.vercel.app`
- Use for staging/pre-production testing

#### Live (live/main branch)
- Auto-deploys on push to `live` or `main`
- Production URL: `https://your-app.vercel.app`
- Use for live production environment

### 5. Deployment Workflow

```bash
# Development
git checkout dev
git add .
git commit -m "Feature: ..."
git push origin dev
# → Auto-deploys to preview

# Staging
git checkout production
git merge dev
git push origin production
# → Auto-deploys to staging

# Production
git checkout live
git merge production
git push origin live
# → Auto-deploys to production
```

## Post-Deployment Checklist

- [ ] Verify authentication works (Google OAuth)
- [ ] Test engagement creation
- [ ] Verify RLS policies are active
- [ ] Check real-time sync
- [ ] Test all core features
- [ ] Verify environment variables are set
- [ ] Check Supabase redirect URLs
- [ ] Monitor error logs

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check build logs in Vercel dashboard

### Authentication Not Working
- Verify Google OAuth is enabled in Supabase
- Check redirect URLs match in Supabase and Google Cloud Console
- Verify environment variables are set correctly

### RLS Errors
- Ensure `secure_rls_policies.sql` has been applied
- Verify user is authenticated (check browser console)
- Check Supabase logs for policy violations

## Production Monitoring

- **Vercel Analytics**: Already integrated
- **Error Tracking**: Consider adding Sentry for production
- **Database Backups**: Set up Supabase automated backups
- **Performance**: Monitor Edge Function performance in Supabase
