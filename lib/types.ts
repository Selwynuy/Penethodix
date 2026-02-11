export interface Engagement {
  id: string
  name: string
  phase: string // User-defined phase name
  status: "active" | "completed" | "paused"
}

export interface Port {
  port: number
  service: string
  version: string
  status: "open" | "closed" | "filtered"
}

export interface Target {
  id: string
  ip: string
  label?: string
  inScope: boolean
  discoveredDuringRecon: boolean
  ports: Port[]
}

// Knowledge Base Types
export type KnowledgeCategory = string // Now a string to support user-defined categories

export interface KnowledgeEntry {
  id: string
  title: string
  domain: KnowledgeCategory
  phase?: string // User-defined phase name
  service?: string
  tags: string[]
  owaspTags: string[]
  description: string
  steps: string[]
  commands: { command: string; description: string }[]
  notes: string
  createdAt: string
  updatedAt: string
}

// Importable format (excludes sensitive fields: id, createdAt, updatedAt)
export type ImportableKnowledgeEntry = Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">

// Rules Types
export type RuleConditionType = "service_detected" | "port_open" | "version_match" | "phase_active" | "tag_present"

export interface RuleCondition {
  type: RuleConditionType
  field: string
  operator: "equals" | "contains" | "matches" | "greater_than" | "less_than"
  value: string
}

export interface RuleSuggestion {
  title: string
  description: string
  confidence: "high" | "medium" | "low"
  owaspTag?: string
  commands?: string[]
}

export interface Rule {
  id: string
  name: string
  description: string
  phase: string // User-defined phase name
  enabled: boolean
  tags: string[]
  conditions: RuleCondition[]
  suggestions: RuleSuggestion[]
  createdAt: string
  updatedAt: string
}

// Findings Types
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "informational"
export type FindingStatus = "open" | "in_progress" | "retesting" | "closed"

export interface Finding {
  id: string
  engagement_id: string
  target_id?: string | null
  title: string
  severity: FindingSeverity
  status: FindingStatus
  description: string
  created_at: string
  updated_at: string
}
