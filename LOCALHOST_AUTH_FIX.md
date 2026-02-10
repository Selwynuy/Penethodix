# Fix: Localhost Authentication Issue

## Problem
When the Supabase Site URL is set to production, localhost authentication redirects to production instead of staying on localhost. You see URLs like `https://penethodix.vercel.app/auth/login?code=...` instead of `http://localhost:3000/auth/oauth?code=...`.

**Root Cause**: The Supabase Site URL acts as the default redirect when no matching redirect URL is found. If it's set to production, localhost requests fall back to production.

## Solution (Recommended Approach)

Instead of repeatedly changing the Site URL, use **wildcard redirect URLs** in Supabase and dynamically handle the redirect URL in your code using environment variables. This allows both localhost and production to work without manual switching.

### Step 1: Configure Supabase Dashboard

### Step 2: Add Localhost to Google Cloud Console OAuth Client

**This is required!** Google Cloud Console also needs to authorize localhost redirects.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one used by Supabase)
5. Click **Edit** (pencil icon)
6. In **Authorized redirect URIs**, add:
   ```
   https://[your-supabase-project].supabase.co/auth/v1/callback
   ```
   (This should already be there - keep it!)
7. **Important**: Also add these to **Authorized JavaScript origins**:
   ```
   http://localhost:3001
   http://127.0.0.1:3001
   ```
8. Click **Save**

#### Configure Supabase URL Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

4. **Set Site URL** to your production domain:
   ```
   https://penethodix.vercel.app
   ```
   (Keep this as production - don't change it!)

5. **Add Redirect URLs** with wildcards:
   ```
   http://localhost:3001/**
   http://127.0.0.1:3001/**
   https://penethodix.vercel.app/**
   https://*-your-team.vercel.app/**  (for preview deployments)
   ```
   
   The `/**` wildcard covers all paths, so you don't need to add each specific route.

6. Click **Save changes**

**Why wildcards?** This allows any path under localhost to work, so you don't need to add `/auth/oauth`, `/auth/login`, etc. separately.

### Step 3: Configure Environment Variables (Optional but Recommended)

For better control, you can set `NEXT_PUBLIC_SITE_URL` in your environment:

**For local development** (`.env.local`):
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**For Vercel** (in Vercel Dashboard → Environment Variables):
```
NEXT_PUBLIC_SITE_URL=https://penethodix.vercel.app
```

The code will automatically detect the environment and use the correct URL. If not set, it falls back to `window.location.origin` in the browser.

### Step 4: Check Your Dev Server Port

First, check what port your Next.js dev server is running on:
```bash
npm run dev
# Look for: "Local: http://localhost:XXXX"
```

Most Next.js apps use port **3000** by default.

### Step 5: How It Works in Code

The application now uses a utility function (`lib/utils/get-url.ts`) that:
- In the browser: Uses `window.location.origin` (automatically detects localhost vs production)
- On the server: Uses `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_VERCEL_URL` environment variables
- Falls back to `http://localhost:3001` if nothing is set

The login form automatically uses the correct URL based on where it's running:
```typescript
redirectTo: getAuthCallbackURL() // Automatically uses the right URL
```

This means:
- ✅ Works on localhost automatically
- ✅ Works on production automatically  
- ✅ Works on Vercel preview deployments automatically
- ✅ No need to change Site URL manually

### Step 5: Test

1. Start your local dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3001` in your browser (or whatever port your dev server uses)

3. Try logging in - it should now redirect back to localhost instead of production

## Why This Works

- **Wildcard redirect URLs** (`/**`) in Supabase allow any path under localhost to work
- The code dynamically detects the environment using `window.location.origin` in the browser
- Environment variables (`NEXT_PUBLIC_SITE_URL`) can be set for explicit control
- **Site URL stays as production** - no need to switch it back and forth
- Works automatically for localhost, production, and preview deployments

## Troubleshooting

### Still redirecting to production? (Port 3001)

If you're using port **3001** and the redirect URLs are already set correctly, try these steps:

1. **Clear ALL browser data for localhost and production**:
   - Open DevTools (F12) → Application/Storage tab
   - Clear cookies for:
     - `localhost:3001`
     - `127.0.0.1:3001`
     - `penethodix.vercel.app`
   - Or use an **incognito/private window** (easiest)

2. **Verify the redirect URLs in Supabase**:
   - Make sure wildcard URLs are in the list:
     - `http://localhost:3001/**` ✅ (wildcard covers all paths)
     - `http://127.0.0.1:3001/**` ✅ (wildcard covers all paths)
   - The wildcard `/**` means any path under localhost will work

3. **Try accessing via 127.0.0.1**:
   - Instead of `http://localhost:3001`, try `http://127.0.0.1:3001`
   - Sometimes browsers handle these differently

4. **Check for typos in Supabase**:
   - Make sure there are no extra spaces
   - Protocol is `http://` not `https://`
   - Port is `:3001` not `:3000`
   - Path is `/auth/oauth` not `/auth/login`

5. **Wait a few seconds after saving in Supabase**:
   - Changes might take a moment to propagate
   - Try again after 10-15 seconds

6. **Check browser console for errors**:
   - Open DevTools → Console
   - Look for any Supabase/auth-related errors

### Why it redirects to `/auth/login?code=...` instead of `/auth/oauth?code=...`

This happens when Supabase can't find a matching redirect URL in the allow list. It falls back to the **Site URL** and redirects there. Since your Site URL is set to production, you get redirected to production.

**Fix**: Make sure `http://localhost:3000/auth/oauth` (with the correct port) is in your Redirect URLs list.
