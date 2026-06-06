import { PDFParse } from 'pdf-parse'

export type PdfTextExtractionResult = {
  text: string
  pageCount: number
  pages: Array<{
    text: string
    page: number
  }>
  hasExtractedText: boolean
  isTextlessPdf: boolean
}

function stripPdfParseArtifacts(value: string): string {
  return value.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
}

function normalizeExtractedText(value: string): string {
  return stripPdfParseArtifacts(value).replace(/\s+/g, ' ').trim()
}

export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<PdfTextExtractionResult> {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PDF buffer is required'
    })
  }

  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    const pages = result.pages.map((page, index) => ({
      text: page.text,
      page: index + 1
    }))
    const normalizedDocumentText = normalizeExtractedText(result.text)
    const hasExtractedText =
      normalizedDocumentText.length > 0
      || pages.some(page => normalizeExtractedText(page.text).length > 0)

    return {
      text: result.text,
      pageCount: result.pages.length,
      pages,
      hasExtractedText,
      isTextlessPdf: !hasExtractedText
    }
  } catch (error) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Failed to extract text from PDF',
      cause: error
    })
  } finally {
    await parser.destroy()
  }
}
