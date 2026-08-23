import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/events/[id]/broadcast — organizer messages everyone marked going.
// Delivered as normal DMs so replies land in the existing thread.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await supabase
    .from('events').select('user_id, title').eq('id', params.id).single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.user_id !== user.id) {
    return NextResponse.json({ error: 'Only the organizer can message attendees' }, { status: 403 })
  }

  const { body } = await req.json() as { body: string }
  if (!body?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })

  const { data: rsvps } = await supabase
    .from('event_rsvps').select('user_id').eq('event_id', params.id).eq('status', 'going')

  // The organizer's own RSVP doesn't need a message
  const recipients = (rsvps ?? []).map(r => r.user_id).filter(id => id !== user.id)
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No one has RSVP\'d going yet' }, { status: 400 })
  }

  // Give the message context — it arrives in a thread that may be about anything
  const text = `Re: ${event.title}\n\n${body.trim()}`

  const { error } = await supabase.from('direct_messages').insert(
    recipients.map(id => ({ sender_id: user.id, recipient_id: id, body: text })),
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sent: recipients.length })
}
