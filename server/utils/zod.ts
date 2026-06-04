import type { H3Event } from 'h3'
import type { ZodSchema } from 'zod'

export async function parseBodyWithSchema<TSchema>(event: H3Event, schema: ZodSchema<TSchema>) {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: {
        issues: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    })
  }

  return parsed.data
}
