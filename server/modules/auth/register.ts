import { eq } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { registerSchema } from '../../../shared/schemas/auth'
import { users } from '../../db/schema'
import { getDb } from '../../db/client'

type RegisterInput = z.infer<typeof registerSchema>

export async function registerUser(input: RegisterInput) {
  const db = getDb()
  const email = input.email.trim().toLowerCase()

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true
    }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User already exists'
    })
  }

  const now = new Date()
  const passwordHash = await hash(input.password, 12)

  await db.insert(users).values({
    email,
    passwordHash,
    locale: input.locale,
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
    disclaimerAcceptedAt: now
  })

  const createdUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      email: true,
      role: true,
      locale: true,
      createdAt: true
    }
  })

  if (!createdUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }

  return createdUser
}
