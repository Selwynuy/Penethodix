"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { notification } from "@/components/ui/notification"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
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
        router.push("/auth/login")
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

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="ghost"
      size="sm"
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
