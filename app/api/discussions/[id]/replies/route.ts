import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/discussions/[id]/replies — a DB trigger bumps last_active_at
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })

  const { data, error } = await supabase
    .from('discussion_replies')
    .insert({ discussion_id: params.id, user_id: user.id, body: body.trim() })
    .select('id, user_id, body, created_at, user:users(handle)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
