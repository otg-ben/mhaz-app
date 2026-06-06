import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership and 24h window
  const { data: alert } = await supabase
    .from('leo_alerts')
    .select('user_id, created_at')
    .eq('id', params.id)
    .single()

  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alert.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (Date.now() - new Date(alert.created_at).getTime() > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Edit window expired' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['agency', 'description'] as const
  const updates = Object.fromEntries(
    allowed.filter(k => k in body).map(k => [k, body[k]])
  )

  const { data, error } = await supabase
    .from('leo_alerts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: alert } = await supabase
    .from('leo_alerts')
    .select('user_id, created_at')
    .eq('id', params.id)
    .single()

  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alert.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (Date.now() - new Date(alert.created_at).getTime() > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Delete window expired' }, { status: 403 })
  }

  const { error } = await supabase.from('leo_alerts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
