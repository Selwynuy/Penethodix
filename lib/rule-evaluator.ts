import type { Rule, Engagement, Target } from "./types"

export interface EvaluatedSuggestion {
  ruleName: string
  ruleId: string
  service?: string
  title: string
  description: string
  confidence: "high" | "medium" | "low"
  owaspTag?: string
  commands?: string[]
}

export interface GroupedSuggestions {
  [service: string]: EvaluatedSuggestion[]
}

// Supabase Edge Function URL for rule evaluation
const getEvaluateRulesUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    return null
  }
  return `${baseUrl}/functions/v1/evaluate-rules`
}

// Client-side evaluation removed - using Edge Function only for better security and performance

/**
 * Evaluates all enabled rules by calling the Supabase Edge Function.
 * Server-side evaluation provides:
 * - Security: Evaluation logic not exposed to client
 * - Performance: Offloads computation from browser
 * - ReDoS protection: Server-side regex controls
 * - Scalability: Can handle large rule sets efficiently
 * 
 * NOTE: Edge Function must be deployed for this to work.
 * If the function is unavailable, suggestions will be empty (graceful degradation).
 */
export async function evaluateAllRules(
  rules: Rule[],
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): Promise<EvaluatedSuggestion[]> {
  const functionUrl = getEvaluateRulesUrl()
  
  if (!functionUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL not set. Cannot evaluate rules.")
    return []
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
      },
      body: JSON.stringify({ rules, engagement, targets, selectedTarget }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Edge Function failed: ${errorData.error || response.statusText}`)
    }

    const suggestions: EvaluatedSuggestion[] = await response.json()
    return suggestions
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Edge Function request was aborted or timed out")
    } else {
      console.error("Error calling Edge Function:", error)
    }
    // Return empty array - app won't crash, but suggestions won't work
    // This ensures graceful degradation if Edge Function isn't deployed
    return []
  }
}

/**
 * Groups suggestions by service name (can remain client-side as it's not compute-intensive)
 */
export function groupSuggestionsByService(
  suggestions: EvaluatedSuggestion[]
): GroupedSuggestions {
  const grouped: GroupedSuggestions = {}

  for (const suggestion of suggestions) {
    const serviceKey = (suggestion.service || "other").toLowerCase()
    if (!grouped[serviceKey]) {
      grouped[serviceKey] = []
    }
    grouped[serviceKey].push(suggestion)
  }

  // Sort suggestions within each group by confidence (high -> medium -> low)
  const confidenceOrder = { high: 3, medium: 2, low: 1 }
  for (const service in grouped) {
    grouped[service].sort(
      (a, b) =>
        confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    )
  }

  return grouped
}
