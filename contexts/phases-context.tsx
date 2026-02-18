"use client"

import { createContext, useContext, ReactNode } from "react"
import { usePhases, type Phase } from "@/hooks/use-phases"

interface PhasesContextType {
  phases: Phase[]
  loading: boolean
  error: Error | null
  createPhase: (phase: Omit<Phase, "id" | "createdAt" | "updatedAt">) => Promise<Phase>
  updatePhase: (id: string, updates: Partial<Phase>) => Promise<Phase>
  deletePhase: (id: string) => Promise<void>
  reorderPhases: (phases: Phase[]) => Promise<void>
}

const PhasesContext = createContext<PhasesContextType | undefined>(undefined)

export function PhasesProvider({ children }: { children: ReactNode }) {
  const phases = usePhases()

  return (
    <PhasesContext.Provider value={phases}>
      {children}
    </PhasesContext.Provider>
  )
}

export function usePhasesContext() {
  const context = useContext(PhasesContext)
  if (context === undefined) {
    throw new Error("usePhasesContext must be used within a PhasesProvider")
  }
  return context
}
