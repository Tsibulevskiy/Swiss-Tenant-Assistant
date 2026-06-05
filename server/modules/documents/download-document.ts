import { readFile } from 'node:fs/promises'

import { and, eq, gt, isNull, or } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents, signedLinks } from '../../db/schema'
import { resolveStoredDocumentPath } from './storage'
import { hashSignedLinkToken } from './signed-link'

function resolveDocumentStorageDir(kind: string) {
  const config = useRuntimeConfig()

  if (kind === 'generated_letter_pdf' || kind === 'generated_report_pdf') {
    return config.storageReportsDir
  }

  return config.storageUploadsDir
}

function toDownloadFilename(originalName: string) {
  return originalName.replace(/["\r\n]/g, '_')
}

export async function downloadDocumentByToken(options: {
  token: string
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const { token, ipAddress, userAgent } = options
  const now = new Date()
  const tokenHash = hashSignedLinkToken(token)

  const signedLink = await db.query.signedLinks.findFirst({
    where: and(
      eq(signedLinks.tokenHash, tokenHash),
      isNull(signedLinks.usedAt),
      gt(signedLinks.expiresAt, now)
    ),
    columns: {
      id: true,
      documentId: true,
      createdByUserId: true,
      expiresAt: true
    }
  })

  if (!signedLink) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Download link is invalid or expired'
    })
  }

  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, signedLink.documentId),
      isNull(documents.deletedAt),
      or(isNull(documents.deleteAfterAt), gt(documents.deleteAfterAt, now))
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

  if (!document || document.status === 'deleted') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const absoluteStoragePath = resolveStoredDocumentPath(
    resolveDocumentStorageDir(document.kind),
    document.storagePath
  )

  let fileBuffer: Buffer

  try {
    fileBuffer = await readFile(absoluteStoragePath)
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document file not found',
      cause: error
    })
  }

  const usedAt = new Date()

  await db.update(signedLinks).set({ usedAt }).where(eq(signedLinks.id, signedLink.id))

  await db.insert(auditLogs).values({
    userId: signedLink.createdByUserId || document.userId,
    actorType: 'user',
    action: 'document.downloaded',
    entityType: 'document',
    entityId: document.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadataJson: {
      signedLinkId: signedLink.id,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      usedAt: usedAt.toISOString()
    }
  })

  return {
    body: fileBuffer,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    filename: toDownloadFilename(document.originalName)
  }
}
