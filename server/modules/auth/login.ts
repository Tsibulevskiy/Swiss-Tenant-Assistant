import { eq, isNull } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import { z } from 'zod'

import { loginSchema } from '../../../shared/schemas/auth'
import { getDb } from '../../db/client'
import { users } from '../../db/schema'

type LoginInput = z.infer<typeof loginSchema>

export async function loginUser(input: LoginInput) {
  const db = getDb()
  const email = input.email.trim().toLowerCase()

  const user = await db.query.users.findFirst({
    where: (table, { and }) => and(eq(table.email, email), isNull(table.deletedAt)),
    columns: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      locale: true,
      createdAt: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  const passwordMatches = await compare(input.password, user.passwordHash)

  if (!passwordMatches) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt
  }
}
