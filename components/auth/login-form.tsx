"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAuthCallbackURL } from "@/lib/utils/get-url"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notification } from "@/components/ui/notification"
import { Chrome } from "lucide-react"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackURL(),
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
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in to access your penetration testing notebook</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          <Chrome className="mr-2 h-4 w-4" />
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  )
}
