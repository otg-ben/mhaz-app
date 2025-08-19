export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string
          type: 'Trail' | 'LEO' | 'Citation'
          status?: 'Active' | 'Resolved'
          category: string
          location: string
          description: string
          reported_by: string
          reported_at: string
          latitude: number
          longitude: number
          photos?: string[]
          resolved_at?: string
          resolved_by?: string
          citation_date?: string
          citation_time?: string
          agency?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'Trail' | 'LEO' | 'Citation'
          status?: 'Active' | 'Resolved'
          category: string
          location: string
          description: string
          reported_by: string
          reported_at?: string
          latitude: number
          longitude: number
          photos?: string[]
          resolved_at?: string
          resolved_by?: string
          citation_date?: string
          citation_time?: string
          agency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'Trail' | 'LEO' | 'Citation'
          status?: 'Active' | 'Resolved'
          category?: string
          location?: string
          description?: string
          reported_by?: string
          reported_at?: string
          latitude?: number
          longitude?: number
          photos?: string[]
          resolved_at?: string
          resolved_by?: string
          citation_date?: string
          citation_time?: string
          agency?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          location?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          location?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_type: 'Trail' | 'LEO' | 'Citation'
      alert_status: 'Active' | 'Resolved'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}