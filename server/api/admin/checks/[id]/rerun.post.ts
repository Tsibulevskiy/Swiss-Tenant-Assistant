import { eq } from 'drizzle-orm'

import { rerunCheckAnalysisSchema } from '../../../../../shared/schemas/checks'

import { getDb } from '../../../../db/client'
import { checks, users } from '../../../../db/schema'
import { writeAuditLog } from '../../../../modules/audit/write-audit-log'
import { rerunCheckAnalysis } from '../../../../modules/checks/rerun-check-analysis'
import { apiSuccess } from '../../../../utils/api'
import { defineRoleProtectedEventHandler } from '../../../../utils/auth'

export default defineRoleProtectedEventHandler(['admin'], async (event, user) => {
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

  const db = getDb()
  const [found] = await db
    .select({
      id: checks.id,
      userId: users.id,
      email: users.email,
      role: users.role,
      locale: users.locale,
      createdAt: users.createdAt
    })
    .from(checks)
    .innerJoin(users, eq(checks.userId, users.id))
    .where(eq(checks.id, checkId))
    .limit(1)

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Check not found'
    })
  }

  const result = await rerunCheckAnalysis({
    checkId,
    user: {
      id: found.userId,
      email: found.email,
      role: found.role,
      locale: found.locale,
      createdAt: found.createdAt
    },
    retryMode: parsed.data.retryMode
  })

  await writeAuditLog({
    userId: user.id,
    actorType: 'admin',
    action: 'admin.check.rerun',
    entityType: 'check',
    entityId: checkId,
    ipAddress: getRequestIP(event, { xForwardedFor: true }),
    userAgent: getHeader(event, 'user-agent'),
    metadataJson: {
      retryMode: parsed.data.retryMode,
      newCheckId: result.checkId,
      caseId: result.caseId
    }
  })

  return apiSuccess(result)
})
