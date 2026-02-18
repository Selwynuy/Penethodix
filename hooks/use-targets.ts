"use client"

import { useMemo } from "react"
import { useSupabaseTable } from "./use-supabase-table"
import type { Target, Port } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type TargetRow = Database["public"]["Tables"]["targets"]["Row"]

function mapTargetFromRow(row: TargetRow): Target {
  return {
    id: row.id,
    ip: row.ip,
    label: row.label || undefined,
    inScope: row.in_scope,
    discoveredDuringRecon: row.discovered_during_recon,
    ports: (row.ports as unknown as Port[]) || [],
    engagement_id: row.engagement_id,
  }
}

function mapTargetToRow(target: Partial<Target>): Partial<TargetRow> {
  const row: Partial<TargetRow> = { ...target as any } // Cast to any to allow direct mapping initially

  if (target.inScope !== undefined) {
    row.in_scope = target.inScope
    delete (row as any).inScope // Remove frontend-specific field
  }
  if (target.discoveredDuringRecon !== undefined) {
    row.discovered_during_recon = target.discoveredDuringRecon
    delete (row as any).discoveredDuringRecon // Remove frontend-specific field
  }
  // Ensure ports is handled as JSONB in Supabase, the type casting in mapTargetFromRow handles retrieval
  if (target.ports !== undefined) {
    row.ports = target.ports as unknown as Json // Supabase expects Json for JSONB columns
  }
  
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

export function useTargets(engagementId: string | null) {
  const options = useMemo(() => ({
    filterColumn: "engagement_id",
    filterValue: engagementId,
    orderBy: { column: "created_at", ascending: true },
  }), [engagementId])

  const {
    data: targetRows,
    loading,
    error,
    createItem: createTargetRow,
    updateItem: updateTargetRow,
    deleteItem: deleteTarget,
  } = useSupabaseTable<TargetRow>("targets", "id", options)

  const targets: Target[] = targetRows.map(mapTargetFromRow)

  const createTarget = async (target: Omit<Target, "id" | "engagement_id" | "ports">) => {
    if (!engagementId) throw new Error("Engagement ID is required to create a target")
    const targetWithPorts = { ...target, ports: [] as Port[] }
    const newTargetRow = await createTargetRow(mapTargetToRow({ ...targetWithPorts, engagement_id: engagementId }))
    return mapTargetFromRow(newTargetRow)
  }

  const updateTarget = async (id: string, updates: Partial<Target>) => {
    const updatedTargetRow = await updateTargetRow(id, mapTargetToRow(updates))
    return mapTargetFromRow(updatedTargetRow)
  }

  const addPort = async (targetId: string, port: Port) => {
    const target = targets.find((t) => t.id === targetId)
    if (!target) throw new Error("Target not found")

    if (target.ports.some((p) => p.port === port.port)) {
      notification.info("Port already exists on this target.")
      return target
    }

    const updatedPorts = [...target.ports, port]
    const updatedTarget = await updateTarget(targetId, { ports: updatedPorts })
    return updatedTarget
  }

  return {
    targets,
    loading,
    error,
    createTarget,
    updateTarget,
    addPort,
    deleteTarget,
  }
}
