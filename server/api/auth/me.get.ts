import { apiSuccess } from '../../utils/api'
import { getCurrentUser } from '../../modules/auth/user'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  return apiSuccess({
    user
  })
})
