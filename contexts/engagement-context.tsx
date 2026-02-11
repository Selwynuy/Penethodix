"use client"

import { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from "react"
import type { Engagement } from "@/lib/types"
import { useEngagements } from "@/hooks/use-engagements"

interface EngagementContextType {
  engagements: Engagement[]
  activeEngagement: Engagement | null
  setActiveEngagement: (engagement: Engagement | null, skipAutoSelect?: boolean) => void
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
  
  const [activeEngagement, setActiveEngagementState] = useState<Engagement | null>(null)
  const skipAutoSelectRef = useRef(false)

  // Wrapper to handle skipAutoSelect flag
  const setActiveEngagement = (engagement: Engagement | null, skipAutoSelectFlag: boolean = false) => {
    skipAutoSelectRef.current = skipAutoSelectFlag
    setActiveEngagementState(engagement)
    // Reset the flag after a brief moment (only if we're setting to null)
    if (engagement === null && skipAutoSelectFlag) {
      // Keep it true for now, will reset when engagement is explicitly selected
    } else if (engagement !== null) {
      // Reset when an engagement is explicitly selected
      skipAutoSelectRef.current = false
    }
  }

  // Set first engagement as active when engagements load (unless skipAutoSelect is true)
  useEffect(() => {
    if (engagements.length > 0 && !activeEngagement && !skipAutoSelectRef.current) {
      setActiveEngagementState(engagements[0])
    }
  }, [engagements, activeEngagement])

  // Clear active engagement if it's been deleted
  useEffect(() => {
    if (activeEngagement && !engagements.find((e) => e.id === activeEngagement.id)) {
      setActiveEngagementState(engagements.length > 0 ? engagements[0] : null)
    }
  }, [engagements, activeEngagement])

  // Update active engagement when it's updated in the engagements array
  useEffect(() => {
    if (activeEngagement) {
      const updatedEngagement = engagements.find((e) => e.id === activeEngagement.id)
      if (updatedEngagement) {
        setActiveEngagementState(updatedEngagement)
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
