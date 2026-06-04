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
