import { readDocumentBinary } from './read-document-binary'
import { saveDocumentPdfOcrExtraction } from './save-document-pdf-ocr-extraction'
import { saveDocumentOcrExtraction } from './save-document-ocr-extraction'
import { saveDocumentTextExtraction } from './save-document-text-extraction'

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

export async function saveDocumentExtraction(documentId: number) {
  const document = await readDocumentBinary(documentId)

  if (imageMimeTypes.has(document.mimeType)) {
    return saveDocumentOcrExtraction(documentId)
  }

  if (document.mimeType !== 'application/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported document type for extraction'
    })
  }

  const textExtraction = await saveDocumentTextExtraction(documentId)
  const structuredData = (textExtraction.structuredDataJson || {}) as {
    isTextlessPdf?: boolean
  }

  if (structuredData.isTextlessPdf) {
    return saveDocumentPdfOcrExtraction(documentId)
  }

  return textExtraction
}
