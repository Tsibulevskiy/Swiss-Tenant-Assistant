type ProcessingTone = 'neutral' | 'progress' | 'success' | 'warning' | 'danger'

type CheckProcessingStatus = {
  code:
    | 'queued'
    | 'extracting'
    | 'normalizing'
    | 'structuring'
    | 'evaluating_rules'
    | 'generating_summary'
    | 'payment_required'
    | 'completed'
    | 'failed'
  label: string
  detail: string
  tone: ProcessingTone
  progressPercent: number
  retryable: boolean
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

export function deriveCheckProcessingStatus(input: {
  checkStatus: string
  inputPayloadJson: unknown
  errorMessage?: string | null
}) : CheckProcessingStatus {
  const payload = asRecord(input.inputPayloadJson)
  const stages = asRecord(payload?.stages)
  const failure = asRecord(payload?.failure)
  const extraction = asRecord(stages?.extraction)
  const normalization = asRecord(stages?.normalization)
  const structuredExtraction = asRecord(stages?.structuredExtraction)
  const rules = asRecord(stages?.rules)
  const summary = asRecord(stages?.summary)
  const failureStage = typeof failure?.stage === 'string' ? failure.stage : null
  const failureMessage = typeof failure?.message === 'string' ? failure.message : input.errorMessage || null
  const retryable = typeof failure?.recoverable === 'boolean' ? failure.recoverable : input.checkStatus === 'failed'

  if (input.checkStatus === 'failed') {
    const stageLabel =
      failureStage === 'extraction'
        ? 'Extraction failed'
        : failureStage === 'rules'
          ? 'Rule evaluation failed'
          : failureStage === 'summary'
            ? 'Summary generation failed'
            : 'Analysis failed'

    return {
      code: 'failed',
      label: stageLabel,
      detail: failureMessage || 'The analysis could not be completed.',
      tone: 'danger',
      progressPercent: failureStage === 'summary' ? 85 : failureStage === 'rules' ? 70 : 35,
      retryable
    }
  }

  if (input.checkStatus === 'payment_required') {
    return {
      code: 'payment_required',
      label: 'Payment required',
      detail: 'Analysis is complete and waiting for payment to unlock the next step.',
      tone: 'warning',
      progressPercent: 100,
      retryable: false
    }
  }

  if (input.checkStatus === 'ready') {
    return {
      code: 'completed',
      label: 'Analysis complete',
      detail: 'Extraction, structured parsing, rules, and summary are ready.',
      tone: 'success',
      progressPercent: 100,
      retryable: false
    }
  }

  if (typeof summary?.status === 'string' && summary.status === 'completed') {
    return {
      code: 'completed',
      label: 'Analysis complete',
      detail: 'The check completed successfully.',
      tone: 'success',
      progressPercent: 100,
      retryable: false
    }
  }

  if (typeof rules?.status === 'string' && rules.status === 'completed' && input.checkStatus === 'analyzing') {
    return {
      code: 'generating_summary',
      label: 'Generating summary',
      detail: 'Rule evaluation is complete and the final summary is being prepared.',
      tone: 'progress',
      progressPercent: 85,
      retryable: false
    }
  }

  if (typeof structuredExtraction?.status === 'string' && structuredExtraction.status === 'completed' && input.checkStatus === 'analyzing') {
    return {
      code: 'evaluating_rules',
      label: 'Evaluating rules',
      detail: 'Structured extraction is ready and rule evaluation is running.',
      tone: 'progress',
      progressPercent: 70,
      retryable: false
    }
  }

  if (typeof normalization?.status === 'string' && normalization.status === 'completed' && input.checkStatus === 'extracting') {
    return {
      code: 'structuring',
      label: 'Building structured extraction',
      detail: 'Text was normalized and document fields are being mapped into structured data.',
      tone: 'progress',
      progressPercent: 55,
      retryable: false
    }
  }

  if (typeof extraction?.status === 'string' && extraction.status === 'completed' && input.checkStatus === 'extracting') {
    return {
      code: 'normalizing',
      label: 'Normalizing extracted text',
      detail: 'Raw text was extracted and is being normalized for downstream analysis.',
      tone: 'progress',
      progressPercent: 40,
      retryable: false
    }
  }

  if (input.checkStatus === 'analyzing') {
    return {
      code: 'evaluating_rules',
      label: 'Evaluating rules',
      detail: 'The document was extracted and is being analyzed.',
      tone: 'progress',
      progressPercent: 70,
      retryable: false
    }
  }

  if (input.checkStatus === 'extracting') {
    return {
      code: 'extracting',
      label: 'Extracting document text',
      detail: 'The uploaded document is being converted into machine-readable text.',
      tone: 'progress',
      progressPercent: 25,
      retryable: false
    }
  }

  return {
    code: 'queued',
    label: 'Queued',
    detail: 'The analysis was created and is waiting to start.',
    tone: 'neutral',
    progressPercent: 5,
    retryable: false
  }
}

export type { CheckProcessingStatus, ProcessingTone }
