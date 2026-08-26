import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Reaction } from '@/types'

const SELECT = `*, user:users!discussions_user_id_fkey(handle), replies:discussion_replies(id)`

// GET /api/discussions — newest activity first, so a revived thread resurfaces
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select(SELECT)
    .order('last_active_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data ?? []).map(d => d.id)
  // reactions is polymorphic, so it has no FK for PostgREST to embed — fetch it
  // separately and stitch the two together here
  const { data: reactions } = ids.length
    ? await supabase.from('reactions').select('*').eq('target_type', 'discussion').in('target_id', ids)
    : { data: [] as Reaction[] }

  const shaped = (data ?? []).map(d => ({
    ...d,
    reply_count: Array.isArray(d.replies) ? d.replies.length : 0,
    reactions: (reactions ?? []).filter(r => r.target_id === d.id),
    replies: undefined,
  }))
  return NextResponse.json({ data: shaped })
}

// POST /api/discussions
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, photos } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Say something first' }, { status: 400 })

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      user_id: user.id,
      title: title?.trim() || null,
      body: body.trim(),
      photos: Array.isArray(photos) ? photos : [],
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
