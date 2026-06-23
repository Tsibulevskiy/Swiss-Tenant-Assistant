type ConfigValidationResult = {
  errors: string[]
  warnings: string[]
}

let validated = false

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function hasUnsafeExampleValue(value: string) {
  const normalized = value.trim().toLowerCase()

  return [
    'change_me',
    'sta_app_password',
    'sta_root_password',
    'password',
    'secret'
  ].includes(normalized)
}

function validateRuntimeConfiguration() {
  const config = useRuntimeConfig()
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isNonEmptyString(config.mysqlDatabase)) {
    errors.push('MYSQL_DATABASE is required')
  }

  if (!isNonEmptyString(config.mysqlUser)) {
    errors.push('MYSQL_USER is required')
  }

  if (!isNonEmptyString(config.mysqlPassword)) {
    errors.push('MYSQL_PASSWORD is required')
  } else if (isProduction && hasUnsafeExampleValue(config.mysqlPassword)) {
    errors.push('MYSQL_PASSWORD uses an unsafe example/default value')
  }

  if (!isPositiveInteger(config.mysqlPort)) {
    errors.push('MYSQL_PORT must be a positive integer')
  }

  if (!isNonEmptyString(config.storageUploadsDir)) {
    errors.push('NUXT_STORAGE_UPLOADS_DIR is required')
  }

  if (!isNonEmptyString(config.storageReportsDir)) {
    errors.push('NUXT_STORAGE_REPORTS_DIR is required')
  }

  if (
    isNonEmptyString(config.storageUploadsDir)
    && isNonEmptyString(config.storageReportsDir)
    && config.storageUploadsDir === config.storageReportsDir
  ) {
    errors.push('NUXT_STORAGE_UPLOADS_DIR and NUXT_STORAGE_REPORTS_DIR must not be the same path')
  }

  if (!isPositiveInteger(config.signedLinkDefaultTtlMinutes)) {
    errors.push('NUXT_SIGNED_LINK_DEFAULT_TTL_MINUTES must be a positive integer')
  }

  if (!isPositiveInteger(config.signedLinkMaxTtlMinutes)) {
    errors.push('NUXT_SIGNED_LINK_MAX_TTL_MINUTES must be a positive integer')
  }

  if (
    isPositiveInteger(config.signedLinkDefaultTtlMinutes)
    && isPositiveInteger(config.signedLinkMaxTtlMinutes)
    && config.signedLinkDefaultTtlMinutes > config.signedLinkMaxTtlMinutes
  ) {
    errors.push('NUXT_SIGNED_LINK_DEFAULT_TTL_MINUTES must be less than or equal to NUXT_SIGNED_LINK_MAX_TTL_MINUTES')
  }

  if (!isPositiveInteger(config.documentRetentionUploadsDays)) {
    errors.push('NUXT_DOCUMENT_RETENTION_UPLOADS_DAYS must be a positive integer')
  }

  if (!isPositiveInteger(config.documentRetentionReportsDays)) {
    errors.push('NUXT_DOCUMENT_RETENTION_REPORTS_DAYS must be a positive integer')
  }

  if (!isPositiveInteger(config.documentRetentionSweepIntervalMinutes)) {
    errors.push('NUXT_DOCUMENT_RETENTION_SWEEP_INTERVAL_MINUTES must be a positive integer')
  }

  if (!isPositiveInteger(config.documentRetentionSweepBatchSize)) {
    errors.push('NUXT_DOCUMENT_RETENTION_SWEEP_BATCH_SIZE must be a positive integer')
  }

  const stripeConfigured = isNonEmptyString(config.stripeSecretKey) || isNonEmptyString(config.stripeWebhookSecret)

  if (stripeConfigured) {
    if (!isNonEmptyString(config.stripeSecretKey)) {
      errors.push('NUXT_STRIPE_SECRET_KEY must be set when Stripe integration is enabled')
    }

    if (!isNonEmptyString(config.stripeWebhookSecret)) {
      warnings.push('NUXT_STRIPE_WEBHOOK_SECRET is missing; webhook verification will fail')
    }

    if (!isNonEmptyString(config.appUrl) || !isAbsoluteHttpUrl(config.appUrl)) {
      errors.push('NUXT_APP_URL must be an absolute http(s) URL when Stripe integration is enabled')
    }
  }

  const brevoConfigured = isNonEmptyString(config.brevoApiKey) || isNonEmptyString(config.brevoSenderEmail)

  if (brevoConfigured) {
    if (!isNonEmptyString(config.brevoApiKey)) {
      errors.push('NUXT_BREVO_API_KEY must be set when Brevo integration is enabled')
    }

    if (!isNonEmptyString(config.brevoSenderEmail)) {
      errors.push('NUXT_BREVO_SENDER_EMAIL must be set when Brevo integration is enabled')
    }
  }

  const openAiConfigured = isNonEmptyString(config.openAiApiKey)

  if (openAiConfigured && !isNonEmptyString(config.openAiModel)) {
    errors.push('NUXT_OPENAI_MODEL must be set when OpenAI integration is enabled')
  }

  if (isNonEmptyString(config.appUrl) && !isAbsoluteHttpUrl(config.appUrl)) {
    errors.push('NUXT_APP_URL must be an absolute http(s) URL')
  }

  return {
    errors,
    warnings
  } satisfies ConfigValidationResult
}

export function enforceConfigurationHardening() {
  if (validated) {
    return
  }

  const { errors, warnings } = validateRuntimeConfiguration()
  const isProduction = process.env.NODE_ENV === 'production'

  for (const warning of warnings) {
    console.warn(`[config-hardening] ${warning}`)
  }

  if (errors.length) {
    const message = `[config-hardening] ${errors.join('; ')}`

    if (isProduction) {
      throw new Error(message)
    }

    console.warn(message)
  }

  validated = true
}
