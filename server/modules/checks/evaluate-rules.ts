import { z } from 'zod'

import {
  type RuleFinding,
  ruleEvaluationInputSchema
} from '../../../shared/schemas/checks'
import { mietvertragRules } from './rules/mietvertrag-rules'
import { nebenkostenRules } from './rules/nebenkosten-rules'
import { createRuleContext, type RuleDefinition } from './rules/runtime'

type EvaluatedRulesResult = {
  findings: RuleFinding[]
  riskScore: 'low' | 'medium' | 'high'
  summaryText: string
  ruleResultJson: Record<string, unknown>
}

const rules: RuleDefinition[] = [
  ...mietvertragRules,
  ...nebenkostenRules
]

function buildSummary(checkType: string, findings: RuleFinding[], normalizedText: string) {
  if (!findings.length) {
    if (checkType === 'mietvertrag_check') {
      return 'Initial contract heuristics found no immediate rule flags. Review deposit, notice period, and cleaning clauses manually.'
    }

    if (checkType === 'nebenkosten_check') {
      return 'Initial service charge heuristics found no immediate rule flags. Review line items and supporting receipts manually.'
    }

    return normalizedText.slice(0, 280) || 'Extraction completed.'
  }

  const lead = findings
    .slice(0, 2)
    .map(finding => finding.title)
    .join('; ')

  return `Initial rule evaluation flagged ${findings.length} issue(s): ${lead}.`
}

function severityMultiplier(severity: RuleFinding['severity']) {
  switch (severity) {
    case 'high':
      return 1.5
    case 'warning':
      return 1
    case 'info':
      return 0.5
  }
}

function calculateRiskAggregation(
  findings: RuleFinding[],
  applicableRules: RuleDefinition[]
) {
  const weightsByRule = new Map(applicableRules.map(rule => [rule.code, rule.weight]))
  const weightedFindings = findings.map(finding => {
    const ruleWeight = weightsByRule.get(finding.ruleCode) ?? 1
    const multiplier = severityMultiplier(finding.severity)
    const score = Number((ruleWeight * multiplier).toFixed(2))

    return {
      ruleCode: finding.ruleCode,
      severity: finding.severity,
      ruleWeight,
      severityMultiplier: multiplier,
      score
    }
  })
  const totalScore = Number(weightedFindings.reduce((sum, item) => sum + item.score, 0).toFixed(2))
  const riskScore: EvaluatedRulesResult['riskScore'] =
    totalScore >= 8
      ? 'high'
      : totalScore >= 3
        ? 'medium'
        : 'low'

  return {
    riskScore,
    totalScore,
    weightedFindings
  }
}

export function evaluateRulesForCheck(input: z.input<typeof ruleEvaluationInputSchema>): EvaluatedRulesResult {
  const parsedInput = ruleEvaluationInputSchema.parse(input)
  const context = createRuleContext(parsedInput)
  const applicableRules = rules.filter(rule => rule.appliesTo(context))
  const findings = applicableRules
    .filter(rule => rule.appliesTo(context))
    .flatMap(rule => rule.evaluate(context))
  const aggregation = calculateRiskAggregation(findings, applicableRules)

  return {
    findings,
    riskScore: aggregation.riskScore,
    summaryText: buildSummary(context.checkType, findings, context.normalizedText.replace(/\s+/g, ' ').trim()),
    ruleResultJson: {
      evaluatedAt: new Date().toISOString(),
      findingsCount: findings.length,
      riskScore: aggregation.riskScore,
      riskScoreTotal: aggregation.totalScore,
      riskScoreModel: {
        thresholds: {
          low: '< 3',
          medium: '>= 3 and < 8',
          high: '>= 8'
        }
      },
      weightedFindings: aggregation.weightedFindings,
      rulesTriggered: findings.map(finding => finding.ruleCode),
      ruleDefinitionsEvaluated: applicableRules
        .map(rule => ({
          code: rule.code,
          weight: rule.weight
        }))
    }
  }
}
