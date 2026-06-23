import type { ZodType } from 'zod'
import { z } from 'zod'

type OpenAiResponseRequest = {
  instructions: string
  input: string
  maxOutputTokens?: number
}

type OpenAiStructuredResponseRequest<TOutput> = OpenAiResponseRequest & {
  outputSchema: ZodType<TOutput>
  schemaName: string
}

type OpenAiUsage = {
  inputTokens: number | null
  outputTokens: number | null
}

type OpenAiTextResponse = {
  model: string
  outputText: string
  responseJson: Record<string, unknown>
  usage: OpenAiUsage
}

type OpenAiStructuredResponse<TOutput> = OpenAiTextResponse & {
  parsedOutput: TOutput
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const output = Array.isArray(payload.output) ? payload.output : []

  for (const item of output) {
    const itemRecord = asRecord(item)
    const content = Array.isArray(itemRecord?.content) ? itemRecord.content : []

    for (const contentItem of content) {
      const contentRecord = asRecord(contentItem)

      if (typeof contentRecord?.text === 'string' && contentRecord.text.trim()) {
        return contentRecord.text.trim()
      }
    }
  }

  return ''
}

function extractUsage(payload: Record<string, unknown>): OpenAiUsage {
  const usage = asRecord(payload.usage)

  return {
    inputTokens: typeof usage?.input_tokens === 'number' ? usage.input_tokens : null,
    outputTokens: typeof usage?.output_tokens === 'number' ? usage.output_tokens : null
  }
}

export function isOpenAiConfigured() {
  const config = useRuntimeConfig()

  return Boolean(config.openAiApiKey)
}

export async function createOpenAiTextResponse(input: OpenAiResponseRequest): Promise<OpenAiTextResponse> {
  return createOpenAiResponseRequest(input)
}

async function createOpenAiResponseRequest(
  input: OpenAiResponseRequest & {
    textFormat?: Record<string, unknown>
  }
): Promise<OpenAiTextResponse> {
  const config = useRuntimeConfig()

  if (!config.openAiApiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: config.openAiModel,
      instructions: input.instructions,
      input: input.input,
      max_output_tokens: input.maxOutputTokens ?? 450,
      reasoning: {
        effort: 'low'
      },
      text: {
        verbosity: 'low',
        ...(input.textFormat
          ? { format: input.textFormat }
          : {})
      }
    })
  })

  const payload = await response.json() as unknown
  const payloadRecord = asRecord(payload)

  if (!response.ok || !payloadRecord) {
    const errorPayload = payloadRecord && asRecord(payloadRecord.error)
    const message = typeof errorPayload?.message === 'string'
      ? errorPayload.message
      : `OpenAI request failed with status ${response.status}`

    throw new Error(message)
  }

  const outputText = extractOutputText(payloadRecord)

  if (!outputText) {
    throw new Error('OpenAI response did not contain text output')
  }

  return {
    model: typeof payloadRecord.model === 'string' ? payloadRecord.model : config.openAiModel,
    outputText,
    responseJson: payloadRecord,
    usage: extractUsage(payloadRecord)
  }
}

export async function createOpenAiStructuredResponse<TOutput>(
  input: OpenAiStructuredResponseRequest<TOutput>
): Promise<OpenAiStructuredResponse<TOutput>> {
  const jsonSchema = z.toJSONSchema(input.outputSchema)
  const response = await createOpenAiResponseRequest({
    instructions: input.instructions,
    input: input.input,
    maxOutputTokens: input.maxOutputTokens,
    textFormat: {
      type: 'json_schema',
      strict: true,
      name: input.schemaName,
      schema: jsonSchema
    }
  })

  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(response.outputText)
  } catch {
    throw new Error('OpenAI structured response was not valid JSON')
  }

  const parsedOutput = input.outputSchema.parse(parsedJson)

  return {
    ...response,
    parsedOutput
  }
}
