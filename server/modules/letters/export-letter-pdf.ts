import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { auditLogs, documents, letters } from '../../db/schema'
import type { AuthUser } from '../auth/types'
import { createDocumentSignedLink } from '../documents/create-signed-link'
import { resolveDocumentDeleteAfterAt } from '../documents/retention'
import { resolveStorageRoot, resolveStoredDocumentPath } from '../documents/storage'
import { renderLetterPdf } from './render-letter-pdf'

function sanitizeFileSegment(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80)
}

function buildPdfOriginalName(letterType: string, letterId: number) {
  return `${sanitizeFileSegment(letterType)}_${letterId}.pdf`
}

function buildRelativeStoragePath() {
  const now = new Date()
  const folder = path.posix.join(
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0')
  )

  return {
    folder,
    relativeStoragePath: path.posix.join(folder, `${randomUUID()}.pdf`)
  }
}

export async function exportLetterPdf(options: {
  letterId: number
  user: AuthUser
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const db = getDb()
  const config = useRuntimeConfig()
  const { letterId, user, ipAddress, userAgent } = options

  const letter = await db.query.letters.findFirst({
    where: and(eq(letters.id, letterId), eq(letters.userId, user.id)),
    columns: {
      id: true,
      userId: true,
      caseId: true,
      checkId: true,
      type: true,
      subject: true,
      bodyText: true,
      pdfDocumentId: true
    }
  })

  if (!letter) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Letter not found'
    })
  }

  const pdfBuffer = renderLetterPdf({
    subject: letter.subject,
    bodyText: letter.bodyText
  })
  const sha256 = createHash('sha256').update(pdfBuffer).digest('hex')
  const fileSize = pdfBuffer.length
  const storageRoot = resolveStorageRoot(config.storageReportsDir)
  let pdfDocumentId = letter.pdfDocumentId ?? null
  const deleteAfterAt = resolveDocumentDeleteAfterAt('generated_letter_pdf')

  if (pdfDocumentId) {
    const existingDocument = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, pdfDocumentId),
        eq(documents.userId, user.id),
        isNull(documents.deletedAt)
      ),
      columns: {
        id: true,
        storagePath: true
      }
    })

    if (existingDocument) {
      const absoluteStoragePath = resolveStoredDocumentPath(storageRoot, existingDocument.storagePath)

      await writeFile(absoluteStoragePath, pdfBuffer)

      await db
        .update(documents)
        .set({
          originalName: buildPdfOriginalName(letter.type, letter.id),
          mimeType: 'application/pdf',
          fileSize,
          sha256,
          status: 'ready',
          deleteAfterAt
        })
        .where(eq(documents.id, existingDocument.id))
    } else {
      pdfDocumentId = null
    }
  }

  if (!pdfDocumentId) {
    const { folder, relativeStoragePath } = buildRelativeStoragePath()
    const targetDirectory = path.join(storageRoot, folder.replace(/\//g, path.sep))
    const absoluteStoragePath = resolveStoredDocumentPath(storageRoot, relativeStoragePath)

    await mkdir(targetDirectory, { recursive: true })
    await writeFile(absoluteStoragePath, pdfBuffer)

    const insertResult = await db.insert(documents).values({
      userId: user.id,
      caseId: letter.caseId,
      kind: 'generated_letter_pdf',
      originalName: buildPdfOriginalName(letter.type, letter.id),
      storagePath: relativeStoragePath,
      mimeType: 'application/pdf',
      fileSize,
      sha256,
      uploadedBy: user.id,
      status: 'ready',
      deleteAfterAt
    })

    pdfDocumentId = Number(insertResult[0].insertId)

    await db
      .update(letters)
      .set({
        pdfDocumentId
      })
      .where(eq(letters.id, letter.id))
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'user',
    action: 'letter.pdf_exported',
    entityType: 'letter',
    entityId: letter.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadataJson: {
      pdfDocumentId,
      fileSize,
      sha256,
      deleteAfterAt: deleteAfterAt.toISOString()
    }
  })

  const signedLink = await createDocumentSignedLink({
    documentId: pdfDocumentId,
    user,
    expiresInMinutes: 15,
    ipAddress,
    userAgent
  })

  return {
    letterId: letter.id,
    pdfDocumentId,
    downloadUrl: signedLink.downloadUrl,
    expiresAt: signedLink.expiresAt
  }
}
