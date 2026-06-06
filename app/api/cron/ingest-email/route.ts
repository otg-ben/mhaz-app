import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchUnreadGroupEmails, markAsRead } from '@/lib/gmail/client'
import { classifyEmail } from '@/lib/gmail/classifier'

// Vercel cron calls this with the CRON_SECRET header for security
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// Pacific time schedule: every 10 min 5am-11pm, every hour 11pm-5am.
// The cron fires every 10 min all day; this function skips off-hour non-zero minutes.
function shouldRunNow(): boolean {
  const nowPT = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  )
  const hour   = nowPT.getHours()   // 0-23 PT
  const minute = nowPT.getMinutes()

  const isActiveHours = hour >= 5 && hour < 23  // 5:00am – 10:59pm PT
  if (isActiveHours) return true

  // Off-hours: only run at the top of the hour
  return minute === 0
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!shouldRunNow()) {
    return NextResponse.json({ skipped: true, reason: 'off-hours non-zero minute' })
  }

  const missing = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'MHAZ_GROUP_EMAIL']
    .filter(k => !process.env[k])
  if (missing.length) {
    return NextResponse.json({ error: `Missing env vars: ${missing.join(', ')}` }, { status: 500 })
  }

  try {
    const emails = await fetchUnreadGroupEmails()

    if (emails.length === 0) {
      return NextResponse.json({ ingested: 0 })
    }

    const supabase = await createAdminClient()
    let ingested = 0
    let skipped  = 0

    for (const email of emails) {
      // Deduplicate by Gmail message ID
      const { data: existing } = await supabase
        .from('mhaz_queue')
        .select('id')
        .eq('gmail_message_id', email.id)
        .maybeSingle()

      if (existing) { skipped++; continue }

      const { classification, confidence } = classifyEmail(email)

      const { error } = await supabase.from('mhaz_queue').insert({
        gmail_message_id: email.id,
        raw_email_body:   email.body,
        subject:          email.subject,
        sender:           email.sender,
        received_at:      email.receivedAt.toISOString(),
        classification,
        confidence,
      })

      if (!error) {
        await markAsRead(email.id)
        ingested++
      }
    }

    return NextResponse.json({ ingested, skipped, total: emails.length })
  } catch (err) {
    console.error('[ingest-email]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
