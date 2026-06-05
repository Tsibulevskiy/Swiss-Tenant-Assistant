import { rm } from 'node:fs/promises'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { resolveStoredDocumentPath } from './storage'

export async function deleteDocumentById(options: {
  documentId: number
  user: AuthUser
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const config = useRuntimeConfig()
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
      kind: true,
      originalName: true,
      storagePath: true,
      mimeType: true,
      fileSize: true,
      status: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const deletedAt = new Date()

  await db
    .update(documents)
    .set({
      status: 'deleted',
      deletedAt
    })
    .where(eq(documents.id, document.id))

  const absoluteStoragePath = resolveStoredDocumentPath(
    config.storageUploadsDir,
    document.storagePath
  )

  try {
    await rm(absoluteStoragePath, { force: true })
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete document file',
      cause: error
    })
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: 'document.deleted',
    entityType: 'document',
    entityId: document.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadataJson: {
      kind: document.kind,
      originalName: document.originalName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      deletedAt: deletedAt.toISOString()
    }
  })

  return {
    id: document.id,
    deletedAt
  }
}
