import { and, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { cases, checkDocuments, checks, documents, ruleFindings } from '../../db/schema'
import { writeAuditLog } from '../audit/write-audit-log'
import { generateCheckRecommendation } from '../ai/generate-check-recommendation'
import { generateCheckSummary } from '../ai/generate-check-summary'
import type { AuthUser } from '../auth/types'
import { getLatestCompletedDocumentExtraction } from '../documents/get-latest-completed-extraction'
import { saveDocumentExtraction } from '../documents/save-document-extraction'
import {
  buildCompletedCheckPipelinePayload,
  buildFailedCheckPipelinePayload,
  buildInitialCheckPipelinePayload,
  buildPostExtractionCheckPipelinePayload
} from './check-pipeline'
import { evaluateRulesForCheck } from './evaluate-rules'
import {
  serializePersistedRuleFindingMetadata,
  serializeRuleResult
} from './rule-persistence'

const documentKindToCheckType = {
  mietvertrag: 'mietvertrag_check',
  nebenkostenabrechnung: 'nebenkosten_check',
  rent_increase_letter: 'rent_increase_check',
  deduction_list: 'deposit_return_check'
} as const

const checkTypeToCaseType = {
  mietvertrag_check: 'mietvertrag',
  nebenkosten_check: 'nebenkosten',
  rent_increase_check: 'mietzinserhoehung',
  deposit_return_check: 'deposit_return'
} as const

type SupportedCheckType = (typeof documentKindToCheckType)[keyof typeof documentKindToCheckType]

function buildCaseTitle(originalName: string, checkType: SupportedCheckType) {
  const cleanName = originalName.replace(/\.[^.]+$/, '')

  switch (checkType) {
    case 'mietvertrag_check':
      return `Mietvertrag: ${cleanName}`
    case 'nebenkosten_check':
      return `Nebenkosten: ${cleanName}`
    case 'rent_increase_check':
      return `Mietzinserhoehung: ${cleanName}`
    case 'deposit_return_check':
      return `Deposit return: ${cleanName}`
  }
}

export async function createCheckFromDocument(options: {
  documentId: number
  user: AuthUser
  reuseExisting?: boolean
  extractionMode?: 'reuse_extraction' | 'force_reextract'
  trigger?: {
    type: 'initial' | 'rerun'
    sourceCheckId: number | null
    retryMode?: 'reuse_extraction' | 'force_reextract'
  }
}) {
  const db = getDb()
  const {
    documentId,
    user,
    reuseExisting = true,
    extractionMode = 'force_reextract',
    trigger = {
      type: 'initial',
      sourceCheckId: null,
      retryMode: extractionMode
    }
  } = options

  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, user.id), isNull(documents.deletedAt)),
    columns: {
      id: true,
      userId: true,
      caseId: true,
      kind: true,
      originalName: true,
      status: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const checkType = documentKindToCheckType[document.kind as keyof typeof documentKindToCheckType]

  if (!checkType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This document type does not support check creation yet'
    })
  }

  const existingLinkedCheck = await db
    .select({
      id: checks.id
    })
    .from(checkDocuments)
    .innerJoin(checks, eq(checkDocuments.checkId, checks.id))
    .where(
      and(
        eq(checkDocuments.documentId, document.id),
        eq(checkDocuments.role, 'primary'),
        eq(checks.type, checkType),
        eq(checks.userId, user.id)
      )
    )
    .orderBy(desc(checks.createdAt))
    .limit(1)

  if (reuseExisting && existingLinkedCheck[0]) {
    return {
      caseId: document.caseId,
      checkId: existingLinkedCheck[0].id,
      reused: true
    }
  }

  let caseId = document.caseId

  if (!caseId) {
    const caseInsert = await db.insert(cases).values({
      userId: user.id,
      type: checkTypeToCaseType[checkType],
      title: buildCaseTitle(document.originalName, checkType),
      status: 'draft',
      locale: user.locale
    })

    caseId = Number(caseInsert[0].insertId)

    await db
      .update(documents)
      .set({
        caseId
      })
      .where(eq(documents.id, document.id))
  }

  await db
    .update(cases)
    .set({
      status: 'analyzing'
    })
    .where(eq(cases.id, caseId))

  await db
    .update(documents)
    .set({
      status: 'processing'
    })
    .where(eq(documents.id, document.id))

  const initialPipelinePayload = buildInitialCheckPipelinePayload({
    documentId: document.id,
    documentKind: document.kind,
    originalName: document.originalName,
    trigger
  })

  const checkInsert = await db.insert(checks).values({
    userId: user.id,
    caseId,
    type: checkType,
    status: 'extracting',
    startedAt: new Date(),
    inputPayloadJson: initialPipelinePayload
  })

  const checkId = Number(checkInsert[0].insertId)

  await db.insert(checkDocuments).values({
    checkId,
    documentId: document.id,
    role: 'primary'
  })

  await writeAuditLog({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: trigger.type === 'rerun' ? 'check.rerun_started' : 'check.created',
    entityType: 'check',
    entityId: checkId,
    metadataJson: {
      caseId,
      documentId: document.id,
      checkType,
      trigger
    }
  })

  let failedStage: 'extraction' | 'rules' | 'summary' = 'extraction'

  try {
    const selectedExtraction = extractionMode === 'reuse_extraction'
      ? await getLatestCompletedDocumentExtraction(document.id) || await saveDocumentExtraction(document.id)
      : await saveDocumentExtraction(document.id)
    const postExtractionPipelinePayload = buildPostExtractionCheckPipelinePayload({
      initialPayload: initialPipelinePayload,
      extraction: {
        id: selectedExtraction.id,
        engine: selectedExtraction.engine,
        rawText: selectedExtraction.rawText,
        normalizedText: selectedExtraction.normalizedText,
        structuredDataJson: selectedExtraction.structuredDataJson ?? null,
        confidenceScore: selectedExtraction.confidenceScore,
        finishedAt: selectedExtraction.finishedAt
      }
    })

    await db
      .update(checks)
      .set({
        status: 'analyzing',
        inputPayloadJson: postExtractionPipelinePayload
      })
      .where(eq(checks.id, checkId))

    failedStage = 'rules'

    const evaluated = evaluateRulesForCheck({
      checkType,
      rawText: selectedExtraction.rawText,
      normalizedText: selectedExtraction.normalizedText,
      structuredDataJson: selectedExtraction.structuredDataJson ?? null
    })
    const serializedRuleResult = serializeRuleResult(evaluated.ruleResultJson)
    const generatedSummary = await generateCheckSummary({
      userId: user.id,
      caseId,
      checkId,
      checkType,
      riskScore: evaluated.riskScore,
      findings: evaluated.findings,
      normalizedText: selectedExtraction.normalizedText,
      structuredDataJson: selectedExtraction.structuredDataJson ?? null,
      fallbackSummaryText: evaluated.summaryText
    })
    const generatedRecommendation = await generateCheckRecommendation({
      userId: user.id,
      caseId,
      checkId,
      checkType,
      riskScore: evaluated.riskScore,
      findings: evaluated.findings,
      normalizedText: selectedExtraction.normalizedText,
      summaryText: generatedSummary.summaryText
    })
    const completedPipelinePayload = buildCompletedCheckPipelinePayload({
      initialPayload: postExtractionPipelinePayload,
      extraction: {
        id: selectedExtraction.id,
        engine: selectedExtraction.engine,
        rawText: selectedExtraction.rawText,
        normalizedText: selectedExtraction.normalizedText,
        structuredDataJson: selectedExtraction.structuredDataJson ?? null,
        confidenceScore: selectedExtraction.confidenceScore,
        finishedAt: selectedExtraction.finishedAt
      },
      evaluated: {
        summaryText: generatedSummary.summaryText,
        riskScore: evaluated.riskScore,
        ruleResultJson: serializedRuleResult
      }
    })
    failedStage = 'summary'

    if (evaluated.findings.length) {
      await db.insert(ruleFindings).values(
        evaluated.findings.map(finding => ({
          checkId,
          ruleCode: finding.ruleCode,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          matchedValue: finding.matchedValue || null,
          metadataJson: serializePersistedRuleFindingMetadata({
            finding,
            ruleResult: serializedRuleResult
          })
        }))
      )
    }

    await db
      .update(documents)
      .set({
        status: 'ready'
      })
      .where(eq(documents.id, document.id))

    await db
      .update(checks)
      .set({
        status: 'payment_required',
        inputPayloadJson: completedPipelinePayload,
        summaryText: generatedSummary.summaryText,
        disclaimerText: generatedSummary.disclaimerText,
        structuredInputJson: selectedExtraction.structuredDataJson ?? null,
        ruleResultJson: serializedRuleResult,
        aiResultJson: {
          summary: generatedSummary.aiResultJson,
          recommendation: generatedRecommendation.aiResultJson,
          recommendedAction: generatedRecommendation.recommendedAction
        },
        riskScore: evaluated.riskScore,
        finishedAt: new Date()
      })
      .where(eq(checks.id, checkId))

    await db
      .update(cases)
      .set({
        status: 'ready'
      })
      .where(eq(cases.id, caseId))

    await writeAuditLog({
      userId: user.id,
      actorType: user.role === 'admin' ? 'admin' : 'user',
      action: 'check.completed',
      entityType: 'check',
      entityId: checkId,
      metadataJson: {
        caseId,
        documentId: document.id,
        checkType,
        riskScore: evaluated.riskScore,
        findingsCount: evaluated.findings.length
      }
    })

    return {
      caseId,
      checkId,
      reused: false
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction failed'
    const failedPipelinePayload = buildFailedCheckPipelinePayload({
      initialPayload: initialPipelinePayload,
      failedStage,
      errorMessage: message,
      recoverable: true
    })

    await db
      .update(documents)
      .set({
        status: failedStage === 'extraction' ? 'failed' : 'ready'
      })
      .where(eq(documents.id, document.id))

    await db
      .update(checks)
      .set({
        status: 'failed',
        inputPayloadJson: failedPipelinePayload,
        errorMessage: message,
        finishedAt: new Date()
      })
      .where(eq(checks.id, checkId))

    await db
      .update(cases)
      .set({
        status: 'failed'
      })
      .where(eq(cases.id, caseId))

    await writeAuditLog({
      userId: user.id,
      actorType: user.role === 'admin' ? 'admin' : 'user',
      action: 'check.failed',
      entityType: 'check',
      entityId: checkId,
      metadataJson: {
        caseId,
        documentId: document.id,
        checkType,
        failedStage,
        errorMessage: message
      }
    })

    throw error
  }
}
