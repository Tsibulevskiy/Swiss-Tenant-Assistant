import { z } from 'zod'

import { emailSchema, localeSchema, passwordSchema } from './common'

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  locale: localeSchema.default('de'),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  disclaimerAccepted: z.literal(true)
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
})

export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(512),
  password: passwordSchema
})
