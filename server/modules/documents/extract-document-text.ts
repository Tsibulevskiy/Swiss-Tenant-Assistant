import { readFile } from 'node:fs/promises'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documents } from '../../db/schema'
import { extractPdfTextFromBuffer } from './extract-pdf-text'
import { getDocumentStorageDir, resolveStoredDocumentPath } from './storage'

export type DocumentTextExtractionResult = {
  documentId: number
  mimeType: string
  originalName: string
  storagePath: string
  text: string
  pageCount: number
  pages: Array<{
    text: string
    page: number
  }>
}

export async function extractDocumentText(documentId: number): Promise<DocumentTextExtractionResult> {
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

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  if (document.mimeType !== 'application/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only PDF documents are supported for text extraction'
    })
  }

  if (document.status === 'deleted') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found'
    })
  }

  const absoluteStoragePath = resolveStoredDocumentPath(
    getDocumentStorageDir(document.kind),
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

  const extraction = await extractPdfTextFromBuffer(fileBuffer)

  return {
    documentId: document.id,
    mimeType: document.mimeType,
    originalName: document.originalName,
    storagePath: document.storagePath,
    text: extraction.text,
    pageCount: extraction.pageCount,
    pages: extraction.pages
  }
}
