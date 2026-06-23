export type CheckSummaryPromptInput = {
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
  structuredDataJson: unknown
  fallbackSummaryText: string
}

export const CHECK_SUMMARY_PROMPT_VERSION = 'check_summary.v1'

export const DEFAULT_CHECK_SUMMARY_DISCLAIMER = 'This output is informational only and does not replace legal advice. Review the source document, dates, and amounts before taking action.'

export function buildCheckSummaryPromptInstructions() {
  return [
    'You are generating a short tenant-facing summary for a Swiss tenancy document review.',
    'Write concise, plain-language output.',
    'Do not invent facts beyond the provided findings and extraction data.',
    'Keep the summary to 2-4 sentences.',
    'Keep the disclaimer to 1 sentence.'
  ].join('\n')
}

export function buildCheckSummaryPromptInput(input: CheckSummaryPromptInput) {
  return JSON.stringify({
    checkType: input.checkType,
    riskScore: input.riskScore,
    findings: input.findings.slice(0, 8),
    normalizedTextPreview: input.normalizedText?.slice(0, 4000) || '',
    structuredDataJson: input.structuredDataJson,
    fallbackSummaryText: input.fallbackSummaryText
  })
}
