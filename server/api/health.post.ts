import { z } from 'zod'

import { apiSuccess } from '../utils/api'
import { parseBodyWithSchema } from '../utils/zod'

const healthSchema = z.object({
  name: z.string().trim().min(1).max(100)
})

export default defineEventHandler(async (event) => {
  const body = await parseBodyWithSchema(event, healthSchema)

  return apiSuccess({
    message: `Hello, ${body.name}`
  })
})
