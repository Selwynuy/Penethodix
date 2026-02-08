import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost"
    const errorMessage = isProduction
      ? "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings."
      : "Missing Supabase environment variables. Please check your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
    console.error("Supabase Client Error:", errorMessage)
    console.error("URL:", url ? "✓ Set" : "✗ Missing")
    console.error("Key:", key ? "✓ Set" : "✗ Missing")
    
    throw new Error(errorMessage)
  }

  return createBrowserClient(url, key)
}
