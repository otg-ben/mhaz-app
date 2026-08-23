import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isModUser } from '@/lib/auth/roles'

// DELETE /api/announcements/[id] — mods retract an announcement
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('announcements').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
