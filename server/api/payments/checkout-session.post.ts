import { createCheckoutSessionSchema } from '../../../shared/schemas/payments'
import { createCheckoutSession } from '../../modules/payments/create-checkout-session'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const body = await readBody(event)
  const parsed = createCheckoutSessionSchema.safeParse(body)

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

  const result = await createCheckoutSession(parsed.data, user)

  setResponseStatus(event, 201)

  return apiSuccess(result)
})
