import {
  type PersistedRuleFindingMetadata,
  type RuleFinding,
  type RuleResult,
  persistedRuleFindingMetadataSchema,
  ruleResultSchema
} from '../../../shared/schemas/checks'

function buildWeightedFindingMap(ruleResult: RuleResult) {
  return new Map(ruleResult.weightedFindings.map(item => [item.ruleCode, item]))
}

export function serializeRuleResult(ruleResultJson: unknown): RuleResult {
  return ruleResultSchema.parse(ruleResultJson)
}

export function serializePersistedRuleFindingMetadata(input: {
  finding: RuleFinding
  ruleResult: RuleResult
}): PersistedRuleFindingMetadata {
  const weightedFinding = buildWeightedFindingMap(input.ruleResult).get(input.finding.ruleCode) || null

  return persistedRuleFindingMetadataSchema.parse({
    schema: 'rule_finding.v1',
    explanation: input.finding.explanation,
    scoring: weightedFinding,
    details: input.finding.metadataJson || null
  })
}
