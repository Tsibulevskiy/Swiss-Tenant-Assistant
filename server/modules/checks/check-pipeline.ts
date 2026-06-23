type CheckPipelineStageStatus = 'pending' | 'completed' | 'failed' | 'skipped'

type CheckPipelinePayload = {
  schema: 'check_pipeline.v1'
  sourceDocument: {
    id: number
    kind: string
    originalName: string
  }
  trigger: {
    type: 'initial' | 'rerun'
    sourceCheckId: number | null
    retryMode?: 'reuse_extraction' | 'force_reextract'
  }
  failure: null | {
    stage: 'extraction' | 'rules' | 'summary'
    message: string
    recoverable: boolean
  }
  stages: {
    upload: {
      status: CheckPipelineStageStatus
      completedAt: string | null
    }
    extraction: {
      status: CheckPipelineStageStatus
      completedAt: string | null
      engine: string | null
      extractionId: number | null
      rawTextLength: number | null
      normalizedTextLength: number | null
      confidenceScore: string | null
    }
    normalization: {
      status: CheckPipelineStageStatus
      completedAt: string | null
      detectedDates: number | null
      detectedAmounts: number | null
      detectedCurrencies: number | null
    }
    structuredExtraction: {
      status: CheckPipelineStageStatus
      completedAt: string | null
      schema: string | null
      documentKind: string | null
      extractorStatus: string | null
    }
    rules: {
      status: CheckPipelineStageStatus
      completedAt: string | null
      findingsCount: number | null
      riskScore: string | null
      rulesTriggered: string[]
    }
    summary: {
      status: CheckPipelineStageStatus
      completedAt: string | null
      textLength: number | null
    }
  }
}

function buildPendingStages(): CheckPipelinePayload['stages'] {
  return {
    upload: {
      status: 'completed',
      completedAt: new Date().toISOString()
    },
    extraction: {
      status: 'pending',
      completedAt: null,
      engine: null,
      extractionId: null,
      rawTextLength: null,
      normalizedTextLength: null,
      confidenceScore: null
    },
    normalization: {
      status: 'pending',
      completedAt: null,
      detectedDates: null,
      detectedAmounts: null,
      detectedCurrencies: null
    },
    structuredExtraction: {
      status: 'pending',
      completedAt: null,
      schema: null,
      documentKind: null,
      extractorStatus: null
    },
    rules: {
      status: 'pending',
      completedAt: null,
      findingsCount: null,
      riskScore: null,
      rulesTriggered: []
    },
    summary: {
      status: 'pending',
      completedAt: null,
      textLength: null
    }
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

export function buildInitialCheckPipelinePayload(input: {
  documentId: number
  documentKind: string
  originalName: string
  trigger?: {
    type: 'initial' | 'rerun'
    sourceCheckId: number | null
  }
}): CheckPipelinePayload {
  return {
    schema: 'check_pipeline.v1',
    sourceDocument: {
      id: input.documentId,
      kind: input.documentKind,
      originalName: input.originalName
    },
    trigger: input.trigger || {
      type: 'initial',
      sourceCheckId: null
    },
    failure: null,
    stages: buildPendingStages()
  }
}

export function buildCompletedCheckPipelinePayload(input: {
  initialPayload: CheckPipelinePayload
  extraction: {
    id: number
    engine: string
    rawText: string | null
    normalizedText: string | null
    structuredDataJson: unknown
    confidenceScore: string | null
    finishedAt: Date | null
  }
  evaluated: {
    summaryText: string
    riskScore: string
    ruleResultJson: Record<string, unknown>
  }
}): CheckPipelinePayload {
  const structuredData = asRecord(input.extraction.structuredDataJson)
  const normalization = asRecord(structuredData?.normalization)
  const detected = asRecord(normalization?.detected)
  const structuredExtraction = asRecord(structuredData?.structuredExtraction)
  const extractor = asRecord(structuredExtraction?.extractor)
  const finishedAt = input.extraction.finishedAt?.toISOString() || new Date().toISOString()
  const rulesTriggered = Array.isArray(input.evaluated.ruleResultJson.rulesTriggered)
    ? input.evaluated.ruleResultJson.rulesTriggered.filter((item): item is string => typeof item === 'string')
    : []
  const findingsCount =
    typeof input.evaluated.ruleResultJson.findingsCount === 'number'
      ? input.evaluated.ruleResultJson.findingsCount
      : null

  return {
    ...input.initialPayload,
    failure: null,
    stages: {
      ...input.initialPayload.stages,
      extraction: {
        status: 'completed',
        completedAt: finishedAt,
        engine: input.extraction.engine,
        extractionId: input.extraction.id,
        rawTextLength: input.extraction.rawText?.length ?? 0,
        normalizedTextLength: input.extraction.normalizedText?.length ?? 0,
        confidenceScore: input.extraction.confidenceScore
      },
      normalization: {
        status: normalization ? 'completed' : 'skipped',
        completedAt: normalization ? finishedAt : null,
        detectedDates: Array.isArray(detected?.dates) ? detected.dates.length : 0,
        detectedAmounts: Array.isArray(detected?.amounts) ? detected.amounts.length : 0,
        detectedCurrencies: Array.isArray(detected?.currencies) ? detected.currencies.length : 0
      },
      structuredExtraction: {
        status: structuredExtraction ? 'completed' : 'skipped',
        completedAt: structuredExtraction ? finishedAt : null,
        schema: typeof structuredExtraction?.schema === 'string' ? structuredExtraction.schema : null,
        documentKind: typeof structuredExtraction?.documentKind === 'string' ? structuredExtraction.documentKind : null,
        extractorStatus: typeof extractor?.status === 'string' ? extractor.status : null
      },
      rules: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        findingsCount,
        riskScore: input.evaluated.riskScore,
        rulesTriggered
      },
      summary: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        textLength: input.evaluated.summaryText.length
      }
    }
  }
}

export function buildPostExtractionCheckPipelinePayload(input: {
  initialPayload: CheckPipelinePayload
  extraction: {
    id: number
    engine: string
    rawText: string | null
    normalizedText: string | null
    structuredDataJson: unknown
    confidenceScore: string | null
    finishedAt: Date | null
  }
}): CheckPipelinePayload {
  const structuredData = asRecord(input.extraction.structuredDataJson)
  const normalization = asRecord(structuredData?.normalization)
  const detected = asRecord(normalization?.detected)
  const structuredExtraction = asRecord(structuredData?.structuredExtraction)
  const extractor = asRecord(structuredExtraction?.extractor)
  const finishedAt = input.extraction.finishedAt?.toISOString() || new Date().toISOString()

  return {
    ...input.initialPayload,
    failure: null,
    stages: {
      ...input.initialPayload.stages,
      extraction: {
        status: 'completed',
        completedAt: finishedAt,
        engine: input.extraction.engine,
        extractionId: input.extraction.id,
        rawTextLength: input.extraction.rawText?.length ?? 0,
        normalizedTextLength: input.extraction.normalizedText?.length ?? 0,
        confidenceScore: input.extraction.confidenceScore
      },
      normalization: {
        status: normalization ? 'completed' : 'skipped',
        completedAt: normalization ? finishedAt : null,
        detectedDates: Array.isArray(detected?.dates) ? detected.dates.length : 0,
        detectedAmounts: Array.isArray(detected?.amounts) ? detected.amounts.length : 0,
        detectedCurrencies: Array.isArray(detected?.currencies) ? detected.currencies.length : 0
      },
      structuredExtraction: {
        status: structuredExtraction ? 'completed' : 'skipped',
        completedAt: structuredExtraction ? finishedAt : null,
        schema: typeof structuredExtraction?.schema === 'string' ? structuredExtraction.schema : null,
        documentKind: typeof structuredExtraction?.documentKind === 'string' ? structuredExtraction.documentKind : null,
        extractorStatus: typeof extractor?.status === 'string' ? extractor.status : null
      },
      rules: {
        ...input.initialPayload.stages.rules,
        status: 'pending'
      },
      summary: {
        ...input.initialPayload.stages.summary,
        status: 'pending'
      }
    }
  }
}

export function buildFailedCheckPipelinePayload(input: {
  initialPayload: CheckPipelinePayload
  failedStage: 'extraction' | 'rules' | 'summary'
  errorMessage: string
  recoverable?: boolean
}): CheckPipelinePayload {
  const now = new Date().toISOString()

  return {
    ...input.initialPayload,
    failure: {
      stage: input.failedStage,
      message: input.errorMessage,
      recoverable: input.recoverable ?? true
    },
    stages: {
      ...input.initialPayload.stages,
      [input.failedStage]: {
        ...input.initialPayload.stages[input.failedStage],
        status: 'failed',
        completedAt: now
      }
    }
  }
}
