import { randomBytes } from 'node:crypto'

import { and, eq, gt, isNull, or } from 'drizzle-orm'

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

function resolveSignedLinkTtl(input: {
  requestedExpiresInMinutes?: number
  defaultTtlMinutes: number
  maxTtlMinutes: number
}) {
  const { requestedExpiresInMinutes, defaultTtlMinutes, maxTtlMinutes } = input
  const effectiveDefault = Number.isInteger(defaultTtlMinutes) && defaultTtlMinutes > 0 ? defaultTtlMinutes : 10
  const effectiveMax = Number.isInteger(maxTtlMinutes) && maxTtlMinutes > 0 ? maxTtlMinutes : 60
  const requested = requestedExpiresInMinutes ?? effectiveDefault

  if (!Number.isInteger(requested) || requested <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signed link TTL'
    })
  }

  if (requested > effectiveMax) {
    throw createError({
      statusCode: 400,
      statusMessage: `Signed link TTL exceeds the maximum of ${effectiveMax} minutes`
    })
  }

  return requested
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
  const { documentId, user, expiresInMinutes, ipAddress, userAgent } = options
  const now = new Date()
  const resolvedExpiresInMinutes = resolveSignedLinkTtl({
    requestedExpiresInMinutes: expiresInMinutes,
    defaultTtlMinutes: config.signedLinkDefaultTtlMinutes,
    maxTtlMinutes: config.signedLinkMaxTtlMinutes
  })

  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, user.id),
      isNull(documents.deletedAt),
      or(isNull(documents.deleteAfterAt), gt(documents.deleteAfterAt, now))
    ),
    columns: {
      id: true,
      originalName: true,
      status: true,
      deleteAfterAt: true
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
  const expiresAt = new Date(Date.now() + resolvedExpiresInMinutes * 60 * 1000)

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
      expiresInMinutes: resolvedExpiresInMinutes,
      signedLinkMaxTtlMinutes: config.signedLinkMaxTtlMinutes
    }
  })

  return {
    documentId: document.id,
    originalName: document.originalName,
    expiresAt,
    downloadUrl: buildDownloadUrl(config.appUrl, token)
  }
}
