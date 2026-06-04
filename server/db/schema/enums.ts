export const userRoleValues = ['user', 'admin'] as const

export const caseTypeValues = [
  'nebenkosten',
  'mietvertrag',
  'mietzinserhoehung',
  'deposit_return',
  'repair',
  'general_letter'
] as const

export const caseStatusValues = [
  'draft',
  'analyzing',
  'ready',
  'letter_sent',
  'waiting_response',
  'closed',
  'failed'
] as const

export const documentKindValues = [
  'mietvertrag',
  'nebenkostenabrechnung',
  'previous_nebenkostenabrechnung',
  'rent_increase_letter',
  'uebergabeprotokoll',
  'landlord_letter',
  'deduction_list',
  'photo',
  'generated_letter_pdf',
  'generated_report_pdf',
  'other'
] as const

export const documentStatusValues = [
  'uploaded',
  'processing',
  'ready',
  'failed',
  'deleted'
] as const

export const extractionEngineValues = ['pdf_text', 'ocr', 'manual'] as const

export const extractionStatusValues = ['pending', 'running', 'completed', 'failed'] as const

export const checkTypeValues = [
  'nebenkosten_check',
  'mietvertrag_check',
  'rent_increase_check',
  'deposit_return_check'
] as const

export const checkStatusValues = [
  'draft',
  'uploaded',
  'extracting',
  'analyzing',
  'payment_required',
  'ready',
  'failed'
] as const

export const riskScoreValues = ['low', 'medium', 'high'] as const

export const checkDocumentRoleValues = [
  'primary',
  'contract_reference',
  'previous_year_reference',
  'supporting'
] as const

export const findingSeverityValues = ['info', 'warning', 'high'] as const

export const aiPurposeValues = ['summary', 'recommendation', 'letter_generation', 'chat', 'explanation'] as const

export const genericRunStatusValues = ['pending', 'completed', 'failed'] as const

export const letterTypeValues = [
  'belege_request',
  'nebenkosten_objection',
  'repair_request',
  'termination',
  'deposit_return_request',
  'rent_increase_objection',
  'custom'
] as const

export const letterStatusValues = ['draft', 'generated', 'downloaded', 'sent'] as const

export const reportTypeValues = ['analysis_report'] as const

export const reportStatusValues = ['generating', 'ready', 'failed'] as const

export const productTypeValues = ['check', 'letter', 'subscription', 'credits'] as const

export const paymentProviderValues = ['stripe'] as const

export const paymentStatusValues = ['pending', 'checkout_created', 'paid', 'failed', 'refunded', 'expired'] as const

export const emailProviderValues = ['brevo'] as const

export const emailStatusValues = ['pending', 'sent', 'failed'] as const

export const actorTypeValues = ['user', 'admin', 'system'] as const

export const errorScopeValues = ['upload', 'extraction', 'ocr', 'ai', 'payment', 'email', 'report', 'security'] as const

export const errorStatusValues = ['open', 'resolved', 'ignored'] as const
