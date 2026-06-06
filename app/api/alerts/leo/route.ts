import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timeRangeToDate } from '@/lib/utils'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type { TimeRange } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const range = (req.nextUrl.searchParams.get('range') ?? '24h') as TimeRange
  const since = timeRangeToDate(range).toISOString()

  const { data, error } = await supabase
    .from('leo_alerts')
    .select('*, user:users(handle)')
    .gte('created_at', since)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lat, long: lng, agency, description } = body

  if (!lat || !lng) return NextResponse.json({ error: 'Location required' }, { status: 400 })
  if (!isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }
  if (!agency) return NextResponse.json({ error: 'Agency required' }, { status: 400 })

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('leo_alerts')
    .insert({ user_id: user.id, lat, long: lng, agency, description: description ?? '', expires_at: expiresAt })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
