import { getDb } from '../../db/client'
import { auditLogs } from '../../db/schema'

export async function writeAuditLog(input: {
  userId?: number | null
  actorType: 'user' | 'admin' | 'system'
  action: string
  entityType: string
  entityId?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  metadataJson?: Record<string, unknown> | null
}) {
  const db = getDb()

  await db.insert(auditLogs).values({
    userId: input.userId ?? null,
    actorType: input.actorType,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadataJson: input.metadataJson ?? null
  })
}
