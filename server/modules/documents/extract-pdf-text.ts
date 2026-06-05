import { PDFParse } from 'pdf-parse'

export type PdfTextExtractionResult = {
  text: string
  pageCount: number
  pages: Array<{
    text: string
    page: number
  }>
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

    return {
      text: result.text,
      pageCount: result.pages.length,
      pages: result.pages.map((page, index) => ({
        text: page.text,
        page: index + 1
      }))
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
