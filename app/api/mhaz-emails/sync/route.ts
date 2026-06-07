import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchMhazEmailsSince } from '@/lib/gmail/client'

const COOLDOWN_MINUTES = 10

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Check when we last synced — rate limit to once per COOLDOWN_MINUTES
  const { data: latest } = await admin
    .from('mhaz_emails')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest) {
    const msSince = Date.now() - new Date(latest.created_at).getTime()
    if (msSince < COOLDOWN_MINUTES * 60 * 1000) {
      return NextResponse.json({ skipped: true, reason: 'synced recently' })
    }
  }

  // Find the most recent email in DB to use as the since date
  const { data: mostRecent } = await admin
    .from('mhaz_emails')
    .select('received_at')
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const since = mostRecent ? new Date(mostRecent.received_at) : null

  const emails = await fetchMhazEmailsSince(since)
  if (emails.length === 0) return NextResponse.json({ ingested: 0 })

  let ingested = 0
  for (const email of emails) {
    const { error } = await admin.from('mhaz_emails').insert({
      gmail_message_id: email.gmailMessageId,
      subject:          email.subject,
      sender_name:      email.senderName,
      sender_email:     email.senderEmail,
      body:             email.body,
      received_at:      email.receivedAt.toISOString(),
    })
    if (!error) ingested++
  }

  return NextResponse.json({ ingested, total: emails.length })
}
