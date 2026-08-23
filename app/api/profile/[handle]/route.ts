import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profile/[handle] — the page this powers had no route at all,
// so every profile link spun forever.
export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('users')
    .select('id, handle, email, bio, location, role, created_at, pending_handle')
    .ilike('handle', params.handle)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // pending_handle is the owner's business only
  const isMe = data.id === user.id
  return NextResponse.json({
    data: isMe ? data : { ...data, pending_handle: undefined },
  })
}

// PATCH /api/profile/[handle] — owner edits bio/location, or requests a new handle
export async function PATCH(req: NextRequest, { params }: { params: { handle: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: target } = await supabase
    .from('users').select('id').ilike('handle', params.handle).single()
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { bio, location, requested_handle } = await req.json()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (bio !== undefined) patch.bio = bio?.trim() || null
  if (location !== undefined) patch.location = location?.trim() || null

  if (requested_handle !== undefined) {
    const wanted = String(requested_handle ?? '').trim()
    if (!wanted) {
      // empty string cancels a pending request
      patch.pending_handle = null
      patch.pending_handle_at = null
    } else {
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(wanted)) {
        return NextResponse.json(
          { error: 'Handles are 3–24 characters, letters, numbers and underscores only' },
          { status: 400 },
        )
      }
      const { data: taken } = await supabase
        .from('users').select('id').ilike('handle', wanted).maybeSingle()
      if (taken && taken.id !== user.id) {
        return NextResponse.json({ error: 'That name is already taken' }, { status: 409 })
      }
      patch.pending_handle = wanted
      patch.pending_handle_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('users').update(patch).eq('id', user.id)
    .select('id, handle, email, bio, location, role, created_at, pending_handle')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
