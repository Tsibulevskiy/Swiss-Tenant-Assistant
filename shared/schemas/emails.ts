import { z } from 'zod'

export const sendTestEmailSchema = z.object({
  subject: z.string().trim().min(3).max(120).optional(),
  message: z.string().trim().min(1).max(2000).optional()
})

export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>
