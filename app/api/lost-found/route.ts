import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timeRangeToDate } from '@/lib/utils'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type { TimeRange } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const range = (req.nextUrl.searchParams.get('range') ?? '90d') as TimeRange
  const since = timeRangeToDate(range).toISOString()

  const { data, error } = await supabase
    .from('lost_found')
    .select('*, user:users!lost_found_user_id_fkey(handle)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, description, location_text, lat, long: lng, photos } = body

  if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 })
  if (!type || !['lost', 'found'].includes(type)) {
    return NextResponse.json({ error: 'Type must be lost or found' }, { status: 400 })
  }
  // Coordinates are optional here, but must be in-region when given
  if (lat != null && lng != null && !isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lost_found')
    .insert({
      user_id: user.id,
      type,
      description,
      location_text: location_text || null,
      lat: lat ?? null,
      long: lng ?? null,
      photos: Array.isArray(photos) ? photos : [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
