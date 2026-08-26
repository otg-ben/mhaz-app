import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/discussions/[id] — thread with replies and reactions
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      *, user:users!discussions_user_id_fkey(handle),
      replies:discussion_replies(id, user_id, body, created_at, user:users(handle))
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const replies = (data.replies ?? []) as { id: string; created_at: string }[]
  const targetIds = [data.id, ...replies.map(r => r.id)]

  // Polymorphic table — no FK to embed, so fetch and stitch
  const { data: reactions } = await supabase
    .from('reactions').select('*').in('target_id', targetIds)

  const all = reactions ?? []
  const shaped = {
    ...data,
    reactions: all.filter(r => r.target_type === 'discussion' && r.target_id === data.id),
    replies: replies
      .map(rep => ({
        ...rep,
        reactions: all.filter(r => r.target_type === 'reply' && r.target_id === rep.id),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }
  return NextResponse.json({ data: shaped })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: thread } = await supabase.from('discussions').select('user_id').eq('id', params.id).single()
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (thread.user_id !== user.id) return NextResponse.json({ error: 'Not yours' }, { status: 403 })

  const { error } = await supabase.from('discussions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
