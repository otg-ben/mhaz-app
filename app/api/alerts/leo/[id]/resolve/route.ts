import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isModUser } from '@/lib/auth/roles'

// PATCH /api/alerts/leo/[id]/resolve — end an advisory before its expiry date.
// Expiring it (rather than deleting) keeps the record and lets the same
// expires_at check drive both the map and the feed.
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: alert } = await supabase
    .from('leo_alerts').select('is_advisory').eq('id', params.id).single()
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!alert.is_advisory) {
    return NextResponse.json({ error: 'Only advisories can be resolved' }, { status: 400 })
  }
  if (!(await isModUser(user.id))) {
    return NextResponse.json({ error: 'Only mods can resolve advisories' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('leo_alerts')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
