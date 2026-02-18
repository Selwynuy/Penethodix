"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/lib/supabase/database.types"

type PhaseRow = Database["public"]["Tables"]["phases"]["Row"]

export interface Phase {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
  updatedAt: string
}

function mapPhase(row: PhaseRow): Phase {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function usePhases() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial phases
    async function fetchPhases() {
      try {
        setLoading(true)
        
        let query = supabase
          .from("phases")
          .select("*")
          .order("order", { ascending: true })
        
        // Filter by user_id if authenticated, otherwise show all (for development)
        if (user) {
          query = query.eq("user_id", user.id)
        }
        
        const { data, error } = await query

        if (error) throw error
        setPhases((data || []).map(mapPhase))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch phases"))
      } finally {
        setLoading(false)
      }
    }

    fetchPhases()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("phases-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "phases",
        },
        async () => {
          let query = supabase
            .from("phases")
            .select("*")
            .order("order", { ascending: true })
          
          if (user) {
            query = query.eq("user_id", user.id)
          }
          
          const { data } = await query
          if (data) {
            setPhases(data.map(mapPhase))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user])

  const createPhase = async (phase: Omit<Phase, "id" | "createdAt" | "updatedAt">) => {
    // Get max order to append at end
    const { data: existingPhases } = await supabase
      .from("phases")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .eq("user_id", user?.id || null)
    
    const maxOrder = existingPhases?.[0]?.order ?? -1
    
    const { data, error } = await supabase
      .from("phases")
      .insert({
        name: phase.name,
        color: phase.color,
        order: phase.order ?? maxOrder + 1,
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      // Enhance error with more details
      const enhancedError = new Error(error.message || "Failed to create phase")
      ;(enhancedError as any).details = error.details
      ;(enhancedError as any).hint = error.hint
      ;(enhancedError as any).code = error.code
      throw enhancedError
    }
    const mapped = mapPhase(data)
    // Optimistically update state
    setPhases((prev) => [...prev, mapped].sort((a, b) => a.order - b.order))
    return mapped
  }

  const updatePhase = async (id: string, updates: Partial<Phase>) => {
    // Optimistically update state
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === id ? { ...phase, ...updates } : phase
      ).sort((a, b) => a.order - b.order)
    )

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.order !== undefined) updateData.order = updates.order

    const { data, error } = await supabase
      .from("phases")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
      let query = supabase
        .from("phases")
        .select("*")
        .order("order", { ascending: true })
      
      if (user) {
        query = query.eq("user_id", user.id)
      }
      
      const { data: reverted } = await query
      if (reverted) {
        setPhases(reverted.map(mapPhase))
      }
      throw error
    }
    const mapped = mapPhase(data)
    // Update with server response
    setPhases((prev) =>
      prev.map((phase) => (phase.id === id ? mapped : phase)).sort((a, b) => a.order - b.order)
    )
    return mapped
  }

  const deletePhase = async (id: string) => {
    // Optimistically remove from state
    setPhases((prev) => prev.filter((phase) => phase.id !== id))
    
    const { error } = await supabase.from("phases").delete().eq("id", id)
    if (error) {
      // Revert optimistic update on error by refetching
      let query = supabase
        .from("phases")
        .select("*")
        .order("order", { ascending: true })
      
      if (user) {
        query = query.eq("user_id", user.id)
      }
      
      const { data } = await query
      if (data) {
        setPhases(data.map(mapPhase))
      }
      throw error
    }
  }

  return {
    phases,
    loading,
    error,
    createPhase,
    updatePhase,
    deletePhase,
  }
}
