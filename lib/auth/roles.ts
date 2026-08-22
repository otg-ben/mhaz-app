import { createAdminClient } from '@/lib/supabase/server'

/** True when the user is approved AND holds mod or admin rights. */
export async function isModUser(userId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('users')
    .select('role, is_admin, approved')
    .eq('id', userId)
    .single()
  return !!data?.approved && (data.is_admin === true || data.role === 'admin' || data.role === 'mod')
}

/** True for full admins only (role handouts, destructive actions). */
export async function isAdminUser(userId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('users')
    .select('role, is_admin, approved')
    .eq('id', userId)
    .single()
  return !!data?.approved && (data.is_admin === true || data.role === 'admin')
}
