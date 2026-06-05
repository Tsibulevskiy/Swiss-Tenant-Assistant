import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documentExtractions } from '../../db/schema'
import { extractDocumentText } from './extract-document-text'

export async function saveDocumentTextExtraction(documentId: number) {
  const db = getDb()
  const insertResult = await db.insert(documentExtractions).values({
    documentId,
    engine: 'pdf_text',
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
    const extraction = await extractDocumentText(documentId)
    const finishedAt = new Date()
    const structuredData = {
      pageCount: extraction.pageCount,
      pages: extraction.pages
    }

    await db
      .update(documentExtractions)
      .set({
        status: 'completed',
        rawText: extraction.text,
        normalizedText: extraction.text,
        structuredDataJson: structuredData,
        confidenceScore: '100.00',
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
        errorMessage: error instanceof Error ? error.message : 'Unknown extraction error'
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
      statusMessage: 'Failed to save document extraction'
    })
  }

  return savedExtraction
}
