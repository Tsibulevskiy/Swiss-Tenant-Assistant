import { sendTestEmailSchema } from '../../../shared/schemas/emails'
import { requireAuthenticatedUser } from '../../modules/auth/user'
import { sendTransactionalEmail } from '../../modules/email/email-service'
import { parseBodyWithSchema } from '../../utils/zod'

export default defineEventHandler(async event => {
  const user = await requireAuthenticatedUser(event)
  const body = await parseBodyWithSchema(event, sendTestEmailSchema)
  const sentAt = new Date().toISOString()
  const subject = body.subject || 'Swiss Tenant Assistant test email'
  const message = body.message || [
    'This is a test email from Swiss Tenant Assistant.',
    `Sent at: ${sentAt}`,
    `Recipient: ${user.email}`
  ].join('\n')

  const result = await sendTransactionalEmail({
    userId: user.id,
    templateCode: 'test_email',
    recipientEmail: user.email,
    subject,
    textContent: message,
    payloadJson: {
      kind: 'test_email',
      sentAt
    }
  })

  return {
    ok: true,
    emailMessageId: result.emailMessageId,
    status: result.status,
    provider: result.provider,
    providerMessageId: result.providerMessageId
  }
})
