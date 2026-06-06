type OcrResult = {
  text: string
  confidence: number
  lines: Array<{
    text: string
    confidence: number
  }>
}

type OcrLoggerMessage = {
  status: string
  progress: number
}

type TesseractLine = {
  text: string
  confidence: number
}

type TesseractParagraph = {
  lines: TesseractLine[]
}

type TesseractBlock = {
  paragraphs: TesseractParagraph[]
}

type TesseractRecognizeResult = {
  data: {
    text: string
    confidence: number
    blocks: TesseractBlock[] | null
  }
}

type TesseractModule = {
  createWorker: (
    langs?: string | string[],
    oem?: unknown,
    options?: {
      logger?: (message: OcrLoggerMessage) => void
    }
  ) => Promise<{
    setParameters: (params: {
      tessedit_pageseg_mode: string
    }) => Promise<unknown>
    recognize: (image: Buffer) => Promise<TesseractRecognizeResult>
    terminate: () => Promise<unknown>
  }>
  PSM: {
    AUTO: string
  }
}

let tesseractModulePromise: Promise<TesseractModule> | null = null

async function loadTesseractModule(): Promise<TesseractModule> {
  if (!tesseractModulePromise) {
    tesseractModulePromise = (async () => {
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)

      return require('tesseract.js') as TesseractModule
    })()
  }

  return tesseractModulePromise
}

export async function runOcrOnBuffer(
  buffer: Buffer,
  options?: {
    language?: string
    logger?: (message: OcrLoggerMessage) => void
  }
): Promise<OcrResult> {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'OCR buffer is required'
    })
  }

  const language = options?.language || 'eng'
  const tesseractModule = await loadTesseractModule()
  const worker = await tesseractModule.createWorker(language, undefined, {
    logger: message => {
      options?.logger?.({
        status: message.status,
        progress: message.progress
      })
    }
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: tesseractModule.PSM.AUTO
    })

    const result = await worker.recognize(buffer) as TesseractRecognizeResult
    const lines = (result.data.blocks || []).flatMap(block =>
      block.paragraphs.flatMap(paragraph =>
        paragraph.lines.map(line => ({
          text: line.text,
          confidence: line.confidence
        }))
      )
    )

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      lines
    }
  } catch (error) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Failed to run OCR on image',
      cause: error
    })
  } finally {
    await worker.terminate()
  }
}

export type { OcrResult }
