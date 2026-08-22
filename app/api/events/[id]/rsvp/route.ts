import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RsvpStatus } from '@/types'

// PUT /api/events/[id]/rsvp — set going / not_going (idempotent)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json() as { status: RsvpStatus }
  if (!['going', 'not_going'].includes(status)) {
    return NextResponse.json({ error: 'Status must be going or not_going' }, { status: 400 })
  }

  const { data: event } = await supabase.from('events').select('id').eq('id', params.id).single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: params.id, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/events/[id]/rsvp — clear the response entirely
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('event_rsvps').delete().eq('event_id', params.id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
