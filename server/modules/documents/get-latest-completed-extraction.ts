import { desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documentExtractions } from '../../db/schema'

export async function getLatestCompletedDocumentExtraction(documentId: number) {
  const db = getDb()

  const extractions = await db
    .select({
      id: documentExtractions.id,
      documentId: documentExtractions.documentId,
      engine: documentExtractions.engine,
      status: documentExtractions.status,
      rawText: documentExtractions.rawText,
      normalizedText: documentExtractions.normalizedText,
      structuredDataJson: documentExtractions.structuredDataJson,
      confidenceScore: documentExtractions.confidenceScore,
      errorMessage: documentExtractions.errorMessage,
      startedAt: documentExtractions.startedAt,
      finishedAt: documentExtractions.finishedAt,
      createdAt: documentExtractions.createdAt,
      updatedAt: documentExtractions.updatedAt
    })
    .from(documentExtractions)
    .where(eq(documentExtractions.documentId, documentId))
    .orderBy(desc(documentExtractions.createdAt))
    .limit(10)

  const extraction = extractions.find(item => item.status === 'completed') || null

  if (!extraction) {
    return null
  }

  return extraction
}
