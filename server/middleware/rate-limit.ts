import { enforceRateLimit } from '../utils/rate-limit'

export default defineEventHandler(async event => {
  await enforceRateLimit(event)
})
