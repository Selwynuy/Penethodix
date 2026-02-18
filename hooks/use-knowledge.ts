"use client"

import { useMemo } from "react"
import { useSupabaseTable } from "./use-supabase-table"
import type { KnowledgeEntry } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type KnowledgeRow = Database["public"]["Tables"]["knowledge_entries"]["Row"]

function mapKnowledgeEntryFromRow(row: KnowledgeRow): KnowledgeEntry {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain as KnowledgeEntry["domain"],
    phase: (row.phase as KnowledgeEntry["phase"]) || undefined,
    service: row.service || undefined,
    tags: row.tags || [],
    owaspTags: row.owasp_tags || [],
    description: row.description || "",
    steps: row.steps || [],
    commands: (row.commands as unknown as KnowledgeEntry["commands"]) || [],
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapKnowledgeEntryToRow(entry: Partial<KnowledgeEntry>): Partial<KnowledgeRow> {
  const row: Partial<KnowledgeRow> = { ...entry as any }

  if (entry.owaspTags !== undefined) {
    row.owasp_tags = entry.owaspTags
    delete (row as any).owaspTags
  }
  if (entry.createdAt !== undefined) {
    delete (row as any).createdAt
  }
  if (entry.updatedAt !== undefined) {
    delete (row as any).updatedAt
  }
  // Handle arrays that might be null from DB but are always array in FE type
  if (entry.tags !== undefined) row.tags = entry.tags;
  if (entry.steps !== undefined) row.steps = entry.steps;
  if (entry.commands !== undefined) row.commands = entry.commands as unknown as Json;

  return row
}

// Supabase generated types for JSONB columns can sometimes be 'Json' or 'unknown'
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export function useKnowledge() {
  const options = useMemo(() => ({
    orderBy: { column: "created_at", ascending: false },
  }), [])

  const {
    data: knowledgeRows,
    loading,
    error,
    createItem: createKnowledgeRow,
    updateItem: updateKnowledgeRow,
    deleteItem: deleteEntry,
  } = useSupabaseTable<KnowledgeRow>("knowledge_entries", "id", options)

  const entries: KnowledgeEntry[] = knowledgeRows.map(mapKnowledgeEntryFromRow)

  const createEntry = async (entry: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">) => {
    const newKnowledgeRow = await createKnowledgeRow(mapKnowledgeEntryToRow(entry))
    return mapKnowledgeEntryFromRow(newKnowledgeRow)
  }

  const updateEntry = async (id: string, updates: Partial<KnowledgeEntry>) => {
    const updatedKnowledgeRow = await updateKnowledgeRow(id, mapKnowledgeEntryToRow(updates))
    return mapKnowledgeEntryFromRow(updatedKnowledgeRow)
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
