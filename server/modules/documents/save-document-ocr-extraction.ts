import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documentExtractions } from '../../db/schema'
import { readDocumentBinary } from './read-document-binary'
import { runOcrOnBuffer } from './run-ocr'

const supportedOcrMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

export async function saveDocumentOcrExtraction(documentId: number) {
  const db = getDb()
  const document = await readDocumentBinary(documentId)

  if (!supportedOcrMimeTypes.has(document.mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'OCR currently supports only image documents'
    })
  }

  const insertResult = await db.insert(documentExtractions).values({
    documentId,
    engine: 'ocr',
    status: 'pending'
  })

  const extractionId = Number(insertResult[0].insertId)
  const startedAt = new Date()

  await db
    .update(documentExtractions)
    .set({
      status: 'running',
      startedAt
    })
    .where(eq(documentExtractions.id, extractionId))

  try {
    const ocrResult = await runOcrOnBuffer(document.buffer)
    const finishedAt = new Date()
    const normalizedText = ocrResult.text.replace(/\s+/g, ' ').trim()
    const structuredData = {
      lineCount: ocrResult.lines.length,
      lines: ocrResult.lines,
      sourceMimeType: document.mimeType
    }

    await db
      .update(documentExtractions)
      .set({
        status: 'completed',
        rawText: ocrResult.text,
        normalizedText,
        structuredDataJson: structuredData,
        confidenceScore: ocrResult.confidence.toFixed(2),
        finishedAt,
        errorMessage: null
      })
      .where(eq(documentExtractions.id, extractionId))
  } catch (error) {
    const finishedAt = new Date()

    await db
      .update(documentExtractions)
      .set({
        status: 'failed',
        finishedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown OCR error'
      })
      .where(eq(documentExtractions.id, extractionId))

    throw error
  }

  const savedExtraction = await db.query.documentExtractions.findFirst({
    where: (table, { eq }) => eq(table.id, extractionId),
    columns: {
      id: true,
      documentId: true,
      engine: true,
      status: true,
      rawText: true,
      normalizedText: true,
      structuredDataJson: true,
      confidenceScore: true,
      errorMessage: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!savedExtraction) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save OCR extraction'
    })
  }

  return savedExtraction
}
