export type CheckRecommendationPromptInput = {
  checkType: string
  riskScore: 'low' | 'medium' | 'high'
  findings: Array<{
    ruleCode: string
    severity: string
    title: string
    description: string
    matchedValue?: string | null
  }>
  normalizedText: string | null
  summaryText: string
}

export const CHECK_RECOMMENDATION_PROMPT_VERSION = 'check_recommendation.v1'

export function buildCheckRecommendationPromptInstructions() {
  return [
    'You are generating the next recommended tenant action for a Swiss tenancy document review.',
    'Base the recommendation only on the provided findings, risk score, and summary.',
    'Be concrete and cautious. Do not give legal representation or absolute legal conclusions.',
    'Keep the title short.',
    'Keep the body to 2-4 sentences.'
  ].join('\n')
}

export function buildCheckRecommendationPromptInput(input: CheckRecommendationPromptInput) {
  return JSON.stringify({
    checkType: input.checkType,
    riskScore: input.riskScore,
    findings: input.findings.slice(0, 8),
    normalizedTextPreview: input.normalizedText?.slice(0, 2500) || '',
    summaryText: input.summaryText
  })
}
