import { loginSchema } from '../../../shared/schemas/auth'
import { loginUser } from '../../modules/auth/login'
import { createSession, setSessionCookie } from '../../modules/auth/session'
import { apiSuccess } from '../../utils/api'
import { parseBodyWithSchema } from '../../utils/zod'

export default defineEventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, loginSchema)
  const user = await loginUser(body)
  const session = await createSession(user.id)

  setSessionCookie(event, session.token, session.expiresAt)

  return apiSuccess({
    user,
    session: {
      expiresAt: session.expiresAt
    }
  })
})
