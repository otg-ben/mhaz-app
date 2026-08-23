import { google } from 'googleapis'

function getOAuthClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return auth
}

export interface ParsedEmail {
  gmailMessageId: string
  subject: string
  senderName: string
  senderEmail: string
  body: string
  receivedAt: Date
}

const GROUP_ADDRESS = 'mhaz@googlegroups.com'
const GROUP_LIST_ID = 'mhaz.googlegroups.com'

/**
 * Membership in the feed is "was this delivered via the MHAZ group" — nothing
 * else. Deliberately does NOT match on subject: Gmail's subject search is
 * word-based and ignores punctuation, so subject:"[MHAZ]" also matched private
 * mail that merely mentioned "the MHAZ list", which then surfaced to every user.
 *
 * `list:` reads the List-Id header, so it still matches when the group address
 * appears only in Bcc — which is how most list replies arrive.
 */
function buildQuery(since: Date | null) {
  const clauses = [
    `{to:${GROUP_ADDRESS} cc:${GROUP_ADDRESS} list:${GROUP_LIST_ID}}`,
  ]

  // Our own posts come back through the group; they're already in the app
  const self = process.env.MHAZ_GMAIL_ADDRESS
  if (self) clauses.push(`-from:${self}`)

  if (since) {
    // Gmail's after: takes unix seconds
    clauses.push(`after:${Math.floor(since.getTime() / 1000)}`)
  }

  return clauses.join(' ')
}

export async function fetchMhazEmailsSince(since: Date | null): Promise<ParsedEmail[]> {
  const auth  = getOAuthClient()
  const gmail = google.gmail({ version: 'v1', auth })

  const q = buildQuery(since)

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: 100,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) return []

  const emails: ParsedEmail[] = []

  for (const msg of messages) {
    if (!msg.id) continue

    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    })

    const headers    = full.data.payload?.headers ?? []
    const subject    = headers.find(h => h.name === 'Subject')?.value ?? ''
    const fromHeader = headers.find(h => h.name === 'From')?.value ?? ''
    const dateStr    = headers.find(h => h.name === 'Date')?.value ?? ''

    const { name: senderName, email: senderEmail } = parseFrom(fromHeader)
    const body = extractBody(full.data.payload)

    emails.push({
      gmailMessageId: msg.id,
      subject,
      senderName,
      senderEmail,
      body,
      receivedAt: dateStr ? new Date(dateStr) : new Date(),
    })
  }

  return emails
}

function parseFrom(from: string): { name: string; email: string } {
  // "First Last <email@example.com>" or just "email@example.com"
  const match = from.match(/^(.+?)\s*<(.+?)>$/)
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
  return { name: '', email: from.trim() }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8').trim()
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return ''
}
