"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import type { Engagement } from "@/lib/types"
import { useEngagements } from "@/hooks/use-engagements"

interface EngagementContextType {
  engagements: Engagement[]
  activeEngagement: Engagement | null
  setActiveEngagement: (engagement: Engagement | null) => void
  createEngagement: (engagement: Omit<Engagement, "id">) => Promise<Engagement>
  updateEngagement: (id: string, updates: Partial<Engagement>) => Promise<Engagement>
  deleteEngagement: (id: string) => Promise<void>
  loading: boolean
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined)

export function EngagementProvider({ children }: { children: ReactNode }) {
  const {
    engagements,
    loading,
    createEngagement,
    updateEngagement,
    deleteEngagement,
  } = useEngagements()
  
  const [activeEngagement, setActiveEngagement] = useState<Engagement | null>(null)

  // Set first engagement as active when engagements load
  useEffect(() => {
    if (engagements.length > 0 && !activeEngagement) {
      setActiveEngagement(engagements[0])
    }
  }, [engagements, activeEngagement])

  // Clear active engagement if it's been deleted
  useEffect(() => {
    if (activeEngagement && !engagements.find((e) => e.id === activeEngagement.id)) {
      setActiveEngagement(engagements.length > 0 ? engagements[0] : null)
    }
  }, [engagements, activeEngagement])

  // Update active engagement when it's updated in the engagements array
  useEffect(() => {
    if (activeEngagement) {
      const updatedEngagement = engagements.find((e) => e.id === activeEngagement.id)
      if (updatedEngagement) {
        setActiveEngagement(updatedEngagement)
      }
    }
  }, [engagements, activeEngagement])
  
  const value = useMemo(() => ({
    engagements,
    activeEngagement,
    setActiveEngagement,
    createEngagement,
    updateEngagement,
    deleteEngagement,
    loading,
  }), [
    engagements,
    activeEngagement,
    createEngagement,
    updateEngagement,
    deleteEngagement,
    loading
  ])

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  )
}

export function useEngagementContext() {
  const context = useContext(EngagementContext)
  if (context === undefined) {
    throw new Error("useEngagementContext must be used within an EngagementProvider")
  }
  return context
}
