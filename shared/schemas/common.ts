import { z } from 'zod'

export const localeSchema = z.enum(['de', 'en', 'fr', 'it'])

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)

export const passwordSchema = z
  .string()
  .min(8)
  .max(128)

export const idSchema = z.coerce.number().int().positive()

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})
