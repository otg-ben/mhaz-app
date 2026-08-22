import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type { EventScope } from '@/types'

const SELECT = '*, user:users!events_user_id_fkey(handle), rsvps:event_rsvps(id, user_id, status, user:users(handle))'

// GET /api/events?scope=upcoming|past
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const scope = (req.nextUrl.searchParams.get('scope') ?? 'upcoming') as EventScope
  const now = new Date().toISOString()

  // An event stays "upcoming" until its end time (or start, when open-ended)
  const query = supabase.from('events').select(SELECT)
  const { data, error } = scope === 'past'
    ? await query.lt('starts_at', now).order('starts_at', { ascending: false }).limit(100)
    : await query.gte('starts_at', now).order('starts_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/events
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, hosted_by, image_url, starts_at, ends_at, location_text, lat, long: lng } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!starts_at) return NextResponse.json({ error: 'Start date and time required' }, { status: 400 })
  if (Number.isNaN(Date.parse(starts_at))) {
    return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
  }
  if (ends_at && Date.parse(ends_at) <= Date.parse(starts_at)) {
    return NextResponse.json({ error: 'End time must be after the start time' }, { status: 400 })
  }
  if (lat != null && lng != null && !isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description ?? '',
      hosted_by: hosted_by?.trim() || null,
      image_url: image_url || null,
      starts_at,
      ends_at: ends_at || null,
      location_text: location_text?.trim() || null,
      lat: lat ?? null,
      long: lng ?? null,
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
