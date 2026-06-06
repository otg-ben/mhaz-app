import { google } from 'googleapis'

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )
}

export function getGmailClient() {
  const auth = getOAuthClient()
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return google.gmail({ version: 'v1', auth })
}

// ─── Fetch unread MHAZ group messages ────────────────────────────────────────

export interface RawEmail {
  id: string
  threadId: string
  subject: string
  sender: string
  receivedAt: Date
  body: string
}

export async function fetchUnreadGroupEmails(): Promise<RawEmail[]> {
  const gmail = getGmailClient()
  const groupEmail = process.env.MHAZ_GROUP_EMAIL ?? ''

  // Search for unread messages from the group
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${groupEmail} is:unread`,
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) return []

  const emails: RawEmail[] = []

  for (const msg of messages) {
    if (!msg.id) continue

    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    })

    const headers = full.data.payload?.headers ?? []
    const subject = headers.find(h => h.name === 'Subject')?.value ?? ''
    const sender  = headers.find(h => h.name === 'From')?.value ?? ''
    const dateStr = headers.find(h => h.name === 'Date')?.value ?? ''

    const body = extractBody(full.data.payload)

    emails.push({
      id: msg.id,
      threadId: msg.threadId ?? '',
      subject,
      sender,
      receivedAt: dateStr ? new Date(dateStr) : new Date(),
      body,
    })
  }

  return emails
}

export async function markAsRead(messageId: string) {
  const gmail = getGmailClient()
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  })
}

// ─── Body extraction ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): string {
  if (!payload) return ''

  // Prefer plain text
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  // Walk parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }

  // Fallback to html
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return ''
}
