import { z } from 'zod'

export const productCodeValues = [
  'mietvertrag_check',
  'nebenkosten_check',
  'mietzinserhoehung_check',
  'deposit_return_check',
  'letter_generator',
  'tenant_bundle'
] as const

export const createCheckoutSessionSchema = z.object({
  productCode: z.enum(productCodeValues),
  caseId: z.coerce.number().int().positive().optional(),
  checkId: z.coerce.number().int().positive().optional()
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
