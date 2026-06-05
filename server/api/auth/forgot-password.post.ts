import { forgotPasswordSchema } from '../../../shared/schemas/auth'
import { createPasswordResetRequest } from '../../modules/auth/forgot-password'
import { apiSuccess } from '../../utils/api'
import { parseBodyWithSchema } from '../../utils/zod'

export default defineEventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, forgotPasswordSchema)
  const result = await createPasswordResetRequest(body)

  return apiSuccess({
    message: 'If the account exists, password reset instructions will be sent.',
    ...(process.env.NODE_ENV !== 'production' && result.created
      ? {
          debug: {
            resetToken: result.token,
            expiresAt: result.expiresAt
          }
        }
      : {})
  })
})
