import { createHash } from 'node:crypto'

import type { H3Event } from 'h3'

type RateLimitPolicy = {
  key: string
  methods?: string[]
  path: RegExp
  windowMs: number
  max: number
}

type RateLimitRecord = {
  count: number
  resetAt: number
}

const rateLimitPolicies: RateLimitPolicy[] = [
  {
    key: 'auth_login',
    methods: ['POST'],
    path: /^\/api\/auth\/login$/,
    windowMs: 10 * 60 * 1000,
    max: 5
  },
  {
    key: 'auth_register',
    methods: ['POST'],
    path: /^\/api\/auth\/register$/,
    windowMs: 30 * 60 * 1000,
    max: 5
  },
  {
    key: 'auth_recovery',
    methods: ['POST'],
    path: /^\/api\/auth\/(forgot-password|reset-password)$/,
    windowMs: 30 * 60 * 1000,
    max: 5
  },
  {
    key: 'documents_upload',
    methods: ['POST'],
    path: /^\/api\/documents\/upload$/,
    windowMs: 10 * 60 * 1000,
    max: 20
  },
  {
    key: 'payments_checkout',
    methods: ['POST'],
    path: /^\/api\/payments\/checkout-session$/,
    windowMs: 10 * 60 * 1000,
    max: 10
  },
  {
    key: 'email_send',
    methods: ['POST'],
    path: /^\/api\/emails\//,
    windowMs: 10 * 60 * 1000,
    max: 5
  },
  {
    key: 'admin_actions',
    methods: ['POST', 'PATCH', 'PUT', 'DELETE'],
    path: /^\/api\/admin\//,
    windowMs: 10 * 60 * 1000,
    max: 30
  },
  {
    key: 'document_download',
    methods: ['GET'],
    path: /^\/api\/documents\/download\//,
    windowMs: 10 * 60 * 1000,
    max: 60
  },
  {
    key: 'write_api_default',
    methods: ['POST', 'PATCH', 'PUT', 'DELETE'],
    path: /^\/api\//,
    windowMs: 60 * 1000,
    max: 120
  }
]

function getRequestPath(event: H3Event) {
  return event.path || getRequestURL(event).pathname
}

function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function getRateLimitFingerprint(event: H3Event) {
  const forwardedIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const sessionCookie = getCookie(event, 'sta_session')
  const actor = sessionCookie ? `session:${sessionCookie}` : `ip:${forwardedIp}`

  return hashValue(actor)
}

function matchesPolicy(event: H3Event, policy: RateLimitPolicy) {
  const method = event.method.toUpperCase()
  const path = getRequestPath(event)

  if (policy.methods && !policy.methods.includes(method)) {
    return false
  }

  return policy.path.test(path)
}

function findRateLimitPolicy(event: H3Event) {
  const path = getRequestPath(event)

  if (!path.startsWith('/api/')) {
    return null
  }

  if (path === '/api/health' || path === '/api/health/db' || path === '/api/payments/stripe-webhook') {
    return null
  }

  return rateLimitPolicies.find(policy => matchesPolicy(event, policy)) || null
}

export async function enforceRateLimit(event: H3Event) {
  const config = useRuntimeConfig()

  if (!config.rateLimitEnabled) {
    return
  }

  const policy = findRateLimitPolicy(event)

  if (!policy) {
    return
  }

  const fingerprint = getRateLimitFingerprint(event)
  const now = Date.now()
  const windowKey = Math.floor(now / policy.windowMs)
  const storageKey = `rate-limit:${policy.key}:${fingerprint}:${windowKey}`
  const storage = useStorage<RateLimitRecord>('cache')
  const existing = await storage.getItem(storageKey)
  const resetAt = (windowKey + 1) * policy.windowMs
  const record: RateLimitRecord = existing && existing.resetAt > now
    ? {
      count: existing.count + 1,
      resetAt: existing.resetAt
    }
    : {
      count: 1,
      resetAt
    }

  await storage.setItem(storageKey, record)

  const remaining = Math.max(0, policy.max - record.count)
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000))

  setHeader(event, 'X-RateLimit-Limit', String(policy.max))
  setHeader(event, 'X-RateLimit-Remaining', String(remaining))
  setHeader(event, 'X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)))

  if (record.count <= policy.max) {
    return
  }

  setHeader(event, 'Retry-After', resetInSeconds)

  throw createError({
    statusCode: 429,
    statusMessage: 'Too many requests'
  })
}
