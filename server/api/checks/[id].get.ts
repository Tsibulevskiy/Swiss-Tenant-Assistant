import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { checkDocuments, checks, cases, documentExtractions, documents, ruleFindings } from '../../db/schema'
import { deriveCheckProcessingStatus } from '../../modules/checks/processing-status'
import { getEffectiveCheckStatus, resolveCheckPaymentGate } from '../../modules/payments/check-payment-gating'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

function buildRecommendedAction(input: {
  status: string
  processingCode: string
  riskScore: string | null
  findingsCount: number
  summaryText: string | null
  aiResultJson?: unknown
}) {
  const aiResult = input.aiResultJson && typeof input.aiResultJson === 'object'
    ? input.aiResultJson as {
      recommendedAction?: {
        level?: string
        title?: string
        body?: string
      }
    }
    : null
  const aiRecommendedAction = aiResult?.recommendedAction

  if (
    aiRecommendedAction
    && typeof aiRecommendedAction.level === 'string'
    && typeof aiRecommendedAction.title === 'string'
    && typeof aiRecommendedAction.body === 'string'
  ) {
    return {
      level: aiRecommendedAction.level,
      title: aiRecommendedAction.title,
      body: aiRecommendedAction.body
    }
  }

  if (input.status === 'failed') {
    return {
      level: 'attention',
      title: 'Review the failed extraction',
      body: 'The check could not complete successfully. Re-upload the document or inspect the extraction issue before relying on the result.'
    }
  }

  if (input.processingCode === 'extracting' || input.processingCode === 'normalizing' || input.processingCode === 'structuring' || input.processingCode === 'evaluating_rules' || input.processingCode === 'generating_summary') {
    return {
      level: 'info',
      title: 'Analysis is in progress',
      body: 'The document is moving through extraction and rule evaluation. Return once the summary is ready.'
    }
  }

  if (input.status === 'payment_required') {
    return {
      level: 'attention',
      title: 'Unlock the full result',
      body: 'A preview is available now. Complete payment to unlock the full summary, findings, and extracted text.'
    }
  }

  if (input.findingsCount > 0 || input.riskScore === 'high') {
    return {
      level: 'warning',
      title: 'Review findings before taking action',
      body: 'Inspect the extracted text and rule findings carefully. Prepare a tenant response only after checking dates, amounts, and clauses.'
    }
  }

  if (input.status === 'ready') {
    return {
      level: 'positive',
      title: 'Proceed with the next tenant step',
      body: 'The extraction completed successfully. You can now review the summary, validate the document text, and prepare the next workflow step.'
    }
  }

  return {
    level: 'info',
    title: 'Wait for the analysis to complete',
    body: 'This check is still being processed. Return to this page once extraction and analysis finish.'
  }
}

export default defineAuthenticatedEventHandler(async (event, user) => {
  const checkId = Number(event.context.params?.id)

  if (!Number.isInteger(checkId) || checkId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid check id'
    })
  }

  const db = getDb()

  const [check] = await db
    .select({
      id: checks.id,
      caseId: checks.caseId,
      caseTitle: cases.title,
      type: checks.type,
      status: checks.status,
      inputPayloadJson: checks.inputPayloadJson,
      riskScore: checks.riskScore,
      summaryText: checks.summaryText,
      disclaimerText: checks.disclaimerText,
      aiResultJson: checks.aiResultJson,
      errorMessage: checks.errorMessage,
      startedAt: checks.startedAt,
      finishedAt: checks.finishedAt,
      createdAt: checks.createdAt,
      updatedAt: checks.updatedAt
    })
    .from(checks)
    .innerJoin(cases, eq(checks.caseId, cases.id))
    .where(and(eq(checks.id, checkId), eq(checks.userId, user.id)))
    .limit(1)

  if (!check) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Check not found'
    })
  }

  const paymentGate = await resolveCheckPaymentGate({
    checkId: check.id,
    checkType: check.type,
    userId: user.id
  })
  const effectiveStatus = getEffectiveCheckStatus({
    originalStatus: check.status,
    requiresPayment: paymentGate.requiresPayment,
    hasPaidAccess: paymentGate.hasPaidAccess
  })

  const [primaryDocument] = await db
    .select({
      id: documents.id,
      kind: documents.kind,
      originalName: documents.originalName,
      mimeType: documents.mimeType,
      fileSize: documents.fileSize,
      status: documents.status,
      createdAt: documents.createdAt
    })
    .from(checkDocuments)
    .innerJoin(documents, eq(checkDocuments.documentId, documents.id))
    .where(and(eq(checkDocuments.checkId, check.id), eq(checkDocuments.role, 'primary')))
    .limit(1)

  let extraction: null | {
    id: number
    engine: string
    status: string
    rawText: string | null
    normalizedText: string | null
    structuredDataJson: unknown
    confidenceScore: string | null
    errorMessage: string | null
    createdAt: Date
  } = null

  if (primaryDocument) {
    const [latestExtraction] = await db
      .select({
        id: documentExtractions.id,
        engine: documentExtractions.engine,
        status: documentExtractions.status,
        rawText: documentExtractions.rawText,
        normalizedText: documentExtractions.normalizedText,
        structuredDataJson: documentExtractions.structuredDataJson,
        confidenceScore: documentExtractions.confidenceScore,
        errorMessage: documentExtractions.errorMessage,
        createdAt: documentExtractions.createdAt
      })
      .from(documentExtractions)
      .where(eq(documentExtractions.documentId, primaryDocument.id))
      .orderBy(desc(documentExtractions.createdAt))
      .limit(1)

    extraction = latestExtraction || null
  }

  const findings = await db
    .select({
      id: ruleFindings.id,
      ruleCode: ruleFindings.ruleCode,
      severity: ruleFindings.severity,
      title: ruleFindings.title,
      description: ruleFindings.description,
      matchedValue: ruleFindings.matchedValue,
      metadataJson: ruleFindings.metadataJson,
      createdAt: ruleFindings.createdAt
    })
    .from(ruleFindings)
    .where(eq(ruleFindings.checkId, check.id))
    .orderBy(desc(ruleFindings.createdAt))

  const processing = deriveCheckProcessingStatus({
    checkStatus: effectiveStatus,
    inputPayloadJson: check.inputPayloadJson,
    errorMessage: check.errorMessage
  })
  const previewFindings = paymentGate.requiresPayment && !paymentGate.hasPaidAccess
    ? findings.slice(0, 2).map(item => ({
      ...item,
      description: item.description.length > 180 ? `${item.description.slice(0, 180)}…` : item.description,
      metadataJson: null
    }))
    : findings
  const extractionPreview = extraction && paymentGate.requiresPayment && !paymentGate.hasPaidAccess
    ? {
      ...extraction,
      rawText: null,
      normalizedText: null,
      structuredDataJson: null
    }
    : extraction
  const summaryPreview = paymentGate.requiresPayment && !paymentGate.hasPaidAccess && check.summaryText
    ? `${check.summaryText.slice(0, 260)}${check.summaryText.length > 260 ? '…' : ''}`
    : check.summaryText

  const analysis = {
    aiSummary: {
      title: 'AI summary',
      body: summaryPreview || null,
      status: summaryPreview ? 'ready' : 'empty'
    },
    ruleFindings: {
      title: 'Rule findings',
      count: findings.length,
      items: previewFindings,
      status: findings.length ? 'ready' : 'empty',
      previewLocked: paymentGate.requiresPayment && !paymentGate.hasPaidAccess
    },
    recommendedAction: buildRecommendedAction({
      status: effectiveStatus,
      processingCode: processing.code,
      riskScore: check.riskScore,
      findingsCount: findings.length,
      summaryText: summaryPreview,
      aiResultJson: check.aiResultJson
    })
  }

  return apiSuccess({
    check: {
      ...check,
      status: effectiveStatus,
      summaryText: summaryPreview,
      processing
    },
    paymentGate,
    primaryDocument,
    extraction: extractionPreview,
    findings: previewFindings,
    analysis
  })
})
