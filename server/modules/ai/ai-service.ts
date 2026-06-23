import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { aiRuns } from '../../db/schema'
import type { ZodType } from 'zod'

import { createOpenAiStructuredResponse, createOpenAiTextResponse, isOpenAiConfigured } from './openai-responses'

type AiTaskPurpose = 'summary' | 'recommendation' | 'letter_generation' | 'chat' | 'explanation'

type RunAiTextTaskInput = {
  userId: number
  caseId: number | null
  checkId: number | null
  purpose: AiTaskPurpose
  promptVersion: string
  instructions: string
  input: string
  maxOutputTokens?: number
  inputJson?: Record<string, unknown>
}

type RunAiTextTaskResult = {
  status: 'completed' | 'failed' | 'skipped'
  model: string | null
  aiRunId: number | null
  outputText: string | null
  usage: {
    inputTokens: number | null
    outputTokens: number | null
  } | null
  errorMessage: string | null
  providerResultJson: Record<string, unknown>
}

type RunAiStructuredTaskInput<TOutput> = Omit<RunAiTextTaskInput, 'input'> & {
  input: string
  schemaName: string
  outputSchema: ZodType<TOutput>
}

type RunAiStructuredTaskResult<TOutput> = Omit<RunAiTextTaskResult, 'outputText'> & {
  outputText: string | null
  parsedOutput: TOutput | null
}

export async function runAiTextTask(input: RunAiTextTaskInput): Promise<RunAiTextTaskResult> {
  return runBaseAiTask(input, async () => createOpenAiTextResponse({
    instructions: input.instructions,
    input: input.input,
    maxOutputTokens: input.maxOutputTokens
  }))
}

export async function runAiStructuredTask<TOutput>(
  input: RunAiStructuredTaskInput<TOutput>
): Promise<RunAiStructuredTaskResult<TOutput>> {
  const result = await runBaseAiTask(input, async () => createOpenAiStructuredResponse({
    instructions: input.instructions,
    input: input.input,
    maxOutputTokens: input.maxOutputTokens,
    schemaName: input.schemaName,
    outputSchema: input.outputSchema
  }))

  return {
    ...result,
    parsedOutput: 'parsedOutput' in result ? result.parsedOutput as TOutput : null
  }
}

async function runBaseAiTask<TResponse extends {
  model: string
  outputText: string
  responseJson: Record<string, unknown>
  usage: {
    inputTokens: number | null
    outputTokens: number | null
  }
}>(
  input: RunAiTextTaskInput,
  execute: () => Promise<TResponse>
): Promise<RunAiTextTaskResult & Partial<{ parsedOutput: unknown }>> {
  const config = useRuntimeConfig()

  if (!isOpenAiConfigured()) {
    return {
      status: 'skipped',
      model: null,
      aiRunId: null,
      outputText: null,
      usage: null,
      errorMessage: 'OpenAI API key is not configured',
      providerResultJson: {
        provider: 'openai',
        purpose: input.purpose,
        status: 'skipped',
        reason: 'OpenAI API key is not configured'
      }
    }
  }

  const db = getDb()
  const createdAt = new Date()

  const insertResult = await db.insert(aiRuns).values({
    userId: input.userId,
    caseId: input.caseId,
    checkId: input.checkId,
    purpose: input.purpose,
    model: config.openAiModel,
    promptVersion: input.promptVersion,
    inputJson: input.inputJson ?? {
      requestInput: input.input
    },
    status: 'pending',
    createdAt
  })

  const aiRunId = Number(insertResult[0].insertId)

  try {
    const response = await execute()
    const finishedAt = new Date()

    await db
      .update(aiRuns)
      .set({
        status: 'completed',
        outputJson: {
          response: response.responseJson,
          ...('parsedOutput' in response
            ? { parsedOutput: response.parsedOutput }
            : {})
        },
        tokenInput: response.usage.inputTokens ?? undefined,
        tokenOutput: response.usage.outputTokens ?? undefined,
        finishedAt,
        errorMessage: null
      })
      .where(eq(aiRuns.id, aiRunId))

    return {
      status: 'completed',
      model: response.model,
      aiRunId,
      outputText: response.outputText,
      usage: response.usage,
      errorMessage: null,
      ...('parsedOutput' in response
        ? { parsedOutput: response.parsedOutput }
        : {}),
      providerResultJson: {
        provider: 'openai',
        status: 'completed',
        aiRunId,
        model: response.model,
        promptVersion: input.promptVersion,
        usage: response.usage
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenAI request failed'

    await db
      .update(aiRuns)
      .set({
        status: 'failed',
        errorMessage: message,
        finishedAt: new Date()
      })
      .where(eq(aiRuns.id, aiRunId))

    return {
      status: 'failed',
      model: config.openAiModel,
      aiRunId,
      outputText: null,
      usage: null,
      errorMessage: message,
      providerResultJson: {
        provider: 'openai',
        status: 'failed',
        aiRunId,
        model: config.openAiModel,
        promptVersion: input.promptVersion,
        errorMessage: message
      }
    }
  }
}
