"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Rule } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type RuleRow = Database["public"]["Tables"]["rules"]["Row"]

function mapRule(row: RuleRow): Rule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    phase: row.phase as Rule["phase"],
    enabled: row.enabled,
    tags: row.tags,
    conditions: (row.conditions as unknown as Rule["conditions"]) || [],
    suggestions: (row.suggestions as unknown as Rule["suggestions"]) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial rules
    async function fetchRules() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("rules")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setRules(data.map(mapRule))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch rules"))
      } finally {
        setLoading(false)
      }
    }

    fetchRules()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("rules-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rules",
        },
        async () => {
          const { data } = await supabase
            .from("rules")
            .select("*")
            .order("created_at", { ascending: false })
          if (data) {
            setRules(data.map(mapRule))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const createRule = async (rule: Omit<Rule, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase
      .from("rules")
      .insert({
        name: rule.name,
        description: rule.description,
        phase: rule.phase,
        enabled: rule.enabled,
        tags: rule.tags,
        conditions: rule.conditions as unknown,
        suggestions: rule.suggestions as unknown,
      })
      .select()
      .single()

    if (error) throw error
    const mapped = mapRule(data)
    // Optimistically update state
    setRules((prev) => [mapped, ...prev])
    return mapped
  }

  const updateRule = async (id: string, updates: Partial<Rule>) => {
    // Optimistically update state
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      )
    )

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.phase !== undefined) updateData.phase = updates.phase
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions as unknown
    if (updates.suggestions !== undefined) updateData.suggestions = updates.suggestions as unknown

    const { data, error } = await supabase
      .from("rules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
      const { data: reverted } = await supabase
        .from("rules")
        .select("*")
        .order("created_at", { ascending: false })
      if (reverted) {
        setRules(reverted.map(mapRule))
      }
      throw error
    }
    const mapped = mapRule(data)
    // Update with server response
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? mapped : rule))
    )
    return mapped
  }

  const deleteRule = async (id: string) => {
    // Optimistically remove from state
    setRules((prev) => prev.filter((rule) => rule.id !== id))
    
    const { error } = await supabase.from("rules").delete().eq("id", id)
    if (error) {
      // Revert optimistic update on error by refetching
      const { data } = await supabase
        .from("rules")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) {
        setRules(data.map(mapRule))
      }
      throw error
    }
  }

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
  }
}
