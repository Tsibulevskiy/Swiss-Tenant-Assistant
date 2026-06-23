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
  contractReference: {
    normalizedText: string
    searchableText: string
    structuredExtraction: AnyStructuredExtraction | null
  } | null
  previousYearReference: {
    normalizedText: string
    searchableText: string
    structuredExtraction: AnyStructuredExtraction | null
  } | null
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

function parseReferenceDocument(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as {
    normalizedText?: unknown
    structuredExtraction?: unknown
  }
  const normalizedText = typeof record.normalizedText === 'string' ? record.normalizedText : ''
  const structuredDataJson = {
    structuredExtraction: record.structuredExtraction ?? null
  }

  return {
    normalizedText,
    searchableText: normalizeForRules(normalizedText),
    structuredExtraction: parseStructuredExtraction({
      checkType: 'reference',
      rawText: normalizedText,
      normalizedText,
      structuredDataJson
    })
  }
}

function parseReferenceByRole(input: RuleEvaluationInput, role: 'contract_reference' | 'previous_year_reference') {
  if (!input.structuredDataJson || typeof input.structuredDataJson !== 'object') {
    return null
  }

  const referenceDocuments = 'referenceDocuments' in input.structuredDataJson
    ? (input.structuredDataJson as { referenceDocuments?: unknown }).referenceDocuments
    : null

  if (!Array.isArray(referenceDocuments)) {
    return null
  }

  const found = referenceDocuments.find(item =>
    item
    && typeof item === 'object'
    && !Array.isArray(item)
    && 'role' in item
    && (item as { role?: unknown }).role === role
  )

  return parseReferenceDocument(found)
}

export function createRuleContext(input: RuleEvaluationInput): RuleEvaluationContext {
  const rawText = input.rawText || ''
  const normalizedText = input.normalizedText || rawText

  return {
    checkType: input.checkType,
    rawText,
    normalizedText,
    searchableText: normalizeForRules(normalizedText || rawText),
    structuredExtraction: parseStructuredExtraction(input),
    contractReference: parseReferenceByRole(input, 'contract_reference'),
    previousYearReference: parseReferenceByRole(input, 'previous_year_reference')
  }
}

export function buildFinding(input: RuleFinding): RuleFinding {
  return input
}
