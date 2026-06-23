type LetterGenerationPromptInput = {
  type: string
  locale: string
  caseTitle: string | null
  checkType: string | null
  riskScore: string | null
  summaryText: string | null
  findings: Array<{
    severity: string
    title: string
    description: string
  }>
  variables: Array<{
    key: string
    label: string
    value: string
    source: string
  }>
}

export const LETTER_GENERATION_PROMPT_VERSION = 'letter_generation.v1'

const letterTypeHints: Record<string, string> = {
  belege_request: 'Ask for receipts and supporting documents for the utility bill.',
  nebenkosten_objection: 'Draft a concise objection to suspicious or unclear utility bill positions.',
  repair_request: 'Request repair action, describe the defect clearly, and ask for a response timeline.',
  deposit_return_request: 'Request return of the rental deposit and challenge unsupported deductions if needed.',
  rent_increase_objection: 'Object to a rent increase notice in a concise and factual way.'
}

export function buildLetterGenerationPromptInstructions() {
  return [
    'You generate plain-text Swiss tenant letters.',
    'Write in the requested locale.',
    'Use only the provided facts and variables. Do not invent names, dates, or legal claims.',
    'Keep the subject concise and specific.',
    'Keep the body professional, direct, and ready to send as a draft.',
    'Do not use markdown, bullet lists, or unresolved placeholders.'
  ].join('\n')
}

export function buildLetterGenerationPromptInput(input: LetterGenerationPromptInput) {
  return JSON.stringify({
    type: input.type,
    locale: input.locale,
    letterGoal: letterTypeHints[input.type] || 'Draft a tenant letter based on the provided context.',
    caseTitle: input.caseTitle,
    checkType: input.checkType,
    riskScore: input.riskScore,
    summaryText: input.summaryText,
    findings: input.findings.slice(0, 6),
    variables: input.variables
  })
}
