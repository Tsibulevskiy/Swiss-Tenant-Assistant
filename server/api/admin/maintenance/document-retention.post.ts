import { apiSuccess } from '../../../utils/api'
import { defineRoleProtectedEventHandler } from '../../../utils/auth'
import { writeAuditLog } from '../../../modules/audit/write-audit-log'
import { purgeExpiredDocuments } from '../../../modules/documents/retention'

export default defineRoleProtectedEventHandler(['admin'], async (event, user) => {
  const result = await purgeExpiredDocuments()

  await writeAuditLog({
    userId: user.id,
    actorType: 'admin',
    action: 'admin.document_retention.run',
    entityType: 'maintenance',
    entityId: null,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent'),
    metadataJson: result
  })

  return apiSuccess(result)
})
