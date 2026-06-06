type ExtractionQualityInput = {
  engine: 'pdf_text' | 'ocr'
  rawText: string | null
  normalizedText: string | null
  confidenceScore?: string | number | null
}

type ExtractionQualityMetrics = {
  engine: 'pdf_text' | 'ocr'
  textLength: number
  nonWhitespaceLength: number
  wordCount: number
  lineCount: number
  nonEmptyLineCount: number
  emptyLineRatio: number
  averageWordsPerNonEmptyLine: number
  confidenceScore: number | null
}

type ExtractionQualityComparison = {
  pdfText: ExtractionQualityMetrics | null
  ocr: ExtractionQualityMetrics | null
  preferredEngine: 'pdf_text' | 'ocr' | null
  decisionReason: string
}

function normalizeText(value: string | null | undefined) {
  return (value || '').replace(/\r\n/g, '\n').trim()
}

function parseConfidenceScore(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function buildMetrics(input: ExtractionQualityInput): ExtractionQualityMetrics {
  const normalizedText = normalizeText(input.normalizedText) || normalizeText(input.rawText)
  const lines = normalizedText.length > 0 ? normalizedText.split('\n') : []
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)
  const words = normalizedText.match(/\S+/g) || []
  const nonWhitespaceLength = normalizedText.replace(/\s+/g, '').length

  return {
    engine: input.engine,
    textLength: normalizedText.length,
    nonWhitespaceLength,
    wordCount: words.length,
    lineCount: lines.length,
    nonEmptyLineCount: nonEmptyLines.length,
    emptyLineRatio: lines.length > 0 ? (lines.length - nonEmptyLines.length) / lines.length : 1,
    averageWordsPerNonEmptyLine: nonEmptyLines.length > 0 ? words.length / nonEmptyLines.length : 0,
    confidenceScore: parseConfidenceScore(input.confidenceScore)
  }
}

function choosePreferredEngine(
  pdfText: ExtractionQualityMetrics | null,
  ocr: ExtractionQualityMetrics | null
): ExtractionQualityComparison {
  if (!pdfText && !ocr) {
    return {
      pdfText,
      ocr,
      preferredEngine: null,
      decisionReason: 'No extraction results available'
    }
  }

  if (pdfText && !ocr) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'pdf_text',
      decisionReason: 'Only PDF text extraction is available'
    }
  }

  if (!pdfText && ocr) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'ocr',
      decisionReason: 'Only OCR extraction is available'
    }
  }

  if (!pdfText || !ocr) {
    return {
      pdfText,
      ocr,
      preferredEngine: null,
      decisionReason: 'Unable to compare extraction results'
    }
  }

  if (pdfText.nonWhitespaceLength === 0 && ocr.nonWhitespaceLength > 0) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'ocr',
      decisionReason: 'OCR produced text while PDF text extraction was empty'
    }
  }

  if (pdfText.nonWhitespaceLength > 0 && ocr.nonWhitespaceLength === 0) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'pdf_text',
      decisionReason: 'PDF text extraction produced text while OCR was empty'
    }
  }

  if (pdfText.nonWhitespaceLength >= ocr.nonWhitespaceLength * 1.1) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'pdf_text',
      decisionReason: 'PDF text extraction preserved more non-whitespace content'
    }
  }

  if (ocr.nonWhitespaceLength > pdfText.nonWhitespaceLength * 1.25 && (ocr.confidenceScore || 0) >= 60) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'ocr',
      decisionReason: 'OCR recovered substantially more text with acceptable confidence'
    }
  }

  if ((ocr.confidenceScore || 0) < 45) {
    return {
      pdfText,
      ocr,
      preferredEngine: 'pdf_text',
      decisionReason: 'OCR confidence is too low to override PDF text extraction'
    }
  }

  return {
    pdfText,
    ocr,
    preferredEngine: 'pdf_text',
    decisionReason: 'PDF text extraction remains the safer default when both results are usable'
  }
}

export function compareExtractionQuality(inputs: ExtractionQualityInput[]): ExtractionQualityComparison {
  const pdfTextInput = inputs.find(input => input.engine === 'pdf_text') || null
  const ocrInput = inputs.find(input => input.engine === 'ocr') || null

  const pdfText = pdfTextInput ? buildMetrics(pdfTextInput) : null
  const ocr = ocrInput ? buildMetrics(ocrInput) : null

  return choosePreferredEngine(pdfText, ocr)
}

export type {
  ExtractionQualityComparison,
  ExtractionQualityInput,
  ExtractionQualityMetrics
}
