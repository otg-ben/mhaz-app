import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isModUser, isAdminUser } from '@/lib/auth/roles'
import type { UserRole } from '@/types'

// PATCH /api/admin/users/[id] — approve, or change role
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { approved, role } = await req.json() as { approved?: boolean; role?: UserRole }
  const patch: Record<string, unknown> = {}

  if (typeof approved === 'boolean') {
    patch.approved = approved
    patch.approved_at = approved ? new Date().toISOString() : null
    patch.approved_by = approved ? user.id : null
  }
  if (role) {
    if (!['user', 'mod', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    // Only full admins may hand out roles
    if (!(await isAdminUser(user.id))) {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 })
    }
    patch.role = role
    patch.is_admin = role === 'admin'
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin.from('users').update(patch).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/users/[id] — reject a pending signup (removes the auth account too)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (params.id === user.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(params.id) // cascades to public.users
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
