import { aiRecommendationOutputSchema } from '../../../shared/schemas/ai'
import { runAiStructuredTask } from './ai-service'
import {
  buildCheckRecommendationPromptInput,
  buildCheckRecommendationPromptInstructions,
  CHECK_RECOMMENDATION_PROMPT_VERSION
} from './prompts/check-recommendation-prompt'

type GenerateCheckRecommendationInput = {
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
  summaryText: string
}

type RecommendedAction = {
  level: string
  title: string
  body: string
}

type GenerateCheckRecommendationResult = {
  recommendedAction: RecommendedAction | null
  aiResultJson: Record<string, unknown>
}

export async function generateCheckRecommendation(input: GenerateCheckRecommendationInput): Promise<GenerateCheckRecommendationResult> {
  const requestInput = buildCheckRecommendationPromptInput(input)
  const result = await runAiStructuredTask({
    userId: input.userId,
    caseId: input.caseId,
    checkId: input.checkId,
    purpose: 'recommendation',
    promptVersion: CHECK_RECOMMENDATION_PROMPT_VERSION,
    instructions: buildCheckRecommendationPromptInstructions(),
    input: requestInput,
    schemaName: 'check_recommendation_output',
    outputSchema: aiRecommendationOutputSchema,
    inputJson: {
      checkType: input.checkType,
      riskScore: input.riskScore,
      findingsCount: input.findings.length,
      requestInput
    }
  })

  if (result.status !== 'completed' || !result.parsedOutput) {
    return {
      recommendedAction: null,
      aiResultJson: result.providerResultJson
    }
  }

  return {
    recommendedAction: {
      level: result.parsedOutput.level,
      title: result.parsedOutput.title,
      body: result.parsedOutput.body
    },
    aiResultJson: result.providerResultJson
  }
}
