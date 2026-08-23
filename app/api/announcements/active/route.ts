import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements/active — the newest live announcement this user
// hasn't dismissed yet, or null.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null })

  const now = new Date().toISOString()

  const { data: dismissed } = await supabase
    .from('announcement_dismissals').select('announcement_id').eq('user_id', user.id)
  const seen = (dismissed ?? []).map(d => d.announcement_id)

  let query = supabase
    .from('announcements')
    .select('*, user:users!announcements_user_id_fkey(handle)')
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('starts_at', { ascending: false })
    .limit(1)

  if (seen.length) query = query.not('id', 'in', `(${seen.join(',')})`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] ?? null })
}
