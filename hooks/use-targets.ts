"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Target, Port } from "@/lib/types"
import type { Database } from "@/lib/supabase/database.types"

type TargetRow = Database["public"]["Tables"]["targets"]["Row"]

function mapTarget(row: TargetRow): Target {
  return {
    id: row.id,
    ip: row.ip,
    label: row.label || undefined,
    inScope: row.in_scope,
    discoveredDuringRecon: row.discovered_during_recon,
    ports: (row.ports as unknown as Port[]) || [],
  }
}

export function useTargets(engagementId: string | null) {
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!engagementId) {
      setTargets([])
      setLoading(false)
      return
    }

    // Fetch initial targets
    async function fetchTargets() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("targets")
          .select("*")
          .eq("engagement_id", engagementId)
          .order("created_at", { ascending: true })

        if (error) throw error
        setTargets(data.map(mapTarget))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch targets"))
      } finally {
        setLoading(false)
      }
    }

    fetchTargets()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`targets-changes-${engagementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "targets",
          filter: `engagement_id=eq.${engagementId}`,
        },
        async () => {
          const { data } = await supabase
            .from("targets")
            .select("*")
            .eq("engagement_id", engagementId)
            .order("created_at", { ascending: true })
          if (data) {
            setTargets(data.map(mapTarget))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [engagementId, supabase])

  const createTarget = async (target: Omit<Target, "id">) => {
    if (!engagementId) throw new Error("Engagement ID is required")

    const { data, error } = await supabase
      .from("targets")
      .insert({
        engagement_id: engagementId,
        ip: target.ip,
        label: target.label || null,
        in_scope: target.inScope,
        discovered_during_recon: target.discoveredDuringRecon,
        ports: target.ports as unknown,
      })
      .select()
      .single()

    if (error) throw error
    return mapTarget(data)
  }

  const updateTarget = async (id: string, updates: Partial<Target>) => {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.ip !== undefined) updateData.ip = updates.ip
    if (updates.label !== undefined) updateData.label = updates.label || null
    if (updates.inScope !== undefined) updateData.in_scope = updates.inScope
    if (updates.discoveredDuringRecon !== undefined)
      updateData.discovered_during_recon = updates.discoveredDuringRecon
    if (updates.ports !== undefined) updateData.ports = updates.ports as unknown

    const { data, error } = await supabase
      .from("targets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return mapTarget(data)
  }

  const addPort = async (targetId: string, port: Port) => {
    const target = targets.find((t) => t.id === targetId)
    if (!target) throw new Error("Target not found")

    // Check if port already exists
    if (target.ports.some((p) => p.port === port.port)) {
      return target
    }

    const updatedPorts = [...target.ports, port]
    return updateTarget(targetId, { ports: updatedPorts })
  }

  const deleteTarget = async (id: string) => {
    const { error } = await supabase.from("targets").delete().eq("id", id)
    if (error) throw error
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
