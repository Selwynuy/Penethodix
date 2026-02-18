"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { notification } from "@/components/ui/notification"
import { LogOut, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthButton() {
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
        notification.error("Failed to sign out", error.message)
      } else {
        notification.success("Signed out successfully")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      notification.error(
        "Failed to sign out",
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  if (!isAuthenticated) {
    return (
      <Button
        onClick={handleLogin}
        disabled={loading}
        variant="ghost"
        size="sm"
        className="gap-2 outline-none"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
    )
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="ghost"
      size="sm"
      className="gap-2 outline-none"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
