import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../../db/client'
import { documents } from '../../../db/schema'
import { saveDocumentExtraction } from '../../../modules/documents/save-document-extraction'
import { defineAuthenticatedEventHandler } from '../../../utils/auth'
import { apiSuccess } from '../../../utils/api'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const documentId = Number(event.context.params?.id)

  if (!Number.isInteger(documentId) || documentId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const db = getDb()
  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, user.id),
      isNull(documents.deletedAt)
    ),
    columns: {
      id: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const extraction = await saveDocumentExtraction(documentId)

  return apiSuccess({
    extraction
  })
})
