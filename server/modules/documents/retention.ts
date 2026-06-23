import { rm } from 'node:fs/promises'

import { and, asc, eq, isNull, lte } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents } from '../../db/schema'
import { getDocumentStorageDir, resolveStoredDocumentPath } from './storage'

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0
}

function getRetentionDaysForKind(kind: string) {
  const config = useRuntimeConfig()
  const uploadsDays = isPositiveInteger(config.documentRetentionUploadsDays) ? config.documentRetentionUploadsDays : 90
  const reportsDays = isPositiveInteger(config.documentRetentionReportsDays) ? config.documentRetentionReportsDays : 30

  if (kind === 'generated_letter_pdf' || kind === 'generated_report_pdf') {
    return reportsDays
  }

  return uploadsDays
}

export function resolveDocumentDeleteAfterAt(kind: string, baseDate = new Date()) {
  const retentionDays = getRetentionDaysForKind(kind)

  return new Date(baseDate.getTime() + retentionDays * 24 * 60 * 60 * 1000)
}

export async function purgeExpiredDocuments(options?: {
  now?: Date
  limit?: number
}) {
  const db = getDb()
  const now = options?.now || new Date()
  const config = useRuntimeConfig()
  const limit = options?.limit
    ?? (isPositiveInteger(config.documentRetentionSweepBatchSize) ? config.documentRetentionSweepBatchSize : 50)

  const expiredDocuments = await db.query.documents.findMany({
    where: and(
      isNull(documents.deletedAt),
      lte(documents.deleteAfterAt, now)
    ),
    columns: {
      id: true,
      userId: true,
      kind: true,
      originalName: true,
      storagePath: true,
      mimeType: true,
      fileSize: true,
      deleteAfterAt: true
    },
    orderBy: [asc(documents.deleteAfterAt)],
    limit
  })

  let purgedCount = 0

  for (const document of expiredDocuments) {
    const deletedAt = new Date()
    const absoluteStoragePath = resolveStoredDocumentPath(
      getDocumentStorageDir(document.kind),
      document.storagePath
    )

    await rm(absoluteStoragePath, { force: true }).catch(() => undefined)

    await db
      .update(documents)
      .set({
        status: 'deleted',
        deletedAt
      })
      .where(and(eq(documents.id, document.id), isNull(documents.deletedAt)))

    await db.insert(auditLogs).values({
      userId: document.userId,
      actorType: 'system',
      action: 'document.auto_deleted',
      entityType: 'document',
      entityId: document.id,
      metadataJson: {
        kind: document.kind,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        deleteAfterAt: document.deleteAfterAt?.toISOString() || null,
        deletedAt: deletedAt.toISOString()
      }
    })

    purgedCount += 1
  }

  return {
    scannedCount: expiredDocuments.length,
    purgedCount,
    hasMore: expiredDocuments.length === limit
  }
}
