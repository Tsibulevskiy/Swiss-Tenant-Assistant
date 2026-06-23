import { and, eq } from 'drizzle-orm'

import type { CreateCheckoutSessionInput } from '../../../shared/schemas/payments'
import { getDb } from '../../db/client'
import { payments, products } from '../../db/schema'
import { writeAuditLog } from '../audit/write-audit-log'
import type { AuthUser } from '../auth/types'
import { createStripeCheckoutSession, isStripeConfigured } from './stripe-checkout'

function buildLocalizedPath(locale: string, path: string) {
  return locale === 'de' ? path : `/${locale}${path}`
}

function buildAbsoluteUrl(appUrl: string, pathname: string, query?: Record<string, string>) {
  if (!appUrl) {
    throw new Error('NUXT_APP_URL is not configured')
  }

  const url = new URL(pathname, appUrl)

  for (const [key, value] of Object.entries(query || {})) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  user: AuthUser,
  requestContext?: {
    ipAddress?: string | null
    userAgent?: string | null
  }
) {
  if (!isStripeConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe Checkout is not configured'
    })
  }

  const db = getDb()
  const config = useRuntimeConfig()
  const product = await db.query.products.findFirst({
    where: and(eq(products.code, input.productCode), eq(products.isActive, true)),
    columns: {
      id: true,
      code: true,
      name: true,
      priceChf: true,
      currency: true
    }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found'
    })
  }

  const paymentInsert = await db.insert(payments).values({
    userId: user.id,
    caseId: input.caseId,
    checkId: input.checkId,
    productId: product.id,
    provider: 'stripe',
    amount: product.priceChf,
    currency: product.currency,
    status: 'pending'
  })

  const paymentId = Number(paymentInsert[0].insertId)
  const checkoutPath = buildLocalizedPath(user.locale || 'de', '/checkout')

  try {
    const session = await createStripeCheckoutSession({
      successUrl: buildAbsoluteUrl(config.appUrl, checkoutPath, {
        product: input.productCode,
        payment: 'success',
        session_id: '{CHECKOUT_SESSION_ID}'
      }),
      cancelUrl: buildAbsoluteUrl(config.appUrl, checkoutPath, {
        product: input.productCode,
        payment: 'cancel'
      }),
      customerEmail: user.email,
      clientReferenceId: `payment_${paymentId}`,
      metadata: {
        paymentId: String(paymentId),
        userId: String(user.id),
        productCode: product.code
      },
      lineItem: {
        name: product.name,
        amountChf: String(product.priceChf),
        quantity: 1
      }
    })

    await db
      .update(payments)
      .set({
        providerSessionId: session.id,
        providerPaymentIntentId: session.paymentIntentId ?? undefined,
        status: 'checkout_created'
      })
      .where(eq(payments.id, paymentId))

    await writeAuditLog({
      userId: user.id,
      actorType: user.role === 'admin' ? 'admin' : 'user',
      action: 'payment.checkout_created',
      entityType: 'payment',
      entityId: paymentId,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      metadataJson: {
        productCode: product.code,
        caseId: input.caseId ?? null,
        checkId: input.checkId ?? null,
        sessionId: session.id
      }
    })

    return {
      paymentId,
      checkoutUrl: session.url,
      sessionId: session.id
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe Checkout session creation failed'

    await db
      .update(payments)
      .set({
        status: 'failed'
      })
      .where(eq(payments.id, paymentId))

    await writeAuditLog({
      userId: user.id,
      actorType: user.role === 'admin' ? 'admin' : 'user',
      action: 'payment.checkout_failed',
      entityType: 'payment',
      entityId: paymentId,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
      metadataJson: {
        productCode: product.code,
        caseId: input.caseId ?? null,
        checkId: input.checkId ?? null,
        errorMessage: message
      }
    })

    throw createError({
      statusCode: 502,
      statusMessage: message
    })
  }
}
