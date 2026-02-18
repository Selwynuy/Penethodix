"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAuthCallbackURL } from "@/lib/utils/get-url"
import { Button } from "@/components/ui/button"
import { notification } from "@/components/ui/notification"
import { Chrome, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const redirectURL = getAuthCallbackURL()
      console.log('Initiating Google OAuth with redirect:', redirectURL)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
        },
      })

      if (error) {
        console.error("Error signing in:", error)
        
        // Provide helpful error messages
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          notification.error(
            "Google Sign-In Not Configured",
            "Please enable Google provider in Supabase Dashboard → Authentication → Providers. See AUTH_SETUP.md for instructions."
          )
        } else {
          notification.error("Failed to sign in", error.message)
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      notification.error(
        "Failed to sign in",
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8 rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="text-muted-foreground">
          Sign in to access your penetration testing notebook
        </p>
      </div>

      {/* Sign in button */}
      <div className="space-y-4">
        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group relative w-full overflow-hidden transition-all hover:scale-[1.02]"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Chrome className="mr-2 h-5 w-5" />
              Continue with Google
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>

      </div>

      {/* Footer links */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="#" className="transition-colors hover:text-primary">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href="#" className="transition-colors hover:text-primary">
          Terms of Service
        </Link>
      </div>
    </div>
  )
}
