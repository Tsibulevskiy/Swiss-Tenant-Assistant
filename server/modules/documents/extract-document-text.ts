import { extractPdfTextFromBuffer } from './extract-pdf-text'
import { readDocumentBinary } from './read-document-binary'

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
  hasExtractedText: boolean
  isTextlessPdf: boolean
}

export async function extractDocumentText(documentId: number): Promise<DocumentTextExtractionResult> {
  const document = await readDocumentBinary(documentId)

  if (document.mimeType !== 'application/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only PDF documents are supported for text extraction'
    })
  }

  const extraction = await extractPdfTextFromBuffer(document.buffer)

  return {
    documentId: document.id,
    mimeType: document.mimeType,
    originalName: document.originalName,
    storagePath: document.storagePath,
    text: extraction.text,
    pageCount: extraction.pageCount,
    pages: extraction.pages,
    hasExtractedText: extraction.hasExtractedText,
    isTextlessPdf: extraction.isTextlessPdf
  }
}
