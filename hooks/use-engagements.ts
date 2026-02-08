"use client"

import { useSupabaseTable } from "./use-supabase-table"
import type { Engagement } from "@/lib/types"

export function useEngagements() {
  const {
    data: engagements,
    loading,
    error,
    createItem: createEngagement,
    updateItem: updateEngagement,
    deleteItem: deleteEngagement,
    refetch: refetchEngagements,
  } = useSupabaseTable<Engagement>("engagements", "id", {
    orderBy: { column: "created_at", ascending: false },
  })

  return {
    engagements,
    loading,
    error,
    createEngagement,
    updateEngagement,
    deleteEngagement,
    refetchEngagements,
  }
}
