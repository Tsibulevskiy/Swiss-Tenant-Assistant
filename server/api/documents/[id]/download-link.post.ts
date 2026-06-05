import { documentSignedLinkRequestSchema } from '../../../../shared/schemas/documents'
import { createDocumentSignedLink } from '../../../modules/documents/create-signed-link'
import { apiSuccess } from '../../../utils/api'
import { defineAuthenticatedEventHandler } from '../../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const documentId = Number.parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(documentId) || documentId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid document id'
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const parsedBody = documentSignedLinkRequestSchema.safeParse(body || {})

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: {
        issues: parsedBody.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    })
  }

  const signedLink = await createDocumentSignedLink({
    documentId,
    user,
    expiresInMinutes: parsedBody.data.expiresInMinutes,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  setResponseStatus(event, 201)

  return apiSuccess({
    signedLink
  })
})
