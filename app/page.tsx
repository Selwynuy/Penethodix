"use client"

import { useState, useEffect, useCallback } from "react"
import { AppHeader } from "@/components/pentest/app-header"
import { Sidebar, type SidebarView } from "@/components/pentest/sidebar"
import { KeyboardShortcuts } from "@/components/pentest/keyboard-shortcuts"
import { KnowledgeBase } from "@/components/pentest/knowledge-base"
import { RulesEditor } from "@/components/pentest/rules-editor"
import { EngagementView } from "@/components/pentest/engagement-view"
import { useEngagementContext } from "@/contexts/engagement-context" // New context
import { useTargets } from "@/hooks/use-targets"
import { useKnowledge } from "@/hooks/use-knowledge"
import { useRules } from "@/hooks/use-rules"
import { useFindings } from "@/hooks/use-findings"
import { createClient } from "@/lib/supabase/client"
import { notification } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import type { Engagement, Target, Port, KnowledgeEntry, Rule, Finding } from "@/lib/types"

export default function PentestNotebook() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<SidebarView>("engagements")
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced")

  // Use the new Engagement Context
  const {
    engagements,
    loading: engagementsLoading,
    activeEngagement,
    setActiveEngagement,
    createEngagement,
    updateEngagement,
    deleteEngagement,
  } = useEngagementContext()

  // These hooks now depend on the activeEngagement from the context
  const {
    targets,
    createTarget,
    addPort,
    deleteTarget,
  } = useTargets(activeEngagement?.id || null)

  const {
    findings,
    createFinding,
    updateFinding,
    deleteFinding,
  } = useFindings(activeEngagement?.id || null)

  const {
    entries: knowledgeEntries,
    createEntry: createKnowledgeEntry,
    updateEntry: updateKnowledgeEntry,
    deleteEntry: deleteKnowledgeEntry,
  } = useKnowledge()

  const {
    rules,
    updateRule,
    duplicateRule,
    deleteRule,
  } = useRules()

  // Sync status detection
  useEffect(() => {
    const supabase = createClient()
    let isOnline = navigator.onLine

    const handleOnline = () => {
      isOnline = true
      setSyncStatus("synced")
    }
    const handleOffline = () => {
      isOnline = false
      setSyncStatus("offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from("engagements").select("id").limit(1)
        if (error) {
          setSyncStatus("offline")
        } else {
          setSyncStatus(isOnline ? "synced" : "offline")
        }
      } catch {
        setSyncStatus("offline")
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])
  
  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await updateRule(id, { enabled })
    } catch (error) {
      console.error("Failed to toggle rule:", error)
    }
  }

  const handleUpdateRule = async (id: string, updates: Partial<Rule>) => {
    try {
      await updateRule(id, updates)
    } catch (error) {
      console.error("Failed to update rule:", error)
    }
  }

  const handleUpdateKnowledgeEntry = async (id: string, updates: Partial<KnowledgeEntry>) => {
    try {
      await updateKnowledgeEntry(id, updates)
    } catch (error) {
      console.error("Failed to update knowledge entry:", error)
    }
  }
  
  const handleNewFinding = useCallback(async () => {
    if (!activeEngagement) return;
    try {
      await createFinding({
        engagement_id: activeEngagement.id,
        title: "New Finding",
        severity: "medium",
        status: "open",
        description: "",
      });
      notification.success("New finding created")
    } catch(error) {
      console.error("Failed to create new finding:", error)
      notification.error("Failed to create finding", error instanceof Error ? error.message : "An unknown error occurred")
    }
  }, [activeEngagement, createFinding]);


  // Loading state
  if (engagementsLoading && engagements.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!activeEngagement && engagements.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background relative z-10">
        <div className="text-center space-y-4">
          <p className="mb-4 text-muted-foreground">No engagements found</p>
          <Button
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                const newEngagement = await createEngagement({
                  name: "New Engagement",
                  phase: "reconnaissance",
                  status: "active",
                })
                setActiveEngagement(newEngagement)
                notification.success("Engagement created")
              } catch (error) {
                console.error("Failed to create engagement:", error)
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
                notification.error(
                  "Failed to create engagement",
                  errorMessage
                )
              }
            }}
            type="button"
            className="relative z-20"
          >
            Create Engagement
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader
        syncStatus={syncStatus}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        {activeView === "engagements" && (
          <main className="flex flex-1 overflow-hidden">
            <EngagementView
              targets={targets}
              findings={findings}
              rules={rules}
              onCreateTarget={createTarget}
              onAddPort={addPort}
              onDeleteTarget={deleteTarget}
              onCreateFinding={createFinding}
              onUpdateFinding={updateFinding}
              onDeleteFinding={deleteFinding}
            />
          </main>
        )}

        {activeView === "knowledge" && (
          <KnowledgeBase
            entries={knowledgeEntries}
            onAddEntry={async (entry) => {
              try {
                await createKnowledgeEntry(entry)
                notification.success("Knowledge entry created")
              } catch (error) {
                console.error("Failed to create knowledge entry:", error)
                notification.error(
                  "Failed to create knowledge entry",
                  error instanceof Error ? error.message : "An unknown error occurred"
                )
              }
            }}
            onUpdateEntry={handleUpdateKnowledgeEntry}
            onDeleteEntry={async (id) => {
              try {
                await deleteKnowledgeEntry(id)
                notification.success("Knowledge entry deleted")
              } catch (error: any) {
                console.error("Failed to delete knowledge entry:", error)
                const errorMessage = error?.message || error?.details || error?.hint || JSON.stringify(error) || "Unknown error"
                notification.error("Failed to delete knowledge entry", errorMessage)
              }
            }}
          />
        )}

        {activeView === "rules" && (
          <RulesEditor
            rules={rules}
            onToggleRule={handleToggleRule}
            onUpdateRule={handleUpdateRule}
            onDuplicateRule={async (id) => {
              try {
                await duplicateRule(id)
                notification.success("Rule duplicated")
              } catch (error) {
                console.error("Failed to duplicate rule:", error)
                notification.error(
                  "Failed to duplicate rule",
                  error instanceof Error ? error.message : "An unknown error occurred"
                )
              }
            }}
            onDeleteRule={async (id) => {
              try {
                await deleteRule(id)
                notification.success("Rule deleted")
              } catch (error) {
                console.error("Failed to delete rule:", error)
                notification.error(
                  "Failed to delete rule",
                  error instanceof Error ? error.message : "An unknown error occurred"
                )
              }
            }}
          />
        )}
      </div>


      <KeyboardShortcuts
        onNewFinding={handleNewFinding}
      />
    </div>
  )
}
