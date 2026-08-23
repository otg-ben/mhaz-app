import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

/**
 * Reads MHAZ list mail over IMAP using an app password.
 *
 * Replaces the OAuth Gmail API path: unverified OAuth apps using Gmail's
 * restricted scopes have their refresh token revoked every 7 days, which
 * would have taken ingestion down weekly.
 */

const GROUP_ADDRESS = 'mhaz@googlegroups.com'
const GROUP_LIST_ID = 'mhaz.googlegroups.com'

export interface ParsedEmail {
  gmailMessageId: string
  subject: string
  senderName: string
  senderEmail: string
  body: string
  receivedAt: Date
}

function client() {
  const user = process.env.MHAZ_GMAIL_ADDRESS
  const pass = process.env.MHAZ_GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('MHAZ_GMAIL_ADDRESS and MHAZ_GMAIL_APP_PASSWORD are required')

  return new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  })
}

/**
 * Membership is "delivered via the MHAZ group" — never a subject match.
 * Gmail's subject search ignores punctuation, so subject:"[MHAZ]" also matched
 * private mail merely mentioning "the MHAZ list".
 */
function gmailQuery(since: Date | null) {
  // in:anywhere reaches Spam and Trash, which "All Mail" deliberately excludes.
  // Gmail flagged this group's own welcome message as spam, so list mail
  // landing there is a real possibility and would otherwise vanish silently.
  //
  // Accepts either route: relayed by the group, or addressed straight to the
  // app mailbox with the [MHAZ] tag. The subject clause is safe here because
  // this is a dedicated mailbox — unlike a personal inbox, where matching on
  // subject once pulled private correspondence into the feed.
  const self = process.env.MHAZ_GMAIL_ADDRESS
  const direct = self ? ` (to:${self} subject:"[MHAZ]")` : ''
  const parts = [`in:anywhere {to:${GROUP_ADDRESS} cc:${GROUP_ADDRESS} list:${GROUP_LIST_ID}${direct}}`]

  // Our own posts come back through the group; they're already in the app
  if (self) parts.push(`-from:${self}`)

  if (since) parts.push(`after:${Math.floor(since.getTime() / 1000)}`)
  return parts.join(' ')
}

export async function fetchMhazEmailsSince(since: Date | null): Promise<ParsedEmail[]> {
  const imap = client()
  await imap.connect()

  const emails: ParsedEmail[] = []

  try {
    // All Mail rather than INBOX, so archived or filtered list mail still counts
    const lock = await imap.getMailboxLock('[Gmail]/All Mail')
    try {
      // X-GM-RAW lets us use Gmail's own search syntax over IMAP
      const uids = await imap.search({ gmailRaw: gmailQuery(since) } as never, { uid: true })
      if (!uids || uids.length === 0) return []

      // Newest first, capped so a big backlog can't stall a cron run
      const recent = uids.slice(-100)

      for await (const msg of imap.fetch(
        recent,
        { uid: true, source: true, envelope: true },
        { uid: true },
      )) {
        if (!msg.source) continue
        const parsed = await simpleParser(msg.source)

        const from = parsed.from?.value?.[0]
        const senderEmail = (from?.address ?? '').toLowerCase()

        // Belt-and-braces: skip our own posts even if the query let one through
        if (senderEmail && senderEmail === process.env.MHAZ_GMAIL_ADDRESS?.toLowerCase()) continue

        emails.push({
          // Message-ID is stable across mailboxes; IMAP UIDs are not
          gmailMessageId: parsed.messageId ?? `uid-${msg.uid}`,
          subject: parsed.subject ?? '(no subject)',
          senderName: from?.name ?? '',
          senderEmail,
          body: (parsed.text ?? stripHtml(parsed.html || '')).trim(),
          receivedAt: parsed.date ?? new Date(),
        })
      }
    } finally {
      lock.release()
    }
  } finally {
    await imap.logout().catch(() => {})
  }

  return emails
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
}
