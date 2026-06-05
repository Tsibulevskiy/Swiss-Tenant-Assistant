import { and, eq, gt, isNull } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { resetPasswordSchema } from '../../../shared/schemas/auth'
import { getDb } from '../../db/client'
import { passwordResetTokens, userSessions, users } from '../../db/schema'
import { hashSessionToken } from './session'

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export async function resetPassword(input: ResetPasswordInput) {
  const db = getDb()
  const tokenHash = hashSessionToken(input.token)
  const now = new Date()

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, now)
    ),
    columns: {
      id: true,
      userId: true
    }
  })

  if (!resetToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset token'
    })
  }

  const passwordHash = await hash(input.password, 12)

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash
      })
      .where(eq(users.id, resetToken.userId))

    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: now
      })
      .where(eq(passwordResetTokens.id, resetToken.id))

    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: now
      })
      .where(
        and(
          eq(passwordResetTokens.userId, resetToken.userId),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now)
        )
      )

    await tx
      .update(userSessions)
      .set({
        revokedAt: now
      })
      .where(
        and(
          eq(userSessions.userId, resetToken.userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now)
        )
      )
  })
}
