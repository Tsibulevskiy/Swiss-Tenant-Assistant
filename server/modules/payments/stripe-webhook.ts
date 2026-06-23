import { createHmac, timingSafeEqual } from 'node:crypto'

import { and, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { checks, payments } from '../../db/schema'
import { writeAuditLog } from '../audit/write-audit-log'

type StripeWebhookEvent = {
  id: string
  type: string
  data?: {
    object?: Record<string, unknown>
  }
}

function parseStripeSignatureHeader(headerValue: string) {
  const parts = headerValue.split(',')
  const signatures: string[] = []
  let timestamp = ''

  for (const part of parts) {
    const [key, value] = part.split('=', 2)

    if (key === 't') {
      timestamp = value || ''
    }

    if (key === 'v1' && value) {
      signatures.push(value)
    }
  }

  return {
    timestamp,
    signatures
  }
}

function verifyStripeWebhookSignature(input: {
  payload: string
  signatureHeader: string
  endpointSecret: string
}) {
  const { payload, signatureHeader, endpointSecret } = input
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader)

  if (!timestamp || !signatures.length) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = createHmac('sha256', endpointSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

  return signatures.some(signature => {
    const candidate = Buffer.from(signature, 'utf8')

    return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer)
  })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function getPaymentIdFromMetadata(metadata: unknown) {
  const metadataRecord = asRecord(metadata)
  const rawPaymentId = getString(metadataRecord?.paymentId)

  if (!rawPaymentId || !/^\d+$/.test(rawPaymentId)) {
    return null
  }

  return Number(rawPaymentId)
}

async function markPaymentPaid(input: {
  paymentId: number
  eventId: string
  eventType: string
  rawEvent: StripeWebhookEvent
  providerSessionId: string | null
  providerPaymentIntentId: string | null
}) {
  const db = getDb()
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, input.paymentId),
    columns: {
      id: true,
      checkId: true,
      status: true
    }
  })

  if (!payment) {
    return { updated: false, reason: 'payment_not_found' as const }
  }

  await db
    .update(payments)
    .set({
      status: 'paid',
      providerSessionId: input.providerSessionId ?? undefined,
      providerPaymentIntentId: input.providerPaymentIntentId ?? undefined,
      paidAt: new Date(),
      rawWebhookJson: {
        eventId: input.eventId,
        eventType: input.eventType,
        payload: input.rawEvent
      }
    })
    .where(eq(payments.id, payment.id))

  if (payment.checkId) {
    await db
      .update(checks)
      .set({
        status: 'ready'
      })
      .where(and(eq(checks.id, payment.checkId), eq(checks.status, 'payment_required')))
  }

  await writeAuditLog({
    actorType: 'system',
    action: 'payment.webhook_paid',
    entityType: 'payment',
    entityId: payment.id,
    metadataJson: {
      eventId: input.eventId,
      eventType: input.eventType,
      checkId: payment.checkId,
      providerSessionId: input.providerSessionId,
      providerPaymentIntentId: input.providerPaymentIntentId
    }
  })

  return { updated: true, reason: null }
}

async function markPaymentWithStatus(input: {
  paymentId: number
  status: 'failed' | 'expired'
  eventId: string
  eventType: string
  rawEvent: StripeWebhookEvent
  providerSessionId?: string | null
  providerPaymentIntentId?: string | null
}) {
  const db = getDb()
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, input.paymentId),
    columns: {
      id: true
    }
  })

  if (!payment) {
    return { updated: false, reason: 'payment_not_found' as const }
  }

  await db
    .update(payments)
    .set({
      status: input.status,
      providerSessionId: input.providerSessionId ?? undefined,
      providerPaymentIntentId: input.providerPaymentIntentId ?? undefined,
      rawWebhookJson: {
        eventId: input.eventId,
        eventType: input.eventType,
        payload: input.rawEvent
      }
    })
    .where(eq(payments.id, payment.id))

  await writeAuditLog({
    actorType: 'system',
    action: input.status === 'expired' ? 'payment.webhook_expired' : 'payment.webhook_failed',
    entityType: 'payment',
    entityId: payment.id,
    metadataJson: {
      eventId: input.eventId,
      eventType: input.eventType,
      providerSessionId: input.providerSessionId ?? null,
      providerPaymentIntentId: input.providerPaymentIntentId ?? null
    }
  })

  return { updated: true, reason: null }
}

export function parseAndVerifyStripeWebhook(input: {
  payload: string
  signatureHeader: string | null | undefined
}) {
  const config = useRuntimeConfig()

  if (!config.stripeWebhookSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe webhook secret is not configured'
    })
  }

  if (!input.signatureHeader) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe-Signature header'
    })
  }

  const isValid = verifyStripeWebhookSignature({
    payload: input.payload,
    signatureHeader: input.signatureHeader,
    endpointSecret: config.stripeWebhookSecret
  })

  if (!isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Stripe webhook signature verification failed'
    })
  }

  let event: StripeWebhookEvent

  try {
    event = JSON.parse(input.payload) as StripeWebhookEvent
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Stripe webhook JSON payload'
    })
  }

  return event
}

export async function processStripeWebhookEvent(event: StripeWebhookEvent) {
  const object = asRecord(event.data?.object)

  if (!object) {
    return {
      handled: false,
      eventType: event.type,
      reason: 'missing_object'
    }
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const paymentId = getPaymentIdFromMetadata(object.metadata)

    if (!paymentId) {
      return { handled: false, eventType: event.type, reason: 'missing_payment_id' }
    }

    return {
      handled: true,
      eventType: event.type,
      ...(await markPaymentPaid({
        paymentId,
        eventId: event.id,
        eventType: event.type,
        rawEvent: event,
        providerSessionId: getString(object.id),
        providerPaymentIntentId: getString(object.payment_intent)
      }))
    }
  }

  if (event.type === 'checkout.session.expired') {
    const paymentId = getPaymentIdFromMetadata(object.metadata)

    if (!paymentId) {
      return { handled: false, eventType: event.type, reason: 'missing_payment_id' }
    }

    return {
      handled: true,
      eventType: event.type,
      ...(await markPaymentWithStatus({
        paymentId,
        status: 'expired',
        eventId: event.id,
        eventType: event.type,
        rawEvent: event,
        providerSessionId: getString(object.id),
        providerPaymentIntentId: getString(object.payment_intent)
      }))
    }
  }

  if (event.type === 'checkout.session.async_payment_failed' || event.type === 'payment_intent.payment_failed') {
    const paymentId = getPaymentIdFromMetadata(object.metadata)

    if (!paymentId) {
      return { handled: false, eventType: event.type, reason: 'missing_payment_id' }
    }

    return {
      handled: true,
      eventType: event.type,
      ...(await markPaymentWithStatus({
        paymentId,
        status: 'failed',
        eventId: event.id,
        eventType: event.type,
        rawEvent: event,
        providerSessionId: event.type === 'checkout.session.async_payment_failed' ? getString(object.id) : null,
        providerPaymentIntentId: getString(object.payment_intent) || getString(object.id)
      }))
    }
  }

  return {
    handled: false,
    eventType: event.type,
    reason: 'ignored_event_type'
  }
}
