import { and, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documents } from '../../db/schema'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (_event, user) => {
  const db = getDb()

  const items = await db
    .select({
      id: documents.id,
      caseId: documents.caseId,
      kind: documents.kind,
      originalName: documents.originalName,
      mimeType: documents.mimeType,
      fileSize: documents.fileSize,
      status: documents.status,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .where(and(eq(documents.userId, user.id), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt))

  return apiSuccess({
    items
  })
})
