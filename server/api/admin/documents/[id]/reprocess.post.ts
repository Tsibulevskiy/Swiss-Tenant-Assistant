import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../../../db/client'
import { documents } from '../../../../db/schema'
import { writeAuditLog } from '../../../../modules/audit/write-audit-log'
import { saveDocumentExtraction } from '../../../../modules/documents/save-document-extraction'
import { apiSuccess } from '../../../../utils/api'
import { defineRoleProtectedEventHandler } from '../../../../utils/auth'

export default defineRoleProtectedEventHandler(['admin'], async (event, user) => {
  const documentId = Number(event.context.params?.id)

  if (!Number.isInteger(documentId) || documentId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const db = getDb()
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), isNull(documents.deletedAt)),
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

  await writeAuditLog({
    userId: user.id,
    actorType: 'admin',
    action: 'admin.document.reprocess',
    entityType: 'document',
    entityId: documentId,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent'),
    metadataJson: {
      extractionId: extraction.id,
      engine: extraction.engine,
      status: extraction.status
    }
  })

  return apiSuccess({
    extraction
  })
})
