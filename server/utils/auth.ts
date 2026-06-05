import type { H3Event } from 'h3'

import type { AuthUser } from '../modules/auth/types'
import type { UserRole } from '../modules/auth/types'
import { requireAuthenticatedUser, requireUserRole } from '../modules/auth/user'

type AuthenticatedHandler<T> = (event: H3Event, user: AuthUser) => Promise<T> | T

export function defineAuthenticatedEventHandler<T>(handler: AuthenticatedHandler<T>) {
  return defineEventHandler(async (event) => {
    const user = await requireAuthenticatedUser(event)

    return handler(event, user)
  })
}

export function defineRoleProtectedEventHandler<T>(
  allowedRoles: readonly UserRole[],
  handler: AuthenticatedHandler<T>
) {
  return defineEventHandler(async (event) => {
    const user = await requireUserRole(event, allowedRoles)

    return handler(event, user)
  })
}
