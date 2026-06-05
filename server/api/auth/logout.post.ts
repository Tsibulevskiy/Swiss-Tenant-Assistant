import { AUTH_SESSION_COOKIE } from '../../modules/auth/constants'
import { clearSessionCookie, revokeSessionByToken } from '../../modules/auth/session'
import { apiSuccess } from '../../utils/api'

export default defineEventHandler(async (event) => {
  const sessionToken = getCookie(event, AUTH_SESSION_COOKIE)

  if (sessionToken) {
    await revokeSessionByToken(sessionToken)
  }

  clearSessionCookie(event)

  return apiSuccess({
    loggedOut: true
  })
})
