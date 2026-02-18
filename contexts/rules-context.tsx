"use client"

import { createContext, useContext, ReactNode } from "react"
import { useRules } from "@/hooks/use-rules"
import type { Rule } from "@/lib/types"

interface RulesContextType {
  rules: Rule[]
  loading: boolean
  error: Error | null
  createRule: (rule: Omit<Rule, "id" | "createdAt" | "updatedAt">) => Promise<Rule>
  updateRule: (id: string, updates: Partial<Rule>) => Promise<Rule>
  duplicateRule: (id: string) => Promise<Rule>
  deleteRule: (id: string) => Promise<void>
}

const RulesContext = createContext<RulesContextType | undefined>(undefined)

export function RulesProvider({ children }: { children: ReactNode }) {
  const rules = useRules()

  return (
    <RulesContext.Provider value={rules}>
      {children}
    </RulesContext.Provider>
  )
}

export function useRulesContext() {
  const context = useContext(RulesContext)
  if (context === undefined) {
    throw new Error("useRulesContext must be used within a RulesProvider")
  }
  return context
}
