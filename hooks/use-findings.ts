"use client"

import { useMemo } from "react"
import { useSupabaseTable } from "./use-supabase-table"
import type { Finding } from "@/lib/types"

export function useFindings(engagementId: string | null) {
  const options = useMemo(() => ({
    filterColumn: "engagement_id",
    filterValue: engagementId,
    orderBy: { column: "created_at", ascending: true },
  }), [engagementId])

  const {
    data: findings,
    loading,
    error,
    createItem: createFinding,
    updateItem: updateFinding,
    deleteItem: deleteFinding,
    refetch: refetchFindings,
  } = useSupabaseTable<Finding>("findings", "id", options)

  return {
    findings,
    loading,
    error,
    createFinding,
    updateFinding,
    deleteFinding,
    refetchFindings,
  }
}
