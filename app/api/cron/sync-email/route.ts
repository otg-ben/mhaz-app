import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchMhazEmailsSince } from '@/lib/mail/imap'
import { shouldSyncNow } from '@/lib/mail/schedule'

export const maxDuration = 60

// GET /api/cron/sync-email — called by Supabase pg_cron every 5 minutes.
// Bearer-authed so only the scheduler can trigger it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!shouldSyncNow()) {
    return NextResponse.json({ skipped: true, reason: 'off-hours tick' })
  }

  const supabase = await createAdminClient()

  const { data: latest } = await supabase
    .from('mhaz_emails')
    .select('received_at')
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const since = latest?.received_at ? new Date(latest.received_at) : null

  try {
    const emails = await fetchMhazEmailsSince(since)
    let ingested = 0

    for (const e of emails) {
      // gmail_message_id is unique, so re-fetching the cursor message is a no-op
      const { error } = await supabase.from('mhaz_emails').insert({
        gmail_message_id: e.gmailMessageId,
        subject: e.subject,
        sender_name: e.senderName,
        sender_email: e.senderEmail,
        body: e.body,
        received_at: e.receivedAt.toISOString(),
      })
      if (!error) ingested += 1
    }

    return NextResponse.json({ checked: emails.length, ingested })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 },
    )
  }
}
