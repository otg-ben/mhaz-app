'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  isMod: boolean
  isApproved: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, handle: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    // Email confirmation and magic links come back as an implicit-flow hash
    // (#access_token=...). @supabase/ssr runs the PKCE flow, so it ignores
    // those — without this the link lands on a signed-out page.
    const consumeUrlHash = async () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash
      if (!hash || !hash.includes('access_token')) return

      const params = new URLSearchParams(hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (!access_token || !refresh_token) return

      try {
        await supabase.auth.setSession({ access_token, refresh_token })
      } catch {
        // fall through — the normal getSession path still runs
      }
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    // Fallback: if auth doesn't resolve in 6s, clear the spinner anyway
    const fallback = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 6000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        clearTimeout(fallback)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    // Also try getSession directly — whichever resolves first wins
    consumeUrlHash().then(() => supabase.auth.getSession()).then(({ data: { session } }) => {
      if (!mounted) return
      clearTimeout(fallback)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, handle: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { handle } }, // trigger handle_new_user() reads this
    })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Signup failed' }
    // DB trigger auto-creates the public.users row with SECURITY DEFINER
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin'
  // Mods and admins can post announcements and advisories
  const isMod = isAdmin || profile?.role === 'mod'
  // New accounts stay unapproved until an admin lets them in (enforced in RLS too)
  const isApproved = profile?.approved === true

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, isAdmin, isMod, isApproved,
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
