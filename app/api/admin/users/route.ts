import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isModUser } from '@/lib/auth/roles'

// GET /api/admin/users?status=pending|approved — account roster for the approvals screen
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isModUser(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('users')
    .select('id, handle, email, bio, role, approved, approved_at, created_at')
    .eq('approved', status === 'approved')
    .order('created_at', { ascending: status === 'pending' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
