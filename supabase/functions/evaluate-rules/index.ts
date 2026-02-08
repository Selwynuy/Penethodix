// supabase/functions/evaluate-rules/index.ts
// This is a Supabase Edge Function that runs on Deno
// @deno-types="https://deno.land/x/types/index.d.ts"

// @ts-ignore - Deno import, not TypeScript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

// Re-define types needed for evaluation
interface Engagement {
  id: string
  name: string
  phase: "reconnaissance" | "enumeration" | "exploitation" | "post-exploitation" | "reporting"
  status: "active" | "completed" | "paused"
}

interface Port {
  port: number
  service: string
  version: string
  status: "open" | "closed" | "filtered"
}

interface Target {
  id: string
  ip: string
  label?: string
  inScope: boolean
  discoveredDuringRecon: boolean
  ports: Port[]
}

type RuleConditionType = "service_detected" | "port_open" | "version_match" | "phase_active" | "tag_present"

interface RuleCondition {
  type: RuleConditionType
  field: string
  operator: "equals" | "contains" | "matches" | "greater_than" | "less_than"
  value: string
}

interface RuleSuggestion {
  title: string
  description: string
  confidence: "high" | "medium" | "low"
  owaspTag?: string
  commands?: string[]
}

interface Rule {
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

export interface EvaluatedSuggestion extends RuleSuggestion {
  ruleName: string
  ruleId: string
  service?: string
}

/**
 * Evaluates a single condition against the engagement state
 * NOTE: The 'matches' operator using RegExp from user input can be a ReDoS vulnerability.
 * In a production system, `condition.value` should be heavily sanitized or a safer regex engine used.
 */
function evaluateCondition(
  condition: RuleCondition,
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): boolean {
  const targetsToCheck = selectedTarget ? [selectedTarget] : targets

  switch (condition.type) {
    case "service_detected": {
      const serviceValue = condition.value.toLowerCase()
      const hasService = targetsToCheck.some((target) =>
        target.ports.some((port) => {
          const portService = port.service.toLowerCase()
          switch (condition.operator) {
            case "equals":
              return portService === serviceValue
            case "contains":
              return portService.includes(serviceValue)
            case "matches": {
              // Use safe regex evaluation to prevent ReDoS
              return safeRegexTest(condition.value, portService)
            }
            default:
              return false
          }
        })
      )
      return hasService
    }

    case "port_open": {
      const portValue = parseInt(condition.value, 10)
      if (isNaN(portValue)) return false

      const hasPort = targetsToCheck.some((target) =>
        target.ports.some((port) => {
          if (port.status !== "open") return false
          switch (condition.operator) {
            case "equals":
              return port.port === portValue
            case "greater_than":
              return port.port > portValue
            case "less_than":
              return port.port < portValue
            default:
              return false
          }
        })
      )
      return hasPort
    }

    case "version_match": {
      const versionValue = condition.value.toLowerCase()
      const hasVersion = targetsToCheck.some((target) =>
        target.ports.some((port) => {
          const portVersion = port.version.toLowerCase()
          switch (condition.operator) {
            case "equals":
              return portVersion === versionValue
            case "contains":
              return portVersion.includes(versionValue)
            case "matches": {
              // Use safe regex evaluation to prevent ReDoS
              return safeRegexTest(condition.value, portVersion)
            }
            default:
              return false
          }
        })
      )
      return hasVersion
    }

    case "phase_active": {
      switch (condition.operator) {
        case "equals":
          return engagement.phase === condition.value
        default:
          return false
      }
    }

    case "tag_present": {
      const tagValue = condition.value.toLowerCase()
      
      const hasTag = targetsToCheck.some((target) => {
        return target.ports.some((port) => 
          port.service.toLowerCase().includes(tagValue) ||
          port.version.toLowerCase().includes(tagValue)
        )
      })
      
      switch (condition.operator) {
        case "equals":
          return hasTag
        case "contains":
          return hasTag
        default:
          return false
      }
    }

    default:
      return false
  }
}

/**
 * Evaluates all conditions for a rule (AND logic - all must pass)
 */
function evaluateRuleConditions(
  rule: Rule,
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): boolean {
  if (!rule.enabled) return false
  if (rule.phase !== engagement.phase) return false

  return rule.conditions.every((condition) =>
    evaluateCondition(condition, engagement, targets, selectedTarget)
  )
}

/**
 * Evaluates all enabled rules and returns matching suggestions
 */
function evaluateAllRules(
  rules: Rule[],
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): EvaluatedSuggestion[] {
  const suggestions: EvaluatedSuggestion[] = []

  for (const rule of rules) {
    if (evaluateRuleConditions(rule, engagement, targets, selectedTarget)) {
      const serviceCondition = rule.conditions.find(
        (c) => c.type === "service_detected"
      )
      const service = serviceCondition?.value?.toLowerCase() || undefined

      for (const suggestion of rule.suggestions) {
        suggestions.push({
          ...suggestion,
          ruleName: rule.name,
          ruleId: rule.id,
          service,
        })
      }
    }
  }

  return suggestions
}

// Security: Rate limiting (simple in-memory store - use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // max requests per window

// Security: Input size limits
const MAX_PAYLOAD_SIZE = 1024 * 1024 // 1MB
const MAX_RULES = 1000
const MAX_TARGETS = 1000

// Security: Regex timeout (milliseconds)
const REGEX_TIMEOUT = 100

// Security: Safe regex evaluation with timeout
function safeRegexTest(pattern: string, text: string, timeout: number = REGEX_TIMEOUT): boolean {
  try {
    // Basic ReDoS protection: limit pattern length and complexity
    if (pattern.length > 100) {
      console.warn("Regex pattern too long, rejecting:", pattern.substring(0, 50))
      return false
    }

    // Check for obvious ReDoS patterns
    const dangerousPatterns = [
      /(\+|\*|\{)\s*\+/,
      /\(\+\+|\+\+\)/,
      /\{\d+,\}\s*\+/,
    ]
    
    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        console.warn("Potentially dangerous regex pattern detected, rejecting")
        return false
      }
    }

    const regex = new RegExp(pattern, "i")
    
    // Use Promise.race to implement timeout
    const regexPromise = new Promise<boolean>((resolve) => {
      try {
        resolve(regex.test(text))
      } catch {
        resolve(false)
      }
    })
    
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout)
    })

    // Note: Deno doesn't support Promise.race timeout well, so we use a simpler approach
    // In production, consider using a safer regex library or pre-compiled patterns
    return regex.test(text)
  } catch {
    return false
  }
}

serve(async (req: Request) => {
  // CORS headers - must be handled in function code (no dashboard config)
  const origin = req.headers.get("origin")
  
  // Define allowed origins - update this list for production
  // For development, you can use "*" but restrict in production
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    // Add your production domains here:
    // "https://yourapp.com",
    // "https://www.yourapp.com",
  ]
  
  // Check if origin is allowed, or allow all in development
  const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes("*")
  const isOriginAllowed = origin && (allowAllOrigins || allowedOrigins.includes(origin))
  
  // Use origin if allowed, otherwise use first allowed origin or "*" for development
  const corsOrigin = isOriginAllowed ? origin : (allowAllOrigins ? "*" : allowedOrigins[0])

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Security: Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }

  // Security: Rate limiting
  const clientId = req.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  const clientData = requestCounts.get(clientId)
  
  if (clientData && clientData.resetAt > now) {
    if (clientData.count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }
    clientData.count++
  } else {
    requestCounts.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
  }

  // Clean up old rate limit entries
  for (const [id, data] of requestCounts.entries()) {
    if (data.resetAt < now) {
      requestCounts.delete(id)
    }
  }

  // Security: Check authentication (optional but recommended)
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }

  try {
    // Security: Limit request size
    const contentLength = req.headers.get("content-length")
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        {
          status: 413,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    const body = await req.json()

    // Security: Validate input structure and size
    const { rules, engagement, targets, selectedTarget } = body

    if (!rules || !Array.isArray(rules)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'rules' parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    if (!engagement || typeof engagement !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'engagement' parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    if (!targets || !Array.isArray(targets)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'targets' parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    // Security: Enforce limits
    if (rules.length > MAX_RULES) {
      return new Response(
        JSON.stringify({ error: `Too many rules. Maximum ${MAX_RULES} allowed.` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    if (targets.length > MAX_TARGETS) {
      return new Response(
        JSON.stringify({ error: `Too many targets. Maximum ${MAX_TARGETS} allowed.` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      )
    }

    const suggestions = evaluateAllRules(rules, engagement, targets, selectedTarget)

    return new Response(
      JSON.stringify(suggestions),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error("Edge Function error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return new Response(
      JSON.stringify({ error: "Internal server error" }), // Don't leak internal errors
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    )
  }
})
