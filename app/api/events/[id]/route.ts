import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isInValidRegion } from '@/lib/mapbox/bounds'

const SELECT = '*, user:users!events_user_id_fkey(handle), rsvps:event_rsvps(id, user_id, status, user:users(handle))'

// GET /api/events/[id] — used by the detail modal so RSVPs stay live
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('events').select(SELECT).eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

async function ownedEvent(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: event } = await supabase.from('events').select('user_id, starts_at').eq('id', id).single()
  if (!event) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (event.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Only the organizer can do that' }, { status: 403 }) }
  }
  return { supabase, user, event }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await ownedEvent(params.id)
  if ('error' in ctx) return ctx.error

  const body = await req.json()
  const { title, description, hosted_by, image_url, starts_at, ends_at, location_text, lat, long: lng } = body
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (title !== undefined) {
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    patch.title = title.trim()
  }
  if (description !== undefined) patch.description = description ?? ''
  if (hosted_by !== undefined) patch.hosted_by = hosted_by?.trim() || null
  if (image_url !== undefined) patch.image_url = image_url || null
  if (starts_at !== undefined) {
    if (Number.isNaN(Date.parse(starts_at))) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
    patch.starts_at = starts_at
  }
  if (ends_at !== undefined) patch.ends_at = ends_at || null

  const finalStart = (patch.starts_at as string) ?? ctx.event!.starts_at
  if (patch.ends_at && Date.parse(patch.ends_at as string) <= Date.parse(finalStart)) {
    return NextResponse.json({ error: 'End time must be after the start time' }, { status: 400 })
  }
  if (location_text !== undefined) patch.location_text = location_text?.trim() || null
  if (lat != null && lng != null) {
    if (!isInValidRegion(lat, lng)) {
      return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
    }
    patch.lat = lat
    patch.long = lng
  }

  const { data, error } = await ctx.supabase!
    .from('events').update(patch).eq('id', params.id)
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await ownedEvent(params.id)
  if ('error' in ctx) return ctx.error

  const { error } = await ctx.supabase!.from('events').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
