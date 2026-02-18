"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AppHeader } from "@/components/pentest/app-header"
import { Sidebar, type SidebarView } from "@/components/pentest/sidebar"
import { KeyboardShortcuts } from "@/components/pentest/keyboard-shortcuts"
import { KnowledgeBase, type KnowledgeBaseHandle } from "@/components/pentest/knowledge-base"
import type { TargetPanelHandle } from "@/components/pentest/target-panel"
import { RulesEditor } from "@/components/pentest/rules-editor"
import { EngagementView } from "@/components/pentest/engagement-view"
import { Homepage } from "@/components/pentest/homepage"
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
  // All hooks must be called at the top, before any conditional returns
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<SidebarView>("engagements")
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced")
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [showHomepage, setShowHomepage] = useState(false)
  const knowledgeBaseRef = useRef<KnowledgeBaseHandle>(null)
  const targetPanelRef = useRef<TargetPanelHandle>(null)

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
    updateTarget,
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
    createRule,
    updateRule,
    duplicateRule,
    deleteRule,
  } = useRules()

  // Show homepage if no engagements exist
  useEffect(() => {
    if (engagements.length === 0) {
      setShowHomepage(true)
    }
  }, [engagements.length])

  // Hide homepage when an engagement is selected (user explicitly selected it)
  useEffect(() => {
    if (activeEngagement) {
      // Only hide if we're not explicitly showing homepage
      // This prevents auto-selection from hiding the homepage when user clicks logo
      // But if user selects an engagement from sidebar, hide the homepage
      if (!showHomepage) {
        // User selected an engagement, so hide homepage
        setShowHomepage(false)
      }
    }
  }, [activeEngagement, showHomepage])

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
    if (!activeEngagement) {
      notification.error("No Engagement Selected", "Please select an engagement first.")
      return
    }
    
    if (!selectedTarget) {
      notification.error(
        "No Target Selected",
        "Please select a target first, then press Ctrl+N to add a finding for that target."
      )
      return
    }

    try {
      const newFinding = await createFinding({
        engagement_id: activeEngagement.id,
        title: "New Finding",
        severity: "medium",
        status: "open",
        description: "",
        target_id: selectedTarget.id,
      })
      notification.success(`New finding created for ${selectedTarget.ip}`)
    } catch (error) {
      console.error("Failed to create finding:", error)
      notification.error(
        "Failed to create finding",
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    }
  }, [activeEngagement, selectedTarget, createFinding])

  const handleCreateEngagement = async () => {
              try {
                const newEngagement = await createEngagement({
                  name: "New Engagement",
                  phase: "reconnaissance",
                  status: "active",
                })
                setActiveEngagement(newEngagement)
      setShowHomepage(false) // Hide homepage when engagement is created
                notification.success("Engagement created")
              } catch (error) {
                console.error("Failed to create engagement:", error)
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
                notification.error(
                  "Failed to create engagement",
                  errorMessage
                )
              }
  }

  // Loading state - now after all hooks
  if (engagementsLoading && engagements.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleNavigateToEngagements = () => {
    // If there are engagements, select the first one or the active one
    if (engagements.length > 0) {
      const engagementToSelect = activeEngagement || engagements[0]
      setActiveEngagement(engagementToSelect)
      setShowHomepage(false)
    } else {
      // No engagements, just hide homepage to show empty state
      setShowHomepage(false)
    }
  }

  // Show homepage if explicitly set, or if no engagements exist
  if (showHomepage || (!activeEngagement && engagements.length === 0)) {
    return (
      <Homepage 
        onCreateEngagement={handleCreateEngagement} 
        syncStatus={syncStatus}
        onNavigateToEngagements={handleNavigateToEngagements}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader
        syncStatus={syncStatus}
        onLogoClick={() => setShowHomepage(true)}
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
              selectedTarget={selectedTarget}
              onTargetSelect={setSelectedTarget}
              onCreateTarget={createTarget}
              onUpdateTarget={updateTarget}
              onAddPort={addPort}
              onDeleteTarget={deleteTarget}
              onCreateFinding={createFinding}
              onUpdateFinding={updateFinding}
              onDeleteFinding={deleteFinding}
              targetPanelRef={targetPanelRef}
            />
          </main>
        )}

        {activeView === "knowledge" && (
          <KnowledgeBase
            ref={knowledgeBaseRef}
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
            onCreateRule={async (rule) => {
              try {
                const createdRule = await createRule(rule)
                notification.success("Rule created")
                return createdRule
              } catch (error) {
                console.error("Failed to create rule:", error)
                notification.error(
                  "Failed to create rule",
                  error instanceof Error ? error.message : "An unknown error occurred"
                )
                throw error
              }
            }}
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
        knowledgeBaseRef={knowledgeBaseRef}
        targetPanelRef={targetPanelRef}
        activeView={activeView}
      />
    </div>
  )
}
