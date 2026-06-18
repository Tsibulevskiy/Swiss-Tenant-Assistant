import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { cases, checks } from '../../db/schema'
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

  return apiSuccess({
    items
  })
})
