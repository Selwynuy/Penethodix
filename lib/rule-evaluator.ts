import type { Rule, RuleCondition, RuleSuggestion, Engagement, Target } from "./types"

export interface EvaluatedSuggestion extends RuleSuggestion {
  ruleName: string
  ruleId: string
  service?: string
}

export interface GroupedSuggestions {
  [service: string]: EvaluatedSuggestion[]
}

/**
 * Evaluates a single condition against the engagement state
 */
function evaluateCondition(
  condition: RuleCondition,
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): boolean {
  // If a target is selected, only evaluate against that target
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
              try {
                const regex = new RegExp(condition.value, "i")
                return regex.test(portService)
              } catch {
                return false
              }
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
              try {
                const regex = new RegExp(condition.value, "i")
                return regex.test(portVersion)
              } catch {
                return false
              }
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
      // Check if tag exists in target tags, engagement tags, or rule tags
      const tagValue = condition.value.toLowerCase()
      
      // Check engagement tags (if we add them to engagement model)
      // For now, check if any target has matching tags
      const hasTag = targetsToCheck.some((target) => {
        // Check if target has tags (extend Target type if needed)
        // For now, we'll check if the tag matches any service name as a workaround
        // In a full implementation, you'd add a tags field to Target
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
export function evaluateRuleConditions(
  rule: Rule,
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): boolean {
  if (!rule.enabled) return false
  if (rule.phase !== engagement.phase) return false

  // All conditions must pass (AND logic)
  return rule.conditions.every((condition) =>
    evaluateCondition(condition, engagement, targets, selectedTarget)
  )
}

/**
 * Evaluates all enabled rules and returns matching suggestions
 */
export function evaluateAllRules(
  rules: Rule[],
  engagement: Engagement,
  targets: Target[],
  selectedTarget?: Target | null
): EvaluatedSuggestion[] {
  const suggestions: EvaluatedSuggestion[] = []

  for (const rule of rules) {
    if (evaluateRuleConditions(rule, engagement, targets, selectedTarget)) {
      // Extract service from conditions for grouping
      const serviceCondition = rule.conditions.find(
        (c) => c.type === "service_detected"
      )
      const service = serviceCondition?.value?.toLowerCase() || undefined

      // Add all suggestions from this rule
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

/**
 * Groups suggestions by service name
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
