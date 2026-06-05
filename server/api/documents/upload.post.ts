import { documentUploadFieldsSchema } from '../../../shared/schemas/documents'
import { createUploadedDocument } from '../../modules/documents/upload'
import { apiSuccess } from '../../utils/api'
import { defineAuthenticatedEventHandler } from '../../utils/auth'

export default defineAuthenticatedEventHandler(async (event, user) => {
  const parts = await readMultipartFormData(event)

  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Multipart form data is required'
    })
  }

  const fields: Record<string, string> = {}
  let filePart: { data: Buffer; filename: string; type?: string } | null = null

  for (const part of parts) {
    if (part.name === 'file' && part.filename && part.data) {
      filePart = {
        data: Buffer.from(part.data),
        filename: part.filename,
        type: part.type
      }
      continue
    }

    if (part.name && typeof part.data !== 'undefined') {
      fields[part.name] = Buffer.from(part.data).toString('utf8')
    }
  }

  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File field is required'
    })
  }

  const parsedFields = documentUploadFieldsSchema.safeParse(fields)

  if (!parsedFields.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: {
        issues: parsedFields.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      }
    })
  }

  const document = await createUploadedDocument({
    user,
    fields: parsedFields.data,
    file: filePart,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent')
  })

  setResponseStatus(event, 201)

  return apiSuccess({
    document
  })
})
