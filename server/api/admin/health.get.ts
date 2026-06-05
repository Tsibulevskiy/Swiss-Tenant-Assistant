import { apiSuccess } from '../../utils/api'
import { defineRoleProtectedEventHandler } from '../../utils/auth'

export default defineRoleProtectedEventHandler(['admin'], async (_event, user) => {
  return apiSuccess({
    admin: true,
    user
  })
})
