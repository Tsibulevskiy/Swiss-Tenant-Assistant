import { createCheckFromDocumentSchema } from '../../../shared/schemas/checks'
import { createCheckFromDocument } from '../../modules/checks/create-check-from-document'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const body = await readBody(event)
  const parsed = createCheckFromDocumentSchema.safeParse(body)

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

  const result = await createCheckFromDocument({
    documentId: parsed.data.documentId,
    user
  })

  return apiSuccess(result)
})
