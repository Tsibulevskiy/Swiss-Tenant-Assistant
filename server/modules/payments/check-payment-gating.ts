import { and, desc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { payments } from '../../db/schema'

const checkTypeToProductCode = {
  mietvertrag_check: 'mietvertrag_check',
  nebenkosten_check: 'nebenkosten_check',
  rent_increase_check: 'mietzinserhoehung_check',
  deposit_return_check: 'deposit_return_check'
} as const

export type CheckProductCode = (typeof checkTypeToProductCode)[keyof typeof checkTypeToProductCode]

export function getProductCodeForCheckType(checkType: string): CheckProductCode | null {
  return checkTypeToProductCode[checkType as keyof typeof checkTypeToProductCode] || null
}

export async function resolveCheckPaymentGate(input: {
  checkId: number
  checkType: string
  userId: number
}) {
  const productCode = getProductCodeForCheckType(input.checkType)

  if (!productCode) {
    return {
      requiresPayment: false,
      hasPaidAccess: true,
      productCode: null,
      paymentStatus: 'not_applicable' as const,
      latestPaymentId: null as number | null
    }
  }

  const db = getDb()
  const [latestPayment] = await db
    .select({
      id: payments.id,
      status: payments.status
    })
    .from(payments)
    .where(and(eq(payments.checkId, input.checkId), eq(payments.userId, input.userId)))
    .orderBy(desc(payments.createdAt))
    .limit(1)

  return {
    requiresPayment: true,
    hasPaidAccess: latestPayment?.status === 'paid',
    productCode,
    paymentStatus: latestPayment?.status || 'unpaid',
    latestPaymentId: latestPayment?.id || null
  }
}

export function getEffectiveCheckStatus(input: {
  originalStatus: string
  requiresPayment: boolean
  hasPaidAccess: boolean
}) {
  if (!input.requiresPayment) {
    return input.originalStatus
  }

  if ((input.originalStatus === 'ready' || input.originalStatus === 'payment_required') && !input.hasPaidAccess) {
    return 'payment_required'
  }

  if (input.originalStatus === 'payment_required' && input.hasPaidAccess) {
    return 'ready'
  }

  return input.originalStatus
}
