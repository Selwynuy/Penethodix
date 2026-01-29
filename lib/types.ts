export interface Engagement {
  id: string
  name: string
  phase: "reconnaissance" | "enumeration" | "exploitation" | "post-exploitation" | "reporting"
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

export interface Suggestion {
  id: string
  title: string
  service: string
  owaspTag: string
  confidence: "high" | "medium" | "low"
  description: string
}

export interface TechniqueInput {
  name: string
  placeholder: string
  description: string
}

export interface Technique {
  id: string
  title: string
  description: string
  inputs: TechniqueInput[]
  commands: string[]
  expectedOutput: string
  notes: string
}

// Knowledge Base Types
export type KnowledgeDomain =
  | "reconnaissance"
  | "enumeration"
  | "exploitation"
  | "post-exploitation"
  | "services"
  | "ports"
  | "tools"
  | "owasp"

export interface KnowledgeEntry {
  id: string
  title: string
  domain: KnowledgeDomain
  phase?: Engagement["phase"]
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
  phase: Engagement["phase"]
  enabled: boolean
  tags: string[]
  conditions: RuleCondition[]
  suggestions: RuleSuggestion[]
  createdAt: string
  updatedAt: string
}
