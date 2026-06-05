import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { forgotPasswordSchema } from '../../../shared/schemas/auth'
import { getDb } from '../../db/client'
import { passwordResetTokens, users } from '../../db/schema'
import { generateSessionToken, hashSessionToken } from './session'

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const AUTH_PASSWORD_RESET_TTL_SECONDS = 60 * 60

export async function createPasswordResetRequest(input: ForgotPasswordInput) {
  const db = getDb()
  const email = input.email.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: (table, { and }) => and(eq(table.email, email), isNull(table.deletedAt)),
    columns: {
      id: true
    }
  })

  if (!user) {
    return {
      created: false as const
    }
  }

  const now = new Date()

  await db
    .update(passwordResetTokens)
    .set({
      usedAt: now
    })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )

  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + AUTH_PASSWORD_RESET_TTL_SECONDS * 1000)

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt
  })

  return {
    created: true as const,
    token,
    expiresAt
  }
}
