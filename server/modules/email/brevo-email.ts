type BrevoRecipient = {
  email: string
  name?: string
}

type SendBrevoTransactionalEmailInput = {
  to: BrevoRecipient[]
  subject: string
  textContent: string
  htmlContent?: string
}

type SendBrevoTransactionalEmailResult = {
  messageId: string | null
  responseJson: Record<string, unknown>
}

const BREVO_TRANSACTIONAL_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

export function isBrevoConfigured() {
  const config = useRuntimeConfig()

  return Boolean(config.brevoApiKey && config.brevoSenderEmail)
}

export async function sendBrevoTransactionalEmail(
  input: SendBrevoTransactionalEmailInput
): Promise<SendBrevoTransactionalEmailResult> {
  const config = useRuntimeConfig()

  if (!config.brevoApiKey) {
    throw new Error('NUXT_BREVO_API_KEY is not configured')
  }

  if (!config.brevoSenderEmail) {
    throw new Error('NUXT_BREVO_SENDER_EMAIL is not configured')
  }

  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': config.brevoApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        email: config.brevoSenderEmail,
        name: config.brevoSenderName || 'Swiss Tenant Assistant'
      },
      to: input.to,
      subject: input.subject,
      textContent: input.textContent,
      ...(input.htmlContent
        ? { htmlContent: input.htmlContent }
        : {})
    })
  })

  const responseText = await response.text()
  let responseJson: Record<string, unknown> = {}

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText) as Record<string, unknown>
    } catch {
      responseJson = {
        raw: responseText
      }
    }
  }

  if (!response.ok) {
    const providerMessage = typeof responseJson.message === 'string'
      ? responseJson.message
      : typeof responseJson.code === 'string'
        ? responseJson.code
        : `Brevo request failed with status ${response.status}`

    throw new Error(providerMessage)
  }

  return {
    messageId: typeof responseJson.messageId === 'string'
      ? responseJson.messageId
      : null,
    responseJson
  }
}
