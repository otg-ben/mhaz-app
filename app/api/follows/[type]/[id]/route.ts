import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ following: false })

  const { data } = await supabase
    .from('alert_follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('alert_type', params.type)
    .eq('alert_id', params.id)
    .maybeSingle()

  return NextResponse.json({ following: !!data })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('alert_follows')
    .upsert({
      user_id: user.id,
      alert_type: params.type,
      alert_id: params.id,
    }, { onConflict: 'user_id,alert_type,alert_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('alert_follows')
    .delete()
    .eq('user_id', user.id)
    .eq('alert_type', params.type)
    .eq('alert_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
