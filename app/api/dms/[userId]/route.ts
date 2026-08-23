import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SELECT = `
  id, sender_id, recipient_id, body, status, created_at, read_at,
  sender:users!direct_messages_sender_id_fkey(handle)
`

// GET /api/dms/[userId] — the thread, oldest first.
// Side effect: marks their messages to you as read.
export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const them = params.userId
  const { data: other } = await supabase.from('users').select('id, handle').eq('id', them).single()
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('direct_messages')
    .select(SELECT)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${them}),and(sender_id.eq.${them},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('direct_messages')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('sender_id', them)
    .eq('status', 'sent')

  return NextResponse.json({ data, user: other })
}

// POST /api/dms/[userId] — send a message
export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const them = params.userId
  if (them === user.id) return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 })

  const { body } = await req.json() as { body: string }
  if (!body?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })

  const { data: other } = await supabase.from('users').select('id').eq('id', them).single()
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: user.id, recipient_id: them, body: body.trim() })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
