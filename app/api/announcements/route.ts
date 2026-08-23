import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isModUser } from '@/lib/auth/roles'

const SELECT = '*, user:users!announcements_user_id_fkey(handle)'

// GET /api/announcements — mod-only roster, including scheduled ones
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('announcements').select(SELECT).order('created_at', { ascending: false }).limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/announcements — mods post now or schedule for later
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, body, starts_at, ends_at } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (starts_at && Number.isNaN(Date.parse(starts_at))) {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 400 })
  }
  if (ends_at && starts_at && Date.parse(ends_at) <= Date.parse(starts_at)) {
    return NextResponse.json({ error: 'End time must be after the start time' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      user_id: user.id,
      title: title.trim(),
      body: body ?? '',
      starts_at: starts_at || new Date().toISOString(),
      ends_at: ends_at || null,
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
