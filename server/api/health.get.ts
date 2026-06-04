import { apiSuccess } from '../utils/api'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()

  return apiSuccess({
    service: config.public.appName,
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})
