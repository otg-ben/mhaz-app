import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DirectMessage, DMConversation } from '@/types'

// Two FKs point at users, so PostgREST needs the constraint names spelled out
const SELECT = `
  id, sender_id, recipient_id, body, status, created_at, read_at,
  sender:users!direct_messages_sender_id_fkey(handle),
  recipient:users!direct_messages_recipient_id_fkey(handle)
`

// GET /api/dms — one row per person you've talked to, newest first
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('direct_messages')
    .select(SELECT)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byUser = new Map<string, DMConversation>()
  for (const m of (data ?? []) as unknown as DirectMessage[]) {
    const outgoing = m.sender_id === user.id
    const otherId = outgoing ? m.recipient_id : m.sender_id
    const otherHandle = (outgoing ? m.recipient?.handle : m.sender?.handle) ?? '—'

    let convo = byUser.get(otherId)
    if (!convo) {
      // Rows arrive newest-first, so the first one seen is the latest message
      convo = {
        userId: otherId,
        handle: otherHandle,
        lastMessage: m.body,
        lastAt: m.created_at,
        lastFromMe: outgoing,
        unread: 0,
      }
      byUser.set(otherId, convo)
    }
    if (!outgoing && m.status === 'sent') convo.unread += 1
  }

  return NextResponse.json({ data: Array.from(byUser.values()) })
}
