import type { userRoleValues } from '../../db/schema/enums'

export type UserRole = (typeof userRoleValues)[number]

export type AuthUser = {
  id: number
  email: string
  role: UserRole
  locale: string
  createdAt: Date
}
