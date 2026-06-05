import { and, eq, gt, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'

import { getDb } from '../../db/client'
import { userSessions, users } from '../../db/schema'
import { AUTH_SESSION_COOKIE } from './constants'
import { hashSessionToken } from './session'
import type { AuthUser, UserRole } from './types'

export async function getCurrentUser(event: H3Event): Promise<AuthUser | null> {
  const sessionToken = getCookie(event, AUTH_SESSION_COOKIE)

  if (!sessionToken) {
    return null
  }

  const db = getDb()
  const tokenHash = hashSessionToken(sessionToken)
  const now = new Date()

  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      locale: users.locale,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(
      and(
        eq(userSessions.tokenHash, tokenHash),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now)
      )
    )
    .limit(1)

  if (!result || result.deletedAt) {
    return null
  }

  return {
    id: result.id,
    email: result.email,
    role: result.role,
    locale: result.locale,
    createdAt: result.createdAt
  }
}

export async function requireAuthenticatedUser(event: H3Event): Promise<AuthUser> {
  const user = await getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  return user
}

export function hasRequiredRole(userRole: UserRole, allowedRoles: readonly UserRole[]) {
  return allowedRoles.includes(userRole)
}

export async function requireUserRole(event: H3Event, allowedRoles: readonly UserRole[]) {
  const user = await requireAuthenticatedUser(event)

  if (!hasRequiredRole(user.role, allowedRoles)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions'
    })
  }

  return user
}
