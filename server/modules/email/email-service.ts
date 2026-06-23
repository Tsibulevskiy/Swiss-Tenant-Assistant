import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client'
import { emailMessages } from '../../db/schema'
import { writeAuditLog } from '../audit/write-audit-log'
import type { EmailTemplateCode, EmailTemplateInputMap } from './email-templates'
import { buildEmailTemplate } from './email-templates'
import { isBrevoConfigured, sendBrevoTransactionalEmail } from './brevo-email'

type SendTransactionalEmailInput = {
  userId: number
  caseId?: number | null
  templateCode: string
  recipientEmail: string
  recipientName?: string | null
  subject: string
  textContent: string
  htmlContent?: string
  payloadJson?: Record<string, unknown>
}

type SendTransactionalEmailResult = {
  status: 'sent' | 'failed'
  emailMessageId: number
  provider: 'brevo'
  providerMessageId: string | null
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendTransactionalEmailResult> {
  if (!isBrevoConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Brevo email provider is not configured'
    })
  }

  const db = getDb()
  const insertResult = await db.insert(emailMessages).values({
    userId: input.userId,
    caseId: input.caseId ?? null,
    templateCode: input.templateCode,
    recipientEmail: input.recipientEmail,
    subject: input.subject,
    payloadJson: input.payloadJson ?? {
      subject: input.subject
    },
    provider: 'brevo',
    status: 'pending'
  })

  const emailMessageId = Number(insertResult[0].insertId)

  try {
    const providerResult = await sendBrevoTransactionalEmail({
      to: [
        {
          email: input.recipientEmail,
          ...(input.recipientName
            ? { name: input.recipientName }
            : {})
        }
      ],
      subject: input.subject,
      textContent: input.textContent,
      htmlContent: input.htmlContent
    })

    await db
      .update(emailMessages)
      .set({
        providerMessageId: providerResult.messageId ?? undefined,
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null
      })
      .where(eq(emailMessages.id, emailMessageId))

    await writeAuditLog({
      userId: input.userId,
      actorType: 'user',
      action: 'email.sent',
      entityType: 'email_message',
      entityId: emailMessageId,
      metadataJson: {
        templateCode: input.templateCode,
        recipientEmail: input.recipientEmail,
        provider: 'brevo',
        providerMessageId: providerResult.messageId
      }
    })

    return {
      status: 'sent',
      emailMessageId,
      provider: 'brevo',
      providerMessageId: providerResult.messageId
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed'

    await db
      .update(emailMessages)
      .set({
        status: 'failed',
        errorMessage: message
      })
      .where(eq(emailMessages.id, emailMessageId))

    await writeAuditLog({
      userId: input.userId,
      actorType: 'user',
      action: 'email.failed',
      entityType: 'email_message',
      entityId: emailMessageId,
      metadataJson: {
        templateCode: input.templateCode,
        recipientEmail: input.recipientEmail,
        provider: 'brevo',
        errorMessage: message
      }
    })

    throw createError({
      statusCode: 502,
      statusMessage: message,
      data: {
        emailMessageId
      }
    })
  }
}

export async function sendTemplatedEmail<TTemplateCode extends EmailTemplateCode>(input: {
  userId: number
  caseId?: number | null
  recipientEmail: string
  recipientName?: string | null
  templateCode: TTemplateCode
  templateInput: EmailTemplateInputMap[TTemplateCode]
  payloadJson?: Record<string, unknown>
}) {
  const content = buildEmailTemplate(input.templateCode, input.templateInput)

  return sendTransactionalEmail({
    userId: input.userId,
    caseId: input.caseId,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    templateCode: input.templateCode,
    subject: content.subject,
    textContent: content.textContent,
    htmlContent: content.htmlContent,
    payloadJson: input.payloadJson ?? {
      templateInput: input.templateInput
    }
  })
}
