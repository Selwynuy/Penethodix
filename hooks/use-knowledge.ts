"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { KnowledgeEntry } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type KnowledgeRow = Database["public"]["Tables"]["knowledge_entries"]["Row"]

function mapKnowledgeEntry(row: KnowledgeRow): KnowledgeEntry {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain as KnowledgeEntry["domain"],
    phase: (row.phase as KnowledgeEntry["phase"]) || undefined,
    service: row.service || undefined,
    tags: row.tags,
    owaspTags: row.owasp_tags,
    description: row.description,
    steps: row.steps,
    commands: (row.commands as unknown as KnowledgeEntry["commands"]) || [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial entries
    async function fetchEntries() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("knowledge_entries")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setEntries(data.map(mapKnowledgeEntry))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch knowledge entries"))
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("knowledge-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "knowledge_entries",
        },
        async () => {
          const { data } = await supabase
            .from("knowledge_entries")
            .select("*")
            .order("created_at", { ascending: false })
          if (data) {
            setEntries(data.map(mapKnowledgeEntry))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const createEntry = async (entry: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase
      .from("knowledge_entries")
      .insert({
        title: entry.title,
        domain: entry.domain,
        phase: entry.phase || null,
        service: entry.service || null,
        tags: entry.tags,
        owasp_tags: entry.owaspTags,
        description: entry.description,
        steps: entry.steps,
        commands: entry.commands as unknown,
        notes: entry.notes,
      })
      .select()
      .single()

    if (error) throw error
    const mapped = mapKnowledgeEntry(data)
    // Optimistically update state (real-time will also update, but this makes it instant)
    setEntries((prev) => [mapped, ...prev])
    return mapped
  }

  const updateEntry = async (id: string, updates: Partial<KnowledgeEntry>) => {
    // Optimistically update state
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    )

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.domain !== undefined) updateData.domain = updates.domain
    if (updates.phase !== undefined) updateData.phase = updates.phase || null
    if (updates.service !== undefined) updateData.service = updates.service || null
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.owaspTags !== undefined) updateData.owasp_tags = updates.owaspTags
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.steps !== undefined) updateData.steps = updates.steps
    if (updates.commands !== undefined) updateData.commands = updates.commands as unknown
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from("knowledge_entries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry } : entry
        )
      )
      throw error
    }
    const mapped = mapKnowledgeEntry(data)
    // Update with server response
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? mapped : entry))
    )
    return mapped
  }

  const deleteEntry = async (id: string) => {
    // Optimistically remove from state
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
    
    const { error } = await supabase.from("knowledge_entries").delete().eq("id", id)
    if (error) {
      // Revert optimistic update on error by refetching
      const { data } = await supabase
        .from("knowledge_entries")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) {
        setEntries(data.map(mapKnowledgeEntry))
      }
      throw error
    }
  }

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
