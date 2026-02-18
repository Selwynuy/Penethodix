"use client"

import { createContext, useContext, ReactNode } from "react"
import { useKnowledge } from "@/hooks/use-knowledge"
import type { KnowledgeEntry } from "@/lib/types"

interface KnowledgeContextType {
  entries: KnowledgeEntry[]
  loading: boolean
  error: Error | null
  createEntry: (entry: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">) => Promise<KnowledgeEntry>
  updateEntry: (id: string, updates: Partial<KnowledgeEntry>) => Promise<KnowledgeEntry>
  deleteEntry: (id: string) => Promise<void>
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined)

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const knowledge = useKnowledge()

  return (
    <KnowledgeContext.Provider value={knowledge}>
      {children}
    </KnowledgeContext.Provider>
  )
}

export function useKnowledgeContext() {
  const context = useContext(KnowledgeContext)
  if (context === undefined) {
    throw new Error("useKnowledgeContext must be used within a KnowledgeProvider")
  }
  return context
}
