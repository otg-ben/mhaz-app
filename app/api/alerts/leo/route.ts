import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timeRangeToDate } from '@/lib/utils'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import { isModUser } from '@/lib/auth/roles'
import type { TimeRange } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const range = (req.nextUrl.searchParams.get('range') ?? '24h') as TimeRange
  const since = timeRangeToDate(range).toISOString()

  const now = new Date().toISOString()

  // Advisories ignore the time-range filter — they're pinned until they expire
  const { data, error } = await supabase
    .from('leo_alerts')
    .select('*, user:users(handle)')
    .gt('expires_at', now)
    .or(`created_at.gte.${since},is_advisory.eq.true`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lat, long: lng, agency, description, is_advisory, expires_at } = body

  if (!lat || !lng) return NextResponse.json({ error: 'Location required' }, { status: 400 })
  if (!isInValidRegion(lat, lng)) {
    return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
  }
  if (!agency) return NextResponse.json({ error: 'Agency required' }, { status: 400 })

  // Advisories are mod-only and carry their own expiration date
  let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const advisory = is_advisory === true

  if (advisory) {
    if (!(await isModUser(user.id))) {
      return NextResponse.json({ error: 'Only mods can post advisories' }, { status: 403 })
    }
    if (!expires_at || Number.isNaN(Date.parse(expires_at))) {
      return NextResponse.json({ error: 'Advisories need an expiration date' }, { status: 400 })
    }
    if (Date.parse(expires_at) <= Date.now()) {
      return NextResponse.json({ error: 'Expiration must be in the future' }, { status: 400 })
    }
    expiresAt = new Date(expires_at).toISOString()
  }

  const { data, error } = await supabase
    .from('leo_alerts')
    .insert({ user_id: user.id, lat, long: lng, agency, description: description ?? '', expires_at: expiresAt, is_advisory: advisory })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
