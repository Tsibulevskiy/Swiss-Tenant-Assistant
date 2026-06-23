import { and, desc, eq, sql } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { cases, checkDocuments, checks, documents, ruleFindings } from '../../db/schema'
import { deriveCheckProcessingStatus } from '../../modules/checks/processing-status'
import { getEffectiveCheckStatus, resolveCheckPaymentGate } from '../../modules/payments/check-payment-gating'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (_event, user) => {
  const db = getDb()

  const items = await db
    .select({
      id: checks.id,
      caseId: checks.caseId,
      caseTitle: cases.title,
      type: checks.type,
      status: checks.status,
      inputPayloadJson: checks.inputPayloadJson,
      errorMessage: checks.errorMessage,
      riskScore: checks.riskScore,
      summaryText: checks.summaryText,
      startedAt: checks.startedAt,
      finishedAt: checks.finishedAt,
      createdAt: checks.createdAt,
      updatedAt: checks.updatedAt
    })
    .from(checks)
    .innerJoin(cases, eq(checks.caseId, cases.id))
    .where(eq(checks.userId, user.id))
    .orderBy(desc(checks.createdAt))

  const enrichedItems = await Promise.all(items.map(async item => {
    const paymentGate = await resolveCheckPaymentGate({
      checkId: item.id,
      checkType: item.type,
      userId: user.id
    })
    const effectiveStatus = getEffectiveCheckStatus({
      originalStatus: item.status,
      requiresPayment: paymentGate.requiresPayment,
      hasPaidAccess: paymentGate.hasPaidAccess
    })
    const [primaryDocument] = await db
      .select({
        id: documents.id,
        kind: documents.kind,
        originalName: documents.originalName,
        status: documents.status,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize
      })
      .from(checkDocuments)
      .innerJoin(documents, eq(checkDocuments.documentId, documents.id))
      .where(and(eq(checkDocuments.checkId, item.id), eq(checkDocuments.role, 'primary')))
      .limit(1)

    const [findingsAggregate] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(ruleFindings)
      .where(eq(ruleFindings.checkId, item.id))

    return {
      ...item,
      status: effectiveStatus,
      summaryText: paymentGate.requiresPayment && !paymentGate.hasPaidAccess && item.summaryText
        ? `${item.summaryText.slice(0, 180)}${item.summaryText.length > 180 ? '…' : ''}`
        : item.summaryText,
      processing: deriveCheckProcessingStatus({
        checkStatus: effectiveStatus,
        inputPayloadJson: item.inputPayloadJson,
        errorMessage: item.errorMessage
      }),
      paymentGate,
      primaryDocument: primaryDocument || null,
      findingsCount: Number(findingsAggregate?.count || 0)
    }
  }))

  return apiSuccess({
    items: enrichedItems
  })
})
