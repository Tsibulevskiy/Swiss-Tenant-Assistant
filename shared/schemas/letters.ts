import { z } from 'zod'

import { mvpLetterTypeValues } from '../../server/db/schema/enums'

const letterVariablePrimitiveSchema = z.union([
  z.string().trim().min(1),
  z.number().finite(),
  z.boolean()
])

export const createLetterDraftSchema = z.object({
  type: z.enum(mvpLetterTypeValues),
  caseId: z.coerce.number().int().positive().optional(),
  checkId: z.coerce.number().int().positive().optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  variables: z.record(z.string().trim().min(1), letterVariablePrimitiveSchema).optional().default({})
}).superRefine((value, ctx) => {
  if (value.type !== 'repair_request' && !value.checkId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkId'],
      message: 'checkId is required for document-based letter types'
    })
  }
})

export const letterVariableSchema = z.object({
  key: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1),
  source: z.enum(['user_input', 'check_context', 'system'])
})

export const generatedLetterDraftSchema = z.object({
  id: z.number().int().positive(),
  caseId: z.number().int().positive().nullable(),
  checkId: z.number().int().positive().nullable(),
  type: z.enum(mvpLetterTypeValues),
  locale: z.string().trim().min(2).max(10),
  status: z.enum(['draft', 'generated', 'downloaded', 'sent']),
  subject: z.string().trim().min(1).max(255),
  bodyText: z.string().trim().min(1),
  variables: z.array(letterVariableSchema),
  aiResultJson: z.record(z.string(), z.unknown())
})

export type CreateLetterDraftInput = z.infer<typeof createLetterDraftSchema>
export type LetterVariable = z.infer<typeof letterVariableSchema>
export type GeneratedLetterDraft = z.infer<typeof generatedLetterDraftSchema>
