"use client"

import { useSupabaseTable } from "./use-supabase-table"
import type { Rule } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type RuleRow = Database["public"]["Tables"]["rules"]["Row"]

function mapRuleFromRow(row: RuleRow): Rule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    phase: row.phase as Rule["phase"],
    enabled: row.enabled,
    tags: row.tags || [],
    conditions: (row.conditions as unknown as Rule["conditions"]) || [],
    suggestions: (row.suggestions as unknown as Rule["suggestions"]) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRuleToRow(rule: Partial<Rule>): Partial<RuleRow> {
  const row: Partial<RuleRow> = { ...rule as any }

  if (rule.createdAt !== undefined) {
    delete (row as any).createdAt
  }
  if (rule.updatedAt !== undefined) {
    delete (row as any).updatedAt
  }
  if (rule.tags !== undefined) row.tags = rule.tags;
  if (rule.conditions !== undefined) row.conditions = rule.conditions as unknown as Json;
  if (rule.suggestions !== undefined) row.suggestions = rule.suggestions as unknown as Json;

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

export function useRules() {
  const {
    data: ruleRows,
    loading,
    error,
    createItem: createRuleRow,
    updateItem: updateRuleRow,
    deleteItem: deleteRule,
  } = useSupabaseTable<RuleRow>("rules", "id", {
    orderBy: { column: "created_at", ascending: false },
  })

  const rules: Rule[] = ruleRows.map(mapRuleFromRow)

  const createRule = async (rule: Omit<Rule, "id" | "createdAt" | "updatedAt">) => {
    const newRuleRow = await createRuleRow(mapRuleToRow(rule))
    return mapRuleFromRow(newRuleRow)
  }

  const updateRule = async (id: string, updates: Partial<Rule>) => {
    const updatedRuleRow = await updateRuleRow(id, mapRuleToRow(updates))
    return mapRuleFromRow(updatedRuleRow)
  }

  const duplicateRule = async (id: string) => {
    const ruleToDuplicate = rules.find((r) => r.id === id)
    if (!ruleToDuplicate) throw new Error("Rule not found")

    const duplicatedRule: Omit<Rule, "id" | "createdAt" | "updatedAt"> = {
      name: `${ruleToDuplicate.name} (Copy)`,
      description: ruleToDuplicate.description,
      phase: ruleToDuplicate.phase,
      enabled: false, // Disable duplicated rules by default
      tags: [...ruleToDuplicate.tags],
      conditions: JSON.parse(JSON.stringify(ruleToDuplicate.conditions)),
      suggestions: JSON.parse(JSON.stringify(ruleToDuplicate.suggestions)),
    }

    return createRule(duplicatedRule)
  }

  return {
    rules,
    loading,
    error,
    createRule, // Expose createRule for duplication
    updateRule,
    duplicateRule,
    deleteRule,
  }
}
