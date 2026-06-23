import {
  type AnyStructuredExtraction,
  nebenkostenStructuredExtractionSchema,
  mietvertragStructuredExtractionSchema
} from '../../../../shared/schemas/documents'
import type { RuleEvaluationInput, RuleFinding } from '../../../../shared/schemas/checks'

export type RuleEvaluationContext = {
  checkType: string
  rawText: string
  normalizedText: string
  searchableText: string
  structuredExtraction: AnyStructuredExtraction | null
}

export type RuleDefinition = {
  code: string
  weight: number
  appliesTo: (context: RuleEvaluationContext) => boolean
  evaluate: (context: RuleEvaluationContext) => RuleFinding[]
}

export function normalizeForRules(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseStructuredExtraction(input: RuleEvaluationInput) {
  if (!input.structuredDataJson || typeof input.structuredDataJson !== 'object') {
    return null
  }

  const structuredExtraction = 'structuredExtraction' in input.structuredDataJson
    ? (input.structuredDataJson as { structuredExtraction?: unknown }).structuredExtraction
    : null

  if (!structuredExtraction) {
    return null
  }

  const mietvertrag = mietvertragStructuredExtractionSchema.safeParse(structuredExtraction)

  if (mietvertrag.success) {
    return mietvertrag.data
  }

  const nebenkosten = nebenkostenStructuredExtractionSchema.safeParse(structuredExtraction)

  if (nebenkosten.success) {
    return nebenkosten.data
  }

  return null
}

export function createRuleContext(input: RuleEvaluationInput): RuleEvaluationContext {
  const rawText = input.rawText || ''
  const normalizedText = input.normalizedText || rawText

  return {
    checkType: input.checkType,
    rawText,
    normalizedText,
    searchableText: normalizeForRules(normalizedText || rawText),
    structuredExtraction: parseStructuredExtraction(input)
  }
}

export function buildFinding(input: RuleFinding): RuleFinding {
  return input
}
