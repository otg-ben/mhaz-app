import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PKCE callback — Supabase redirects here with ?code= when the email template
// uses a PKCE link. Implicit-flow hash tokens are handled client-side in
// AuthContext instead.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin))
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, req.nextUrl.origin))
  }
  return NextResponse.redirect(new URL('/', req.nextUrl.origin))
}
