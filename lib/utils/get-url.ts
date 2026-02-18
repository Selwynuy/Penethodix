/**
 * Get the base URL for the application based on environment variables.
 * This handles both local development and Vercel deployments.
 * 
 * In the browser, uses window.location.origin for accurate detection.
 * On the server, uses environment variables.
 */
export function getURL(): string {
  // In the browser, use window.location.origin (most reliable)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // On the server, use environment variables
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this in Vercel env settings
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3001' // Default to localhost for local development

  // Make sure to include `https://` when not localhost
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  // Remove trailing slash if present (we'll add it where needed)
  url = url.endsWith('/') ? url.slice(0, -1) : url

  return url
}

/**
 * Get the OAuth callback URL for authentication redirects
 * Always uses window.location.origin in browser to ensure correct localhost redirects
 */
export function getAuthCallbackURL(): string {
  // In browser, always use current origin for OAuth callback
  if (typeof window !== 'undefined') {
    const callbackURL = `${window.location.origin}/auth/oauth?next=/`
    console.log('OAuth callback URL:', callbackURL)
    return callbackURL
  }
  
  // Server-side fallback
  const baseURL = getURL()
  return `${baseURL}/auth/oauth?next=/`
}
