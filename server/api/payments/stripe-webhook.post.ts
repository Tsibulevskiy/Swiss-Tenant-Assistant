import { parseAndVerifyStripeWebhook, processStripeWebhookEvent } from '../../modules/payments/stripe-webhook'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event, 'utf8')

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing webhook body'
    })
  }

  const stripeSignature = getHeader(event, 'stripe-signature')
  const stripeEvent = parseAndVerifyStripeWebhook({
    payload: rawBody,
    signatureHeader: stripeSignature
  })
  const result = await processStripeWebhookEvent(stripeEvent)

  return {
    received: true,
    eventType: stripeEvent.type,
    result
  }
})
