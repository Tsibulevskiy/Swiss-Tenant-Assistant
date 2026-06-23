import { rerunCheckAnalysisSchema } from '../../../../shared/schemas/checks'
import { rerunCheckAnalysis } from '../../../modules/checks/rerun-check-analysis'
import { apiSuccess } from '../../../utils/api'
import { defineAuthenticatedEventHandler } from '../../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const checkId = Number(event.context.params?.id)

  if (!Number.isInteger(checkId) || checkId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid check id'
    })
  }

  const body = await readBody(event)
  const parsed = rerunCheckAnalysisSchema.safeParse(body || {})

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: {
        issues: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    })
  }

  const result = await rerunCheckAnalysis({
    checkId,
    user,
    retryMode: parsed.data.retryMode
  })

  return apiSuccess(result)
})
