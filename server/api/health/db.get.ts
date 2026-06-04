import { sql } from 'drizzle-orm'

import { apiSuccess } from '../../utils/api'
import { getDb } from '../../db/client'

export default defineEventHandler(async () => {
  const db = getDb()
  const result = await db.execute(sql`select 1 as ok`)

  return apiSuccess({
    status: 'ok',
    database: result[0]
  })
})
