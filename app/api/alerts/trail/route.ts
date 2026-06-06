import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timeRangeToDate } from '@/lib/utils'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type { TimeRange } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const range = (req.nextUrl.searchParams.get('range') ?? '90d') as TimeRange
  const showResolved = req.nextUrl.searchParams.get('resolved') === 'true'
  const since = timeRangeToDate(range).toISOString()

  let query = supabase
    .from('trail_alerts')
    .select('*, user:users!trail_alerts_user_id_fkey(handle), resolver:users!trail_alerts_resolved_by_fkey(handle)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (!showResolved) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lat, long: lng, issue_type, description } = body

  if (!lat || !lng) return NextResponse.json({ error: 'Location required' }, { status: 400 })
  if (!isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }
  if (!issue_type) return NextResponse.json({ error: 'Issue type required' }, { status: 400 })

  const mapExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('trail_alerts')
    .insert({
      user_id: user.id, lat, long: lng, issue_type,
      description: description ?? '', map_expires_at: mapExpiresAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
