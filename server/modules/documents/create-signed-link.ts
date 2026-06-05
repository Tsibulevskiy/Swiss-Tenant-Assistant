import { randomBytes } from 'node:crypto'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents, signedLinks } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { hashSignedLinkToken } from './signed-link'

function buildDownloadUrl(appUrl: string, token: string) {
  const relativePath = `/api/documents/download/${token}`

  if (!appUrl) {
    return relativePath
  }

  return new URL(relativePath, appUrl).toString()
}

export async function createDocumentSignedLink(options: {
  documentId: number
  user: AuthUser
  expiresInMinutes?: number
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const config = useRuntimeConfig()
  const { documentId, user, expiresInMinutes = 15, ipAddress, userAgent } = options

  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, user.id),
      isNull(documents.deletedAt)
    ),
    columns: {
      id: true,
      originalName: true,
      status: true
    }
  })

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const token = randomBytes(32).toString('hex')
  const tokenHash = hashSignedLinkToken(token)
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  await db.insert(signedLinks).values({
    documentId: document.id,
    tokenHash,
    expiresAt,
    createdByUserId: user.id
  })

  await db.insert(auditLogs).values({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: 'document.download_link_created',
    entityType: 'document',
    entityId: document.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadataJson: {
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes
    }
  })

  return {
    documentId: document.id,
    originalName: document.originalName,
    expiresAt,
    downloadUrl: buildDownloadUrl(config.appUrl, token)
  }
}
