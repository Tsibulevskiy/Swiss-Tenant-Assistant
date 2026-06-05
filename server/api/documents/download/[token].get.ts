import { downloadDocumentByToken } from '../../../modules/documents/download-document'

export default defineEventHandler(async (event) => {
  const token = (getRouterParam(event, 'token') || '').trim()

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Download token is required'
    })
  }

  const result = await downloadDocumentByToken({
    token,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  setHeader(event, 'content-type', result.mimeType)
  setHeader(event, 'content-length', result.fileSize)
  setHeader(event, 'content-disposition', `attachment; filename="${result.filename}"`)

  return result.body
})
