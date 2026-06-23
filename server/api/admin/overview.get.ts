import { desc, eq, sql } from 'drizzle-orm'

import { defineRoleProtectedEventHandler } from '../../utils/auth'
import {
  aiRuns,
  cases,
  checks,
  documents,
  payments,
  products,
  systemErrors,
  users
} from '../../db/schema'
import { getDb } from '../../db/client'

const DEFAULT_LIMIT = 12

export default defineRoleProtectedEventHandler(['admin'], async () => {
  const db = getDb()

  const [
    userCounts,
    paymentCounts,
    checkCounts,
    documentCounts,
    aiCounts,
    errorCounts,
    latestUsers,
    latestPayments,
    latestChecks,
    latestDocuments,
    latestAiRuns,
    latestSystemErrors
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(payments),
    db.select({ count: sql<number>`count(*)` }).from(checks),
    db.select({ count: sql<number>`count(*)` }).from(documents),
    db.select({ count: sql<number>`count(*)` }).from(aiRuns),
    db.select({ count: sql<number>`count(*)` }).from(systemErrors),
    db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        locale: users.locale,
        firstName: users.firstName,
        lastName: users.lastName,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(DEFAULT_LIMIT),
    db
      .select({
        id: payments.id,
        userEmail: users.email,
        productName: products.name,
        amount: payments.amount,
        currency: payments.currency,
        provider: payments.provider,
        providerSessionId: payments.providerSessionId,
        providerPaymentIntentId: payments.providerPaymentIntentId,
        status: payments.status,
        checkId: payments.checkId,
        caseId: payments.caseId,
        createdAt: payments.createdAt,
        paidAt: payments.paidAt
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(products, eq(payments.productId, products.id))
      .orderBy(desc(payments.createdAt))
      .limit(DEFAULT_LIMIT),
    db
      .select({
        id: checks.id,
        userEmail: users.email,
        caseId: checks.caseId,
        caseTitle: cases.title,
        type: checks.type,
        status: checks.status,
        riskScore: checks.riskScore,
        summaryText: checks.summaryText,
        errorMessage: checks.errorMessage,
        createdAt: checks.createdAt,
        finishedAt: checks.finishedAt
      })
      .from(checks)
      .leftJoin(users, eq(checks.userId, users.id))
      .leftJoin(cases, eq(checks.caseId, cases.id))
      .orderBy(desc(checks.createdAt))
      .limit(DEFAULT_LIMIT),
    db
      .select({
        id: documents.id,
        userEmail: users.email,
        caseId: documents.caseId,
        caseTitle: cases.title,
        kind: documents.kind,
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        status: documents.status,
        fileSize: documents.fileSize,
        createdAt: documents.createdAt,
        deletedAt: documents.deletedAt
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id))
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .orderBy(desc(documents.createdAt))
      .limit(DEFAULT_LIMIT),
    db
      .select({
        id: aiRuns.id,
        userEmail: users.email,
        caseId: aiRuns.caseId,
        checkId: aiRuns.checkId,
        purpose: aiRuns.purpose,
        model: aiRuns.model,
        promptVersion: aiRuns.promptVersion,
        status: aiRuns.status,
        tokenInput: aiRuns.tokenInput,
        tokenOutput: aiRuns.tokenOutput,
        errorMessage: aiRuns.errorMessage,
        inputJson: aiRuns.inputJson,
        outputJson: aiRuns.outputJson,
        createdAt: aiRuns.createdAt,
        finishedAt: aiRuns.finishedAt
      })
      .from(aiRuns)
      .leftJoin(users, eq(aiRuns.userId, users.id))
      .orderBy(desc(aiRuns.createdAt))
      .limit(DEFAULT_LIMIT),
    db
      .select({
        id: systemErrors.id,
        scope: systemErrors.scope,
        relatedEntityType: systemErrors.relatedEntityType,
        relatedEntityId: systemErrors.relatedEntityId,
        message: systemErrors.message,
        stackTrace: systemErrors.stackTrace,
        status: systemErrors.status,
        createdAt: systemErrors.createdAt,
        resolvedAt: systemErrors.resolvedAt
      })
      .from(systemErrors)
      .orderBy(desc(systemErrors.createdAt))
      .limit(DEFAULT_LIMIT)
  ])

  return {
    ok: true,
    data: {
      summary: {
        users: userCounts[0]?.count || 0,
        payments: paymentCounts[0]?.count || 0,
        checks: checkCounts[0]?.count || 0,
        documents: documentCounts[0]?.count || 0,
        aiRuns: aiCounts[0]?.count || 0,
        systemErrors: errorCounts[0]?.count || 0
      },
      users: latestUsers,
      payments: latestPayments,
      checks: latestChecks,
      documents: latestDocuments,
      aiRuns: latestAiRuns,
      systemErrors: latestSystemErrors
    }
  }
})
