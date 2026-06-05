import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (_event, user) => {
  return apiSuccess({
    user
  })
})
