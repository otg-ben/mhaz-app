import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(handle)')
    .eq('alert_type', params.type)
    .eq('alert_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      alert_type: params.type,
      alert_id: params.id,
      body: body.trim(),
    })
    .select('*, user:users(handle)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
