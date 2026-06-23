import { desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documentExtractions } from '../../db/schema'
import { getDocumentById } from '../../modules/documents/get-document'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const document = await getDocumentById({
    documentId: id,
    user,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  const db = getDb()
  const [latestExtraction] = await db
    .select({
      id: documentExtractions.id,
      engine: documentExtractions.engine,
      status: documentExtractions.status,
      confidenceScore: documentExtractions.confidenceScore,
      errorMessage: documentExtractions.errorMessage,
      structuredDataJson: documentExtractions.structuredDataJson,
      createdAt: documentExtractions.createdAt,
      updatedAt: documentExtractions.updatedAt
    })
    .from(documentExtractions)
    .where(eq(documentExtractions.documentId, document.id))
    .orderBy(desc(documentExtractions.createdAt))
    .limit(1)

  return apiSuccess({
    document,
    extraction: latestExtraction || null
  })
})
