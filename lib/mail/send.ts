import nodemailer from 'nodemailer'
import { buildAlertEmail, type AlertEmailInput } from '@/lib/gmail/templates'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Sends alert emails from the shared MHAZ mailbox over SMTP.
 *
 * HARD RULE: only the creation of a trail, LEO or citation alert ever emails
 * the list. Comments, replies, RSVPs, DMs, lost & found and advisories are
 * contained entirely within the app. Do not add call sites beyond the three
 * alert POST routes.
 *
 * Two independent guards stand between this and the real mailing list:
 *   MHAZ_EMAIL_ENABLED must be exactly "true", and
 *   MHAZ_EMAIL_TO_OVERRIDE must be cleared.
 * While the override is set, every message goes there and the group address
 * is never used — so testing cannot reach the list by accident.
 */

function resolveRecipient(): { to: string; isOverride: boolean } | null {
  const override = process.env.MHAZ_EMAIL_TO_OVERRIDE
  if (override && override !== 'UNSET') return { to: override, isOverride: true }

  const group = process.env.MHAZ_GROUP_EMAIL
  if (!group) return null
  return { to: group, isOverride: false }
}

function transport() {
  const user = process.env.MHAZ_GMAIL_ADDRESS
  const pass = process.env.MHAZ_GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('Gmail credentials are not configured')

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
}

export interface SendResult {
  status: 'sent' | 'skipped' | 'failed'
  reason?: string
  to?: string
  messageId?: string
}

/**
 * Never throws — a failed send must not stop an alert from being posted.
 * Every attempt is recorded in email_outbox so failures are visible.
 */
export async function sendAlertEmail(
  input: AlertEmailInput,
  alertId: string,
): Promise<SendResult> {
  if (process.env.MHAZ_EMAIL_ENABLED !== 'true') {
    return { status: 'skipped', reason: 'sending disabled' }
  }

  const recipient = resolveRecipient()
  if (!recipient) return { status: 'skipped', reason: 'no recipient configured' }

  const { subject, text } = buildAlertEmail(input)
  const admin = await createAdminClient()

  const { data: row } = await admin
    .from('email_outbox')
    .insert({
      alert_type: input.type,
      alert_id: alertId,
      recipient: recipient.to,
      subject,
      status: 'pending',
    })
    .select('id')
    .single()

  try {
    const info = await transport().sendMail({
      from: `MHAZ <${process.env.MHAZ_GMAIL_ADDRESS}>`,
      to: recipient.to,
      subject,
      text,
      // Lets the ingester recognise app-sent mail even if the From check fails
      headers: { 'X-MHAZ-Source': 'app', 'X-MHAZ-Alert-Id': alertId },
    })

    if (row) {
      await admin.from('email_outbox').update({
        status: 'sent',
        gmail_message_id: info.messageId,
        sent_at: new Date().toISOString(),
      }).eq('id', row.id)
    }

    return { status: 'sent', to: recipient.to, messageId: info.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (row) {
      await admin.from('email_outbox').update({ status: 'failed', error: message }).eq('id', row.id)
    }
    return { status: 'failed', reason: message, to: recipient.to }
  }
}
