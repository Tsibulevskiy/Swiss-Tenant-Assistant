import { z } from 'zod'

export const createCheckFromDocumentSchema = z.object({
  documentId: z.coerce.number().int().positive()
})
