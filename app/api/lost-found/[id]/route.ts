import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isInValidRegion } from '@/lib/mapbox/bounds'

/** Loads the post and confirms the caller owns it. */
async function ownedPost(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: post } = await supabase.from('lost_found').select('user_id').eq('id', id).single()
  if (!post) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (post.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Only the original poster can do that' }, { status: 403 }) }
  }
  return { supabase, user }
}

// PATCH /api/lost-found/[id] — owner edits their post
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await ownedPost(params.id)
  if ('error' in ctx) return ctx.error

  const body = await req.json()
  const { type, description, location_text, photos, lat, long: lng } = body
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (type) {
    if (!['lost', 'found'].includes(type)) {
      return NextResponse.json({ error: 'Type must be lost or found' }, { status: 400 })
    }
    patch.type = type
  }
  if (description !== undefined) {
    if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 })
    patch.description = description
  }
  if (location_text !== undefined) patch.location_text = location_text || null
  if (Array.isArray(photos)) patch.photos = photos
  if (lat != null && lng != null) {
    if (!isInValidRegion(lat, lng)) {
      return NextResponse.json({ error: 'Location must be within Marin County / southern Sonoma' }, { status: 400 })
    }
    patch.lat = lat
    patch.long = lng
  }

  const { data, error } = await ctx.supabase!
    .from('lost_found').update(patch).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/lost-found/[id] — owner removes their post
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await ownedPost(params.id)
  if ('error' in ctx) return ctx.error

  const { error } = await ctx.supabase!.from('lost_found').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
