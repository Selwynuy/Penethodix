"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Engagement } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type EngagementRow = Database["public"]["Tables"]["engagements"]["Row"]

function mapEngagement(row: EngagementRow): Engagement {
  return {
    id: row.id,
    name: row.name,
    phase: row.phase,
    status: row.status,
  }
}

export function useEngagements() {
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial engagements
    async function fetchEngagements() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("engagements")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setEngagements(data.map(mapEngagement))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch engagements"))
      } finally {
        setLoading(false)
      }
    }

    fetchEngagements()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("engagements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "engagements",
        },
        async () => {
          const { data } = await supabase
            .from("engagements")
            .select("*")
            .order("created_at", { ascending: false })
          if (data) {
            setEngagements(data.map(mapEngagement))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const createEngagement = async (engagement: Omit<Engagement, "id">) => {
    const { data, error } = await supabase
      .from("engagements")
      .insert({
        name: engagement.name,
        phase: engagement.phase,
        status: engagement.status,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(error.message || `Failed to create engagement: ${JSON.stringify(error)}`)
    }
    if (!data) {
      throw new Error("No data returned from engagement creation")
    }
    const mapped = mapEngagement(data)
    // Optimistically update state
    setEngagements((prev) => [mapped, ...prev])
    return mapped
  }

  const updateEngagement = async (id: string, updates: Partial<Engagement>) => {
    // Optimistically update state
    setEngagements((prev) =>
      prev.map((engagement) =>
        engagement.id === id ? { ...engagement, ...updates } : engagement
      )
    )

    const { data, error } = await supabase
      .from("engagements")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
      const { data: reverted } = await supabase
        .from("engagements")
        .select("*")
        .order("created_at", { ascending: false })
      if (reverted) {
        setEngagements(reverted.map(mapEngagement))
      }
      throw error
    }
    const mapped = mapEngagement(data)
    // Update with server response
    setEngagements((prev) =>
      prev.map((engagement) => (engagement.id === id ? mapped : engagement))
    )
    return mapped
  }

  const deleteEngagement = async (id: string) => {
    // Optimistically remove from state
    setEngagements((prev) => prev.filter((engagement) => engagement.id !== id))
    
    const { error } = await supabase.from("engagements").delete().eq("id", id)
    if (error) {
      // Revert optimistic update on error by refetching
      const { data } = await supabase
        .from("engagements")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) {
        setEngagements(data.map(mapEngagement))
      }
      throw error
    }
  }

  return {
    engagements,
    loading,
    error,
    createEngagement,
    updateEngagement,
    deleteEngagement,
  }
}
