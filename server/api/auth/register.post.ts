import { registerSchema } from '../../../shared/schemas/auth'
import { registerUser } from '../../modules/auth/register'
import { createSession, setSessionCookie } from '../../modules/auth/session'
import { apiSuccess } from '../../utils/api'
import { parseBodyWithSchema } from '../../utils/zod'

export default defineEventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, registerSchema)
  const user = await registerUser(body)
  const session = await createSession(user.id)

  setSessionCookie(event, session.token, session.expiresAt)

  setResponseStatus(event, 201)

  return apiSuccess({
    user,
    session: {
      expiresAt: session.expiresAt
    }
  })
})
