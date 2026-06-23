import { and, desc, eq } from 'drizzle-orm'

import { aiLetterGenerationOutputSchema } from '../../../shared/schemas/ai'
import { anyStructuredExtractionSchema } from '../../../shared/schemas/documents'
import type { CreateLetterDraftInput, GeneratedLetterDraft, LetterVariable } from '../../../shared/schemas/letters'
import { getDb } from '../../db/client'
import { cases, checks, documents, letters, ruleFindings } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { runAiStructuredTask } from '../ai/ai-service'
import {
  buildLetterGenerationPromptInput,
  buildLetterGenerationPromptInstructions,
  LETTER_GENERATION_PROMPT_VERSION
} from '../ai/prompts/letter-generation-prompt'
import { mvpLetterTypeDefinitions } from './mvp-letter-types'

type CheckContext = {
  id: number
  caseId: number
  caseTitle: string
  type: string
  riskScore: 'low' | 'medium' | 'high' | null
  summaryText: string | null
  structuredInputJson: unknown
  aiResultJson: unknown
  primaryDocumentName: string | null
}

type CaseContext = {
  id: number
  title: string
}

function normalizeLocale(locale: string) {
  const lower = locale.toLowerCase()

  return lower.startsWith('de') ? 'de' : 'en'
}

function prettifyVariableLabel(key: string) {
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function toVariableValue(value: string | number | boolean) {
  return typeof value === 'string' ? value.trim() : String(value)
}

function pushUniqueVariable(target: LetterVariable[], variable: LetterVariable) {
  if (!variable.value.trim()) {
    return
  }

  const existingIndex = target.findIndex(item => item.key === variable.key)

  if (existingIndex >= 0) {
    target[existingIndex] = variable
    return
  }

  target.push(variable)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function deriveStructuredVariables(structuredInputJson: unknown) {
  const parsed = anyStructuredExtractionSchema.safeParse(structuredInputJson)

  if (!parsed.success) {
    return [] as LetterVariable[]
  }

  const extracted = parsed.data.extracted
  const derived: LetterVariable[] = []

  if ('propertyAddress' in extracted && extracted.propertyAddress) {
    derived.push({
      key: 'property_address',
      label: 'Property Address',
      value: extracted.propertyAddress,
      source: 'check_context'
    })
  }

  if ('billingPeriodStart' in extracted && extracted.billingPeriodStart) {
    derived.push({
      key: 'billing_period_start',
      label: 'Billing Period Start',
      value: extracted.billingPeriodStart,
      source: 'check_context'
    })
  }

  if ('billingPeriodEnd' in extracted && extracted.billingPeriodEnd) {
    derived.push({
      key: 'billing_period_end',
      label: 'Billing Period End',
      value: extracted.billingPeriodEnd,
      source: 'check_context'
    })
  }

  if ('balanceChf' in extracted && typeof extracted.balanceChf === 'number') {
    derived.push({
      key: 'balance_chf',
      label: 'Balance CHF',
      value: `CHF ${extracted.balanceChf.toFixed(2)}`,
      source: 'check_context'
    })
  }

  if ('monthlyRentChf' in extracted && typeof extracted.monthlyRentChf === 'number') {
    derived.push({
      key: 'monthly_rent_chf',
      label: 'Monthly Rent CHF',
      value: `CHF ${extracted.monthlyRentChf.toFixed(2)}`,
      source: 'check_context'
    })
  }

  if ('depositAmountChf' in extracted && typeof extracted.depositAmountChf === 'number') {
    derived.push({
      key: 'deposit_amount_chf',
      label: 'Deposit Amount CHF',
      value: `CHF ${extracted.depositAmountChf.toFixed(2)}`,
      source: 'check_context'
    })
  }

  if ('leaseStartDate' in extracted && extracted.leaseStartDate) {
    derived.push({
      key: 'lease_start_date',
      label: 'Lease Start Date',
      value: extracted.leaseStartDate,
      source: 'check_context'
    })
  }

  return derived
}

function deriveRecommendedActionVariables(aiResultJson: unknown) {
  const result = asRecord(aiResultJson)
  const recommendedAction = asRecord(result?.recommendedAction)
  const variables: LetterVariable[] = []

  if (typeof recommendedAction?.title === 'string' && recommendedAction.title.trim()) {
    variables.push({
      key: 'recommended_action_title',
      label: 'Recommended Action',
      value: recommendedAction.title.trim(),
      source: 'check_context'
    })
  }

  if (typeof recommendedAction?.body === 'string' && recommendedAction.body.trim()) {
    variables.push({
      key: 'recommended_action_body',
      label: 'Recommended Action Detail',
      value: recommendedAction.body.trim(),
      source: 'check_context'
    })
  }

  return variables
}

function buildLetterVariables(input: {
  type: CreateLetterDraftInput['type']
  locale: string
  caseContext: CaseContext | null
  checkContext: CheckContext | null
  userVariables: Record<string, string | number | boolean>
  findings: Array<{
    title: string
    description: string
  }>
}) {
  const variables: LetterVariable[] = []

  for (const [key, value] of Object.entries(input.userVariables)) {
    pushUniqueVariable(variables, {
      key,
      label: prettifyVariableLabel(key),
      value: toVariableValue(value),
      source: 'user_input'
    })
  }

  pushUniqueVariable(variables, {
    key: 'letter_type',
    label: 'Letter Type',
    value: input.type,
    source: 'system'
  })

  if (input.caseContext) {
    pushUniqueVariable(variables, {
      key: 'case_title',
      label: 'Case Title',
      value: input.caseContext.title,
      source: 'check_context'
    })
  }

  if (input.checkContext?.primaryDocumentName) {
    pushUniqueVariable(variables, {
      key: 'source_document_name',
      label: 'Source Document',
      value: input.checkContext.primaryDocumentName,
      source: 'check_context'
    })
  }

  if (input.checkContext?.riskScore) {
    pushUniqueVariable(variables, {
      key: 'risk_score',
      label: 'Risk Score',
      value: input.checkContext.riskScore,
      source: 'check_context'
    })
  }

  if (input.checkContext?.summaryText) {
    pushUniqueVariable(variables, {
      key: 'check_summary',
      label: 'Check Summary',
      value: input.checkContext.summaryText,
      source: 'check_context'
    })
  }

  for (const variable of deriveStructuredVariables(input.checkContext?.structuredInputJson ?? null)) {
    pushUniqueVariable(variables, variable)
  }

  for (const variable of deriveRecommendedActionVariables(input.checkContext?.aiResultJson ?? null)) {
    pushUniqueVariable(variables, variable)
  }

  if (input.findings.length) {
    pushUniqueVariable(variables, {
      key: 'top_findings',
      label: 'Top Findings',
      value: input.findings.map(item => item.title).slice(0, 3).join('; '),
      source: 'check_context'
    })
  }

  if (input.locale === 'de') {
    pushUniqueVariable(variables, {
      key: 'response_request',
      label: 'Response Request',
      value: 'Bitte bestaetigen Sie den Eingang und teilen Sie mir das weitere Vorgehen schriftlich mit.',
      source: 'system'
    })
  } else {
    pushUniqueVariable(variables, {
      key: 'response_request',
      label: 'Response Request',
      value: 'Please confirm receipt and reply in writing with the next steps.',
      source: 'system'
    })
  }

  return variables
}

function buildFallbackLetterDraft(input: {
  type: CreateLetterDraftInput['type']
  locale: string
  variables: LetterVariable[]
  caseTitle: string | null
  findings: Array<{
    title: string
    description: string
  }>
}) {
  const variableMap = new Map(input.variables.map(variable => [variable.key, variable.value]))
  const subjectBase = {
    belege_request: input.locale === 'de' ? 'Anforderung von Belegen zur Nebenkostenabrechnung' : 'Request for utility bill supporting documents',
    nebenkosten_objection: input.locale === 'de' ? 'Einwand gegen Nebenkostenabrechnung' : 'Objection to utility bill',
    repair_request: input.locale === 'de' ? 'Meldung eines Mangels und Reparaturanfrage' : 'Repair request',
    deposit_return_request: input.locale === 'de' ? 'Rueckzahlung des Mietdepots' : 'Deposit return request',
    rent_increase_objection: input.locale === 'de' ? 'Einwand gegen Mietzinserhoehung' : 'Objection to rent increase notice'
  }[input.type]

  const findingsText = input.findings.length
    ? input.findings.map(item => `- ${item.title}: ${item.description}`).join('\n')
    : null

  if (input.locale === 'de') {
    const bodyParts = [
      'Guten Tag',
      '',
      (() => {
        switch (input.type) {
          case 'belege_request':
            return 'Ich bitte um Zustellung der Belege und Abrechnungsgrundlagen zur vorliegenden Nebenkostenabrechnung.'
          case 'nebenkosten_objection':
            return 'Ich erhebe Einwand gegen die vorliegende Nebenkostenabrechnung und bitte um Pruefung der unten genannten Punkte.'
          case 'repair_request':
            return 'Hiermit melde ich einen Mangel in der Mietwohnung und bitte um zeitnahe Behebung.'
          case 'deposit_return_request':
            return 'Ich bitte um Rueckzahlung des Mietdepots beziehungsweise um nachvollziehbare Begruendung fuer allfaellige Abzuege.'
          case 'rent_increase_objection':
            return 'Ich erhebe Einwand gegen die angekuendigte Mietzinserhoehung und bitte um schriftliche Stellungnahme.'
        }
      })(),
      variableMap.get('check_summary') || '',
      findingsText || '',
      variableMap.get('response_request') || '',
      '',
      'Freundliche Gruesse'
    ].filter(Boolean)

    return {
      subject: input.caseTitle ? `${subjectBase} - ${input.caseTitle}` : subjectBase,
      bodyText: bodyParts.join('\n')
    }
  }

  const bodyParts = [
    'Hello,',
    '',
    (() => {
      switch (input.type) {
        case 'belege_request':
          return 'I request the supporting receipts and billing documents for the utility bill under review.'
        case 'nebenkosten_objection':
          return 'I object to the current utility bill and ask for a written review of the points listed below.'
        case 'repair_request':
          return 'I am reporting a defect in the rental property and request timely repair action.'
        case 'deposit_return_request':
          return 'I request the return of the rental deposit or a clear written explanation for any deductions.'
        case 'rent_increase_objection':
          return 'I object to the announced rent increase and request a written explanation.'
      }
    })(),
    variableMap.get('check_summary') || '',
    findingsText || '',
    variableMap.get('response_request') || '',
    '',
    'Kind regards'
  ].filter(Boolean)

  return {
    subject: input.caseTitle ? `${subjectBase} - ${input.caseTitle}` : subjectBase,
    bodyText: bodyParts.join('\n')
  }
}

async function getCaseContext(userId: number, caseId: number): Promise<CaseContext | null> {
  const db = getDb()

  const found = await db.query.cases.findFirst({
    where: and(eq(cases.id, caseId), eq(cases.userId, userId)),
    columns: {
      id: true,
      title: true
    }
  })

  return found || null
}

async function getCheckContext(userId: number, checkId: number): Promise<CheckContext | null> {
  const db = getDb()
  const [found] = await db
    .select({
      id: checks.id,
      caseId: checks.caseId,
      type: checks.type,
      riskScore: checks.riskScore,
      summaryText: checks.summaryText,
      structuredInputJson: checks.structuredInputJson,
      aiResultJson: checks.aiResultJson,
      caseTitle: cases.title
    })
    .from(checks)
    .innerJoin(cases, eq(checks.caseId, cases.id))
    .where(and(eq(checks.id, checkId), eq(checks.userId, userId)))
    .limit(1)

  if (!found) {
    return null
  }

  const [primaryDocument] = await db
    .select({
      originalName: documents.originalName
    })
    .from(documents)
    .where(eq(documents.caseId, found.caseId))
    .orderBy(desc(documents.createdAt))
    .limit(1)

  return {
    id: found.id,
    caseId: found.caseId,
    caseTitle: found.caseTitle,
    type: found.type,
    riskScore: found.riskScore,
    summaryText: found.summaryText,
    structuredInputJson: found.structuredInputJson,
    aiResultJson: found.aiResultJson,
    primaryDocumentName: primaryDocument?.originalName || null
  }
}

async function getCheckFindings(checkId: number) {
  const db = getDb()

  return db
    .select({
      severity: ruleFindings.severity,
      title: ruleFindings.title,
      description: ruleFindings.description
    })
    .from(ruleFindings)
    .where(eq(ruleFindings.checkId, checkId))
    .orderBy(desc(ruleFindings.createdAt))
}

function alignVariablesWithSources(
  generatedVariables: Array<{
    key: string
    label: string
    value: string
  }>,
  sourceVariables: LetterVariable[]
): LetterVariable[] {
  return generatedVariables.map(variable => ({
    ...variable,
    source: sourceVariables.find(item => item.key === variable.key)?.source || 'system'
  }))
}

export async function generateLetterDraft(
  input: CreateLetterDraftInput,
  user: AuthUser
): Promise<GeneratedLetterDraft> {
  const db = getDb()
  const definition = mvpLetterTypeDefinitions.find(item => item.type === input.type)

  if (!definition) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported letter type'
    })
  }

  const locale = normalizeLocale(input.locale || user.locale || 'de')
  const checkContext = input.checkId ? await getCheckContext(user.id, input.checkId) : null

  if (input.checkId && !checkContext) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Check not found'
    })
  }

  if (definition.trigger === 'document_check' && !checkContext) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This letter type requires a related check'
    })
  }

  const resolvedCaseId = input.caseId ?? checkContext?.caseId ?? null
  const caseContext = resolvedCaseId ? await getCaseContext(user.id, resolvedCaseId) : null

  if (resolvedCaseId && !caseContext) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found'
    })
  }

  if (caseContext && checkContext && caseContext.id !== checkContext.caseId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'The provided caseId does not match the check'
    })
  }

  const findings = checkContext ? await getCheckFindings(checkContext.id) : []
  const variables = buildLetterVariables({
    type: input.type,
    locale,
    caseContext,
    checkContext,
    userVariables: input.variables,
    findings
  })
  const requestInput = buildLetterGenerationPromptInput({
    type: input.type,
    locale,
    caseTitle: caseContext?.title || checkContext?.caseTitle || null,
    checkType: checkContext?.type || null,
    riskScore: checkContext?.riskScore || null,
    summaryText: checkContext?.summaryText || null,
    findings,
    variables
  })
  const aiResult = await runAiStructuredTask({
    userId: user.id,
    caseId: resolvedCaseId,
    checkId: checkContext?.id || null,
    purpose: 'letter_generation',
    promptVersion: LETTER_GENERATION_PROMPT_VERSION,
    instructions: buildLetterGenerationPromptInstructions(),
    input: requestInput,
    schemaName: 'letter_generation_output',
    outputSchema: aiLetterGenerationOutputSchema,
    inputJson: {
      type: input.type,
      locale,
      caseId: resolvedCaseId,
      checkId: checkContext?.id || null,
      variables,
      requestInput
    }
  })

  const fallbackDraft = buildFallbackLetterDraft({
    type: input.type,
    locale,
    variables,
    caseTitle: caseContext?.title || checkContext?.caseTitle || null,
    findings
  })

  const subject = aiResult.status === 'completed' && aiResult.parsedOutput
    ? aiResult.parsedOutput.subject
    : fallbackDraft.subject
  const bodyText = aiResult.status === 'completed' && aiResult.parsedOutput
    ? aiResult.parsedOutput.bodyText
    : fallbackDraft.bodyText
  const outputVariables = aiResult.status === 'completed' && aiResult.parsedOutput
    ? aiResult.parsedOutput.variables.length
      ? alignVariablesWithSources(aiResult.parsedOutput.variables, variables)
      : variables
    : variables

  const insertResult = await db.insert(letters).values({
    userId: user.id,
    caseId: resolvedCaseId ?? undefined,
    checkId: checkContext?.id ?? undefined,
    type: input.type,
    locale,
    subject,
    bodyText,
    status: 'generated'
  })

  const id = Number(insertResult[0].insertId)

  return {
    id,
    caseId: resolvedCaseId,
    checkId: checkContext?.id || null,
    type: input.type,
    locale,
    status: 'generated',
    subject,
    bodyText,
    variables: outputVariables,
    aiResultJson: aiResult.providerResultJson
  }
}
