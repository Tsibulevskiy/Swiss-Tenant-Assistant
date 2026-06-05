import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents } from '../../db/schema'
import type { AuthUser } from '../auth/types'

export async function getDocumentById(options: {
  documentId: number
  user: AuthUser
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const { documentId, user, ipAddress, userAgent } = options

  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, user.id),
      isNull(documents.deletedAt)
    ),
    columns: {
      id: true,
      userId: true,
      caseId: true,
      kind: true,
      originalName: true,
      storagePath: true,
      mimeType: true,
      fileSize: true,
      sha256: true,
      isEncrypted: true,
      status: true,
      deleteAfterAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: 'document.viewed',
    entityType: 'document',
    entityId: document.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null
  })

  return document
}
