export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      engagements: {
        Row: {
          id: string
          name: string
          phase: "reconnaissance" | "enumeration" | "exploitation" | "post-exploitation" | "reporting"
          status: "active" | "completed" | "paused"
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phase: "reconnaissance" | "enumeration" | "exploitation" | "post-exploitation" | "reporting"
          status?: "active" | "completed" | "paused"
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phase?: "reconnaissance" | "enumeration" | "exploitation" | "post-exploitation" | "reporting"
          status?: "active" | "completed" | "paused"
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      targets: {
        Row: {
          id: string
          engagement_id: string
          ip: string
          label: string | null
          in_scope: boolean
          discovered_during_recon: boolean
          ports: Json // Array of Port objects
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          engagement_id: string
          ip: string
          label?: string | null
          in_scope?: boolean
          discovered_during_recon?: boolean
          ports?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          engagement_id?: string
          ip?: string
          label?: string | null
          in_scope?: boolean
          discovered_during_recon?: boolean
          ports?: Json
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_entries: {
        Row: {
          id: string
          title: string
          domain: string
          phase: string | null
          service: string | null
          tags: string[]
          owasp_tags: string[]
          description: string
          steps: string[]
          commands: Json // Array of { command: string, description: string }
          notes: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          domain: string
          phase?: string | null
          service?: string | null
          tags?: string[]
          owasp_tags?: string[]
          description: string
          steps?: string[]
          commands?: Json
          notes: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          domain?: string
          phase?: string | null
          service?: string | null
          tags?: string[]
          owasp_tags?: string[]
          description?: string
          steps?: string[]
          commands?: Json
          notes?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rules: {
        Row: {
          id: string
          name: string
          description: string
          phase: string
          enabled: boolean
          tags: string[]
          conditions: Json // Array of RuleCondition
          suggestions: Json // Array of RuleSuggestion
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          phase: string
          enabled?: boolean
          tags?: string[]
          conditions?: Json
          suggestions?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          phase?: string
          enabled?: boolean
          tags?: string[]
          conditions?: Json
          suggestions?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      findings: {
        Row: {
          id: string
          engagement_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          engagement_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          engagement_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
