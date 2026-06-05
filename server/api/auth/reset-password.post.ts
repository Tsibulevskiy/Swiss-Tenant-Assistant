import { resetPasswordSchema } from '../../../shared/schemas/auth'
import { resetPassword } from '../../modules/auth/reset-password'
import { apiSuccess } from '../../utils/api'
import { parseBodyWithSchema } from '../../utils/zod'

export default defineEventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, resetPasswordSchema)

  await resetPassword(body)

  return apiSuccess({
    passwordReset: true
  })
})
