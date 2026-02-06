"use client"

import { createClient } from "@/lib/supabase/client"

export async function getFindings(engagementId: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("findings")
    .select("content")
    .eq("engagement_id", engagementId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" - return empty string
    throw error
  }

  return data?.content || ""
}

export async function upsertFindings(engagementId: string, content: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("findings")
    .upsert(
      {
        engagement_id: engagementId,
        content,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "engagement_id",
      }
    )

  if (error) throw error
}

export function subscribeToFindings(
  engagementId: string,
  callback: (content: string) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`findings-changes-${engagementId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "findings",
        filter: `engagement_id=eq.${engagementId}`,
      },
      async () => {
        const content = await getFindings(engagementId)
        callback(content)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
