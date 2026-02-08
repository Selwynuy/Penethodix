"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AppHeader } from "@/components/pentest/app-header"
import { Sidebar, type SidebarView } from "@/components/pentest/sidebar"
import { TargetPanel } from "@/components/pentest/target-panel"
import { FindingsEditor } from "@/components/pentest/findings-editor"
import { KeyboardShortcuts } from "@/components/pentest/keyboard-shortcuts"
import { KnowledgeBase } from "@/components/pentest/knowledge-base"
import { RulesEditor } from "@/components/pentest/rules-editor"
import { SuggestionsPanel } from "@/components/pentest/suggestions-panel"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useEngagements } from "@/hooks/use-engagements"
import { useTargets } from "@/hooks/use-targets"
import { useKnowledge } from "@/hooks/use-knowledge"
import { useRules } from "@/hooks/use-rules"
import { getFindings, upsertFindings, subscribeToFindings } from "@/lib/services/findings"
import { createClient } from "@/lib/supabase/client"
import { notification } from "@/components/ui/notification"
import type { Engagement, Target, Port, KnowledgeEntry, Rule } from "@/lib/types"

export default function PentestNotebook() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<SidebarView>("engagements")
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [findings, setFindings] = useState("")
  const [lastSavedFindings, setLastSavedFindings] = useState("")
  const lastSavedFindingsRef = useRef<string>("")
  const currentFindingsRef = useRef<string>("")
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced")

  // Supabase hooks
  const {
    engagements,
    loading: engagementsLoading,
    createEngagement,
    updateEngagement,
    deleteEngagement,
  } = useEngagements()

  const [activeEngagement, setActiveEngagement] = useState<Engagement | null>(null)

  const {
    targets,
    loading: targetsLoading,
    createTarget,
    updateTarget,
    addPort,
    deleteTarget,
  } = useTargets(activeEngagement?.id || null)

  const {
    entries: knowledgeEntries,
    loading: knowledgeLoading,
    createEntry: createKnowledgeEntry,
    updateEntry: updateKnowledgeEntry,
    deleteEntry: deleteKnowledgeEntry,
  } = useKnowledge()

  const {
    rules,
    loading: rulesLoading,
    updateRule,
    duplicateRule,
    deleteRule,
  } = useRules()

  // Set first engagement as active when engagements load
  useEffect(() => {
    if (engagements.length > 0 && !activeEngagement) {
      setActiveEngagement(engagements[0])
    }
  }, [engagements])

  // Clear active engagement if it's been deleted
  useEffect(() => {
    if (activeEngagement && !engagements.find((e) => e.id === activeEngagement.id)) {
      setActiveEngagement(engagements.length > 0 ? engagements[0] : null)
    }
  }, [engagements, activeEngagement])

  // Load findings when engagement changes
  useEffect(() => {
    if (!activeEngagement?.id) {
      setFindings("")
      return
    }

    const engagementId = activeEngagement.id

    async function loadFindings() {
      try {
        const content = await getFindings(engagementId)
        setFindings(content)
        setLastSavedFindings(content)
        lastSavedFindingsRef.current = content
        currentFindingsRef.current = content
      } catch (error) {
        console.error("Failed to load findings:", error)
        setFindings("")
        setLastSavedFindings("")
        lastSavedFindingsRef.current = ""
        currentFindingsRef.current = ""
      }
    }

    loadFindings()

    // Subscribe to real-time changes
    const unsubscribe = subscribeToFindings(engagementId, (content) => {
      // Only update if:
      // 1. The content is different from what we last saved (external change)
      // 2. The current local state matches what we last saved (user isn't typing)
      // This prevents overwriting user input when they're actively typing
      if (content !== lastSavedFindingsRef.current && 
          currentFindingsRef.current === lastSavedFindingsRef.current) {
        setFindings(content)
        setLastSavedFindings(content)
        lastSavedFindingsRef.current = content
        currentFindingsRef.current = content
      }
    })

    return unsubscribe
  }, [activeEngagement?.id])

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

    // Check Supabase connection
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
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  // Save findings with debounce
  const saveFindings = useCallback(
    async (content: string) => {
      if (!activeEngagement?.id) return
      try {
        setSyncStatus("syncing")
        await upsertFindings(activeEngagement.id, content)
        setLastSavedFindings(content)
        lastSavedFindingsRef.current = content
        currentFindingsRef.current = content
        setSyncStatus("synced")
      } catch (error) {
        console.error("Failed to save findings:", error)
        setSyncStatus("offline")
        notification.error(
          "Failed to save findings",
          error instanceof Error ? error.message : "An unknown error occurred"
        )
      }
    },
    [activeEngagement?.id]
  )

  // Debounced auto-save for findings
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Only auto-save if content has changed and there's an active engagement
    if (activeEngagement?.id && findings !== lastSavedFindingsRef.current) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveFindings(findings)
      }, 2500) // 2.5 seconds after typing stops
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [findings, activeEngagement?.id, saveFindings])


  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const handleAddTarget = async (newTarget: Omit<Target, "id" | "ports">) => {
    if (!activeEngagement?.id) return
    try {
      await createTarget({
        ...newTarget,
        ports: [],
      })
    } catch (error) {
      console.error("Failed to create target:", error)
    }
  }

  const handleAddPort = async (targetId: string, port: Port) => {
    try {
      await addPort(targetId, port)
    } catch (error) {
      console.error("Failed to add port:", error)
    }
  }

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

  const handleFindingsChange = (content: string) => {
    setFindings(content)
    currentFindingsRef.current = content
  }

  const handleFindingsSave = useCallback(async () => {
    await saveFindings(findings)
  }, [findings, saveFindings])

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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">No engagements found</p>
          <button
            onClick={async () => {
              try {
                const newEngagement = await createEngagement({
                  name: "New Engagement",
                  phase: "reconnaissance",
                  status: "active",
                })
                setActiveEngagement(newEngagement)
              } catch (error) {
                console.error("Failed to create engagement:", error)
                notification.error(
                  "Failed to create engagement",
                  error instanceof Error ? error.message : "An unknown error occurred"
                )
              }
            }}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Create Engagement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader
        activeEngagement={activeEngagement}
        syncStatus={syncStatus}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          engagements={engagements}
          activeEngagement={activeEngagement}
          onEngagementSelect={setActiveEngagement}
          onEngagementDelete={async (engagementId) => {
            try {
              await deleteEngagement(engagementId)
              if (activeEngagement?.id === engagementId) {
                setActiveEngagement(engagements.find(e => e.id !== engagementId) || engagements[0] || null)
              }
              notification.success("Engagement deleted")
            } catch (error) {
              console.error("Failed to delete engagement:", error)
              notification.error(
                "Failed to delete engagement",
                error instanceof Error ? error.message : "An unknown error occurred"
              )
            }
          }}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        {activeView === "engagements" && (
          <main className="flex flex-1 overflow-hidden">
            {activeEngagement ? (
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={20} minSize={15}>
                  <TargetPanel
                    targets={targets}
                    selectedTarget={selectedTarget}
                    onTargetSelect={setSelectedTarget}
                    onAddTarget={handleAddTarget}
                    onAddPort={handleAddPort}
                    onDeleteTarget={async (targetId) => {
                      try {
                        await deleteTarget(targetId)
                        if (selectedTarget?.id === targetId) {
                          setSelectedTarget(null)
                        }
                        notification.success("Target deleted")
                      } catch (error) {
                        console.error("Failed to delete target:", error)
                        notification.error(
                          "Failed to delete target",
                          error instanceof Error ? error.message : "An unknown error occurred"
                        )
                      }
                    }}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <FindingsEditor
                    value={findings}
                    onChange={handleFindingsChange}
                    onSave={handleFindingsSave}
                    phase={activeEngagement.phase}
                    hasUnsavedChanges={findings !== lastSavedFindings}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20}>
                  <SuggestionsPanel
                    targets={targets}
                    activeEngagement={activeEngagement}
                    rules={rules}
                    selectedTarget={selectedTarget}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">No engagement selected</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Select an engagement from the sidebar or create a new one
                  </p>
                </div>
              </div>
            )}
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
              if (!confirm("Are you sure you want to delete this rule? This action cannot be undone.")) {
                return
              }
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
        onSwitchPhase={async () => {
          if (!activeEngagement) {
            notification.error("No engagement selected")
            return
          }
          
          const phases: Engagement["phase"][] = [
            "reconnaissance",
            "enumeration",
            "exploitation",
            "post-exploitation",
            "reporting"
          ]
          const currentIndex = phases.indexOf(activeEngagement.phase)
          const nextIndex = (currentIndex + 1) % phases.length
          const nextPhase = phases[nextIndex]
          
          try {
            await updateEngagement(activeEngagement.id, { phase: nextPhase })
            notification.success("Phase updated", `Switched to ${nextPhase} phase`)
          } catch (error) {
            console.error("Failed to switch phase:", error)
            notification.error(
              "Failed to switch phase",
              error instanceof Error ? error.message : "An unknown error occurred"
            )
          }
        }}
        onNewFinding={() => setFindings((prev) => prev + "\n\n### New Finding\n")}
      />
    </div>
  )
}
