import { aiSummaryOutputSchema } from '../../../shared/schemas/ai'
import { runAiStructuredTask } from './ai-service'
import {
  buildCheckSummaryPromptInput,
  buildCheckSummaryPromptInstructions,
  CHECK_SUMMARY_PROMPT_VERSION,
  DEFAULT_CHECK_SUMMARY_DISCLAIMER
} from './prompts/check-summary-prompt'

type GenerateCheckSummaryInput = {
  userId: number
  caseId: number
  checkId: number
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

type GenerateCheckSummaryResult = {
  summaryText: string
  disclaimerText: string
  aiResultJson: Record<string, unknown>
}

export async function generateCheckSummary(input: GenerateCheckSummaryInput): Promise<GenerateCheckSummaryResult> {
  const requestInput = buildCheckSummaryPromptInput(input)
  const result = await runAiStructuredTask({
    userId: input.userId,
    caseId: input.caseId,
    checkId: input.checkId,
    purpose: 'summary',
    promptVersion: CHECK_SUMMARY_PROMPT_VERSION,
    instructions: buildCheckSummaryPromptInstructions(),
    input: requestInput,
    schemaName: 'check_summary_output',
    outputSchema: aiSummaryOutputSchema,
    inputJson: {
      checkType: input.checkType,
      riskScore: input.riskScore,
      findingsCount: input.findings.length,
      requestInput
    }
  })

  if (result.status !== 'completed' || !result.parsedOutput) {
    return {
      summaryText: input.fallbackSummaryText,
      disclaimerText: DEFAULT_CHECK_SUMMARY_DISCLAIMER,
      aiResultJson: result.providerResultJson
    }
  }

  return {
    summaryText: result.parsedOutput.summaryText || input.fallbackSummaryText,
    disclaimerText: result.parsedOutput.disclaimerText || DEFAULT_CHECK_SUMMARY_DISCLAIMER,
    aiResultJson: result.providerResultJson
  }
}
