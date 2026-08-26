import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/types'

// POST /api/reactions — toggles: reacting with the same emoji again removes it
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_type, target_id, emoji } = await req.json() as {
    target_type: 'discussion' | 'reply'; target_id: string; emoji: ReactionEmoji
  }

  if (!['discussion', 'reply'].includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  }
  if (!REACTION_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Unsupported reaction' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('reactions').select('id')
    .eq('user_id', user.id).eq('target_type', target_type)
    .eq('target_id', target_id).eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
    return NextResponse.json({ reacted: false })
  }

  const { error } = await supabase
    .from('reactions')
    .insert({ user_id: user.id, target_type, target_id, emoji })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reacted: true })
}
