# Vercel Environment Variables Setup

## Quick Fix for "Invalid API key" Error

If you're seeing "Failed to load engagements" or "Invalid API key" errors, you need to add environment variables in Vercel.

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API** (left sidebar)
4. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase Project URL (e.g., `https://xxxxx.supabase.co`)
   - **Environment**: Select all (Production, Preview, Development)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon/public key (starts with `eyJ...`)
   - **Environment**: Select all (Production, Preview, Development)

5. Click **Save**

## Step 3: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Step 4: Verify

After redeployment:
1. Visit your Vercel app URL
2. Try logging in
3. Check browser console for any errors
4. If you still see errors, verify:
   - Environment variable names are **exactly** as shown (case-sensitive)
   - Values are copied correctly (no extra spaces)
   - Variables are enabled for the correct environment

## Common Issues

### "Invalid API key" Error
- ✅ Check the anon key is correct (starts with `eyJ`)
- ✅ Make sure it's the **anon/public** key, not the service_role key
- ✅ Verify no extra spaces or characters

### "Failed to load engagements"
- ✅ Check both environment variables are set
- ✅ Verify variables are enabled for Production environment
- ✅ Redeploy after adding variables

### Still Not Working?
1. Check Vercel build logs for errors
2. Verify Supabase project is active
3. Check Supabase API settings → make sure API is enabled
4. Try accessing Supabase directly to verify credentials work

## Security Note

- ✅ The `anon/public` key is safe to expose in client-side code
- ❌ Never use the `service_role` key in client-side code
- ✅ RLS policies protect your data even with the anon key
