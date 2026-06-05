import { getDocumentById } from '../../modules/documents/get-document'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const document = await getDocumentById({
    documentId: id,
    user,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  return apiSuccess({
    document
  })
})
