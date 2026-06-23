import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { cases, checks, letters } from '../../db/schema'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (_event, user) => {
  const db = getDb()

  const items = await db
    .select({
      id: letters.id,
      caseId: letters.caseId,
      checkId: letters.checkId,
      pdfDocumentId: letters.pdfDocumentId,
      type: letters.type,
      locale: letters.locale,
      subject: letters.subject,
      bodyText: letters.bodyText,
      status: letters.status,
      createdAt: letters.createdAt,
      updatedAt: letters.updatedAt,
      caseTitle: cases.title,
      checkType: checks.type,
      checkRiskScore: checks.riskScore
    })
    .from(letters)
    .leftJoin(cases, and(eq(letters.caseId, cases.id), eq(cases.userId, user.id)))
    .leftJoin(checks, and(eq(letters.checkId, checks.id), eq(checks.userId, user.id)))
    .where(eq(letters.userId, user.id))
    .orderBy(desc(letters.createdAt))

  return apiSuccess({
    items
  })
})
