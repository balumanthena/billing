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
      companies: {
        Row: {
          id: string
          name: string
          gstin: string
          address: string | null
          state: string
          state_code: string
          email: string | null
          phone: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          gstin: string
          address?: string | null
          state: string
          state_code: string
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          gstin?: string
          address?: string | null
          state?: string
          state_code?: string
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          full_name: string | null
          role: 'admin' | 'accountant' | 'viewer'
          created_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          full_name?: string | null
          role?: 'admin' | 'accountant' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          full_name?: string | null
          role?: 'admin' | 'accountant' | 'viewer'
          created_at?: string
        }
      }
      // Add other tables as needed for development, will use generation later
    }
  }
}
