import { readFile } from 'node:fs/promises'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documents } from '../../db/schema'
import { getDocumentStorageDir, resolveStoredDocumentPath } from './storage'

export type DocumentBinary = {
  id: number
  kind: string
  originalName: string
  storagePath: string
  mimeType: string
  status: string
  buffer: Buffer
}

export async function readDocumentBinary(documentId: number): Promise<DocumentBinary> {
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
      id: true,
      kind: true,
      originalName: true,
      storagePath: true,
      mimeType: true,
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
    getDocumentStorageDir(document.kind),
    document.storagePath
  )

  let buffer: Buffer

  try {
    buffer = await readFile(absoluteStoragePath)
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document file not found',
      cause: error
    })
  }

  return {
    ...document,
    buffer
  }
}
