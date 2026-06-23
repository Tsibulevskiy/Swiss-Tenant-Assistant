type StripeCheckoutLineItem = {
  name: string
  amountChf: string
  quantity: number
}

type CreateStripeCheckoutSessionInput = {
  successUrl: string
  cancelUrl: string
  customerEmail: string
  clientReferenceId: string
  metadata: Record<string, string>
  lineItem: StripeCheckoutLineItem
}

type StripeCheckoutSessionResult = {
  id: string
  url: string
  paymentIntentId: string | null
  rawJson: Record<string, unknown>
}

function parseStripeAmountToCents(amountChf: string) {
  const amount = Number(amountChf)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid Stripe amount')
  }

  return Math.round(amount * 100)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

export function isStripeConfigured() {
  const config = useRuntimeConfig()

  return Boolean(config.stripeSecretKey)
}

export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutSessionInput
): Promise<StripeCheckoutSessionResult> {
  const config = useRuntimeConfig()

  if (!config.stripeSecretKey) {
    throw new Error('Stripe secret key is not configured')
  }

  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('success_url', input.successUrl)
  body.set('cancel_url', input.cancelUrl)
  body.set('customer_email', input.customerEmail)
  body.set('client_reference_id', input.clientReferenceId)
  body.set('payment_method_types[0]', 'card')
  body.set('line_items[0][quantity]', String(input.lineItem.quantity))
  body.set('line_items[0][price_data][currency]', 'chf')
  body.set('line_items[0][price_data][unit_amount]', String(parseStripeAmountToCents(input.lineItem.amountChf)))
  body.set('line_items[0][price_data][product_data][name]', input.lineItem.name)

  for (const [key, value] of Object.entries(input.metadata)) {
    body.set(`metadata[${key}]`, value)
    body.set(`payment_intent_data[metadata][${key}]`, value)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.stripeSecretKey}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const payload = await response.json() as unknown
  const payloadRecord = asRecord(payload)

  if (!response.ok || !payloadRecord) {
    const errorRecord = payloadRecord ? asRecord(payloadRecord.error) : null
    const message = typeof errorRecord?.message === 'string'
      ? errorRecord.message
      : `Stripe request failed with status ${response.status}`

    throw new Error(message)
  }

  if (typeof payloadRecord.id !== 'string' || typeof payloadRecord.url !== 'string') {
    throw new Error('Stripe Checkout response did not include session id and url')
  }

  return {
    id: payloadRecord.id,
    url: payloadRecord.url,
    paymentIntentId: typeof payloadRecord.payment_intent === 'string' ? payloadRecord.payment_intent : null,
    rawJson: payloadRecord
  }
}
