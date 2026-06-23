import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { documentExtractions } from '../../db/schema'
import { buildStructuredExtraction } from './build-structured-extraction'
import { normalizeExtractedText } from './normalize-extracted-text'
import { readDocumentBinary } from './read-document-binary'
import { rasterizePdfToImages } from './rasterize-pdf'
import { runOcrOnBuffer } from './run-ocr'

export async function saveDocumentPdfOcrExtraction(documentId: number) {
  const db = getDb()
  const document = await readDocumentBinary(documentId)

  if (document.mimeType !== 'application/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'OCR PDF fallback requires a PDF document'
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
    const rasterizedPages = await rasterizePdfToImages(document.buffer)
    const pageResults = []

    for (const rasterizedPage of rasterizedPages) {
      const ocrResult = await runOcrOnBuffer(rasterizedPage.buffer)

      pageResults.push({
        page: rasterizedPage.page,
        text: ocrResult.text,
        normalizedText: normalizeExtractedText(ocrResult.text).normalizedText,
        confidence: ocrResult.confidence,
        lineCount: ocrResult.lines.length,
        lines: ocrResult.lines
      })
    }

    const rawText = pageResults
      .map(page => page.text.trim())
      .filter(Boolean)
      .join('\n\n')
    const normalizedText = pageResults
      .map(page => page.normalizedText)
      .filter(Boolean)
      .join('\n')
      .trim()
    const normalizedDocument = normalizeExtractedText(rawText)
    const structuredExtraction = buildStructuredExtraction({
      documentKind: document.kind,
      sourceEngine: 'ocr',
      normalizedText: normalizedDocument.normalizedText || normalizedText,
      normalization: normalizedDocument.metadata
    })
    const confidenceScore = pageResults.length > 0
      ? pageResults.reduce((sum, page) => sum + page.confidence, 0) / pageResults.length
      : 0
    const finishedAt = new Date()

    await db
      .update(documentExtractions)
      .set({
        status: 'completed',
        rawText,
        normalizedText: normalizedDocument.normalizedText || normalizedText,
        structuredDataJson: {
          pageCount: pageResults.length,
          sourceMimeType: document.mimeType,
          source: 'pdf_ocr_fallback',
          normalization: normalizedDocument.metadata,
          structuredExtraction,
          pages: pageResults.map(page => ({
            page: page.page,
            confidence: page.confidence,
            lineCount: page.lineCount,
            lines: page.lines
          }))
        },
        confidenceScore: confidenceScore.toFixed(2),
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
        errorMessage: error instanceof Error ? error.message : 'Unknown PDF OCR error'
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
      statusMessage: 'Failed to save PDF OCR extraction'
    })
  }

  return savedExtraction
}
