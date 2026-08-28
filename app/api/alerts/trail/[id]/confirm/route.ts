import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/alerts/trail/[id]/confirm — "still there".
// Toggles: confirming twice withdraws it, so a mistake is undoable.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: alert } = await supabase
    .from('trail_alerts').select('status').eq('id', params.id).single()
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alert.status === 'resolved') {
    return NextResponse.json({ error: 'This issue is already resolved' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('trail_confirmations').select('id')
    .eq('trail_id', params.id).eq('user_id', user.id).maybeSingle()

  if (existing) {
    await supabase.from('trail_confirmations').delete().eq('id', existing.id)
    return NextResponse.json({ confirmed: false })
  }

  const { error } = await supabase
    .from('trail_confirmations')
    .insert({ trail_id: params.id, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ confirmed: true })
}
