import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timeRangeToDate } from '@/lib/utils'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type { TimeRange } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const range = (req.nextUrl.searchParams.get('range') ?? '30d') as TimeRange
  const since = timeRangeToDate(range).toISOString()

  const { data, error } = await supabase
    .from('citations')
    .select('*, user:users(handle)')
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
  const { lat, long: lng, agency, incident_date, description } = body

  if (!lat || !lng) return NextResponse.json({ error: 'Location required' }, { status: 400 })
  if (!isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }
  if (!agency) return NextResponse.json({ error: 'Agency required' }, { status: 400 })
  if (!incident_date) return NextResponse.json({ error: 'Incident date required' }, { status: 400 })

  const { data, error } = await supabase
    .from('citations')
    .insert({
      user_id: user.id, lat, long: lng, agency, incident_date,
      description: description ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
