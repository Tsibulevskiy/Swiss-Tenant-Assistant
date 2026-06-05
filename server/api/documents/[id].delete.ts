import { deleteDocumentById } from '../../modules/documents/delete-document'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const documentId = Number.parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(documentId) || documentId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const result = await deleteDocumentById({
    documentId,
    user,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  return apiSuccess({
    document: result
  })
})
