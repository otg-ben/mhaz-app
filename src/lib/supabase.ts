import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown, context: string) => {
  console.error(`Supabase error in ${context}:`, error)
  
  if (error && typeof error === 'object' && 'message' in error) {
    throw new Error(error.message as string)
  }
  
  throw new Error(`An error occurred in ${context}`)
}

// Helper function to check if user is authenticated
export const requireAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    throw new Error(`Authentication error: ${error.message}`)
  }
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}