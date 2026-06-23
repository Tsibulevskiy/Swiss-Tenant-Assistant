import { createLetterDraftSchema } from '../../../shared/schemas/letters'
import { generateLetterDraft } from '../../modules/letters/generate-letter-draft'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const body = await readBody(event)
  const parsed = createLetterDraftSchema.safeParse(body)

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

  const result = await generateLetterDraft(parsed.data, user)

  return apiSuccess(result)
})
