export const emailTemplateCodes = [
  'upload_confirmation',
  'analysis_ready',
  'receipt',
  'access_link'
] as const

export type EmailTemplateCode = (typeof emailTemplateCodes)[number]

type EmailTemplateContent = {
  subject: string
  textContent: string
  htmlContent: string
}

type UploadConfirmationTemplateInput = {
  locale?: string
  caseTitle: string | null
  documentName: string
  uploadedAt: string
}

type AnalysisReadyTemplateInput = {
  locale?: string
  caseTitle: string | null
  checkType: string
  riskScore: string | null
  summaryText: string | null
  resultUrl?: string | null
}

type ReceiptTemplateInput = {
  locale?: string
  productName: string
  amountChf: string
  currency: string
  paidAt: string
  receiptReference: string
}

type AccessLinkTemplateInput = {
  locale?: string
  resourceLabel: string
  accessUrl: string
  expiresAt: string
}

export type EmailTemplateInputMap = {
  upload_confirmation: UploadConfirmationTemplateInput
  analysis_ready: AnalysisReadyTemplateInput
  receipt: ReceiptTemplateInput
  access_link: AccessLinkTemplateInput
}

function normalizeLocale(locale?: string) {
  const value = (locale || 'de').toLowerCase()

  return value.startsWith('de') ? 'de' : 'en'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderHtmlDocument(subject: string, lines: string[]) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:#111827;background:#f9fafb;">',
    '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;padding:24px;">',
    `<h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${escapeHtml(subject)}</h1>`,
    ...lines.map(line => `<p style="margin:0 0 12px;line-height:1.55;">${line}</p>`),
    '</div>',
    '</body>',
    '</html>'
  ].join('')
}

function prettifyCheckType(checkType: string, locale: 'de' | 'en') {
  const map: Record<string, string> = {
    nebenkosten_check: locale === 'de' ? 'Nebenkosten-Check' : 'Utility bill check',
    mietvertrag_check: locale === 'de' ? 'Mietvertrags-Check' : 'Rental contract check',
    rent_increase_check: locale === 'de' ? 'Mietzinserhoehungs-Check' : 'Rent increase check',
    deposit_return_check: locale === 'de' ? 'Depot-Rueckgabe-Check' : 'Deposit return check'
  }

  return map[checkType] || checkType
}

function buildUploadConfirmationTemplate(input: UploadConfirmationTemplateInput): EmailTemplateContent {
  const locale = normalizeLocale(input.locale)

  if (locale === 'de') {
    const subject = input.caseTitle
      ? `Dokument hochgeladen - ${input.caseTitle}`
      : 'Dokument erfolgreich hochgeladen'
    const textContent = [
      'Ihr Dokument wurde erfolgreich hochgeladen.',
      `Datei: ${input.documentName}`,
      input.caseTitle ? `Fall: ${input.caseTitle}` : null,
      `Zeitpunkt: ${input.uploadedAt}`,
      'Die Analyse wird vorbereitet.'
    ].filter(Boolean).join('\n')

    return {
      subject,
      textContent,
      htmlContent: renderHtmlDocument(subject, [
        'Ihr Dokument wurde erfolgreich hochgeladen.',
        `Datei: <strong>${escapeHtml(input.documentName)}</strong>`,
        input.caseTitle ? `Fall: <strong>${escapeHtml(input.caseTitle)}</strong>` : '',
        `Zeitpunkt: <strong>${escapeHtml(input.uploadedAt)}</strong>`,
        'Die Analyse wird vorbereitet.'
      ].filter(Boolean))
    }
  }

  const subject = input.caseTitle
    ? `Document uploaded - ${input.caseTitle}`
    : 'Document uploaded successfully'
  const textContent = [
    'Your document was uploaded successfully.',
    `File: ${input.documentName}`,
    input.caseTitle ? `Case: ${input.caseTitle}` : null,
    `Time: ${input.uploadedAt}`,
    'The analysis is now being prepared.'
  ].filter(Boolean).join('\n')

  return {
    subject,
    textContent,
    htmlContent: renderHtmlDocument(subject, [
      'Your document was uploaded successfully.',
      `File: <strong>${escapeHtml(input.documentName)}</strong>`,
      input.caseTitle ? `Case: <strong>${escapeHtml(input.caseTitle)}</strong>` : '',
      `Time: <strong>${escapeHtml(input.uploadedAt)}</strong>`,
      'The analysis is now being prepared.'
    ].filter(Boolean))
  }
}

function buildAnalysisReadyTemplate(input: AnalysisReadyTemplateInput): EmailTemplateContent {
  const locale = normalizeLocale(input.locale)
  const checkLabel = prettifyCheckType(input.checkType, locale)
  const summary = input.summaryText?.trim() || (locale === 'de'
    ? 'Die Analyse ist abgeschlossen.'
    : 'The analysis has completed.')

  if (locale === 'de') {
    const subject = input.caseTitle
      ? `Analyse bereit - ${input.caseTitle}`
      : 'Ihre Analyse ist bereit'
    const textContent = [
      `${checkLabel} abgeschlossen.`,
      input.caseTitle ? `Fall: ${input.caseTitle}` : null,
      input.riskScore ? `Risiko: ${input.riskScore}` : null,
      '',
      summary,
      input.resultUrl ? '' : null,
      input.resultUrl ? `Ergebnis aufrufen: ${input.resultUrl}` : null
    ].filter(item => item !== null).join('\n')

    return {
      subject,
      textContent,
      htmlContent: renderHtmlDocument(subject, [
        `${escapeHtml(checkLabel)} abgeschlossen.`,
        input.caseTitle ? `Fall: <strong>${escapeHtml(input.caseTitle)}</strong>` : '',
        input.riskScore ? `Risiko: <strong>${escapeHtml(input.riskScore)}</strong>` : '',
        escapeHtml(summary),
        input.resultUrl ? `Ergebnis aufrufen: <a href="${escapeHtml(input.resultUrl)}">${escapeHtml(input.resultUrl)}</a>` : ''
      ].filter(Boolean))
    }
  }

  const subject = input.caseTitle
    ? `Analysis ready - ${input.caseTitle}`
    : 'Your analysis is ready'
  const textContent = [
    `${checkLabel} completed.`,
    input.caseTitle ? `Case: ${input.caseTitle}` : null,
    input.riskScore ? `Risk: ${input.riskScore}` : null,
    '',
    summary,
    input.resultUrl ? '' : null,
    input.resultUrl ? `Open result: ${input.resultUrl}` : null
  ].filter(item => item !== null).join('\n')

  return {
    subject,
    textContent,
    htmlContent: renderHtmlDocument(subject, [
      `${escapeHtml(checkLabel)} completed.`,
      input.caseTitle ? `Case: <strong>${escapeHtml(input.caseTitle)}</strong>` : '',
      input.riskScore ? `Risk: <strong>${escapeHtml(input.riskScore)}</strong>` : '',
      escapeHtml(summary),
      input.resultUrl ? `Open result: <a href="${escapeHtml(input.resultUrl)}">${escapeHtml(input.resultUrl)}</a>` : ''
    ].filter(Boolean))
  }
}

function buildReceiptTemplate(input: ReceiptTemplateInput): EmailTemplateContent {
  const locale = normalizeLocale(input.locale)

  if (locale === 'de') {
    const subject = `Zahlungsbestaetigung - ${input.productName}`
    const textContent = [
      'Vielen Dank fuer Ihre Zahlung.',
      `Produkt: ${input.productName}`,
      `Betrag: ${input.amountChf} ${input.currency}`,
      `Bezahlt am: ${input.paidAt}`,
      `Referenz: ${input.receiptReference}`
    ].join('\n')

    return {
      subject,
      textContent,
      htmlContent: renderHtmlDocument(subject, [
        'Vielen Dank fuer Ihre Zahlung.',
        `Produkt: <strong>${escapeHtml(input.productName)}</strong>`,
        `Betrag: <strong>${escapeHtml(input.amountChf)} ${escapeHtml(input.currency)}</strong>`,
        `Bezahlt am: <strong>${escapeHtml(input.paidAt)}</strong>`,
        `Referenz: <strong>${escapeHtml(input.receiptReference)}</strong>`
      ])
    }
  }

  const subject = `Payment receipt - ${input.productName}`
  const textContent = [
    'Thank you for your payment.',
    `Product: ${input.productName}`,
    `Amount: ${input.amountChf} ${input.currency}`,
    `Paid at: ${input.paidAt}`,
    `Reference: ${input.receiptReference}`
  ].join('\n')

  return {
    subject,
    textContent,
    htmlContent: renderHtmlDocument(subject, [
      'Thank you for your payment.',
      `Product: <strong>${escapeHtml(input.productName)}</strong>`,
      `Amount: <strong>${escapeHtml(input.amountChf)} ${escapeHtml(input.currency)}</strong>`,
      `Paid at: <strong>${escapeHtml(input.paidAt)}</strong>`,
      `Reference: <strong>${escapeHtml(input.receiptReference)}</strong>`
    ])
  }
}

function buildAccessLinkTemplate(input: AccessLinkTemplateInput): EmailTemplateContent {
  const locale = normalizeLocale(input.locale)

  if (locale === 'de') {
    const subject = `Zugriffslink - ${input.resourceLabel}`
    const textContent = [
      'Ihr Zugriffslink ist bereit.',
      `Ressource: ${input.resourceLabel}`,
      `Link: ${input.accessUrl}`,
      `Gueltig bis: ${input.expiresAt}`
    ].join('\n')

    return {
      subject,
      textContent,
      htmlContent: renderHtmlDocument(subject, [
        'Ihr Zugriffslink ist bereit.',
        `Ressource: <strong>${escapeHtml(input.resourceLabel)}</strong>`,
        `Link: <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>`,
        `Gueltig bis: <strong>${escapeHtml(input.expiresAt)}</strong>`
      ])
    }
  }

  const subject = `Access link - ${input.resourceLabel}`
  const textContent = [
    'Your access link is ready.',
    `Resource: ${input.resourceLabel}`,
    `Link: ${input.accessUrl}`,
    `Valid until: ${input.expiresAt}`
  ].join('\n')

  return {
    subject,
    textContent,
    htmlContent: renderHtmlDocument(subject, [
      'Your access link is ready.',
      `Resource: <strong>${escapeHtml(input.resourceLabel)}</strong>`,
      `Link: <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>`,
      `Valid until: <strong>${escapeHtml(input.expiresAt)}</strong>`
    ])
  }
}

export function buildEmailTemplate<TTemplateCode extends EmailTemplateCode>(
  templateCode: TTemplateCode,
  input: EmailTemplateInputMap[TTemplateCode]
): EmailTemplateContent {
  switch (templateCode) {
    case 'upload_confirmation':
      return buildUploadConfirmationTemplate(input as EmailTemplateInputMap['upload_confirmation'])
    case 'analysis_ready':
      return buildAnalysisReadyTemplate(input as EmailTemplateInputMap['analysis_ready'])
    case 'receipt':
      return buildReceiptTemplate(input as EmailTemplateInputMap['receipt'])
    case 'access_link':
      return buildAccessLinkTemplate(input as EmailTemplateInputMap['access_link'])
  }
}
