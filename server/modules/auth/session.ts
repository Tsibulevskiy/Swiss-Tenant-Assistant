import { createHash, randomBytes } from 'node:crypto'

import { and, eq, gt, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'

import { getDb } from '../../db/client'
import { userSessions } from '../../db/schema'
import { AUTH_SESSION_COOKIE, AUTH_SESSION_TTL_SECONDS } from './constants'

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateSessionToken() {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: number) {
  const db = getDb()
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_SECONDS * 1000)

  await db.insert(userSessions).values({
    userId,
    tokenHash,
    expiresAt
  })

  return {
    token,
    expiresAt
  }
}

export function setSessionCookie(event: H3Event, token: string, expiresAt: Date) {
  setCookie(event, AUTH_SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    maxAge: AUTH_SESSION_TTL_SECONDS
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, AUTH_SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}

export async function revokeSessionByToken(token: string) {
  const db = getDb()
  const tokenHash = hashSessionToken(token)
  const now = new Date()

  await db
    .update(userSessions)
    .set({
      revokedAt: now
    })
    .where(
      and(
        eq(userSessions.tokenHash, tokenHash),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now)
      )
    )
}

export async function revokeSessionsByUserId(userId: number) {
  const db = getDb()
  const now = new Date()

  await db
    .update(userSessions)
    .set({
      revokedAt: now
    })
    .where(
      and(
        eq(userSessions.userId, userId),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now)
      )
    )
}
