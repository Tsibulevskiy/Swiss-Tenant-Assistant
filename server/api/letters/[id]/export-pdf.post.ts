import { exportLetterPdf } from '../../../modules/letters/export-letter-pdf'
import { apiSuccess } from '../../../utils/api'
import { defineAuthenticatedEventHandler } from '../../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const letterId = Number.parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(letterId) || letterId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid letter id'
    })
  }

  const result = await exportLetterPdf({
    letterId,
    user,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  setResponseStatus(event, 201)

  return apiSuccess(result)
})
