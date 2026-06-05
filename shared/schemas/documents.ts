import { z } from 'zod'

import { documentKindValues } from '../../server/db/schema/enums'

export const documentUploadFieldsSchema = z.object({
  kind: z.enum(documentKindValues),
  caseId: z
    .string()
    .trim()
    .regex(/^\d+$/)
    .optional()
    .transform(value => (value ? Number(value) : undefined))
})

export const documentSignedLinkRequestSchema = z.object({
  expiresInMinutes: z.coerce.number().int().min(1).max(1440).optional().default(15)
})
