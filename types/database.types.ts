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
      agreements: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          agreement_number: string | null
          date: string
          valid_until: string | null
          status: string
          grand_total: number
          tax_mode: string
          project_settings: Json
          services_snapshot: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id: string
          agreement_number?: string | null
          date?: string
          valid_until?: string | null
          status?: string
          grand_total?: number
          tax_mode?: string
          project_settings?: Json
          services_snapshot?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string
          agreement_number?: string | null
          date?: string
          valid_until?: string | null
          status?: string
          grand_total?: number
          tax_mode?: string
          project_settings?: Json
          services_snapshot?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          gstin: string
          address: string | null
          city: string | null
          state: string
          state_code: string
          email: string | null
          phone: string | null
          pan: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          gstin: string
          address?: string | null
          city?: string | null
          state: string
          state_code: string
          email?: string | null
          phone?: string | null
          pan?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          gstin?: string
          address?: string | null
          city?: string | null
          state?: string
          state_code?: string
          email?: string | null
          phone?: string | null
          pan?: string | null
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
      parties: {
        Row: {
          id: string
          company_id: string
          name: string
          gstin: string | null
          address: string | null
          city: string | null
          state: string
          state_code: string
          email: string | null
          phone: string | null
          pan: string | null
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          gstin?: string | null
          address?: string | null
          city?: string | null
          state: string
          state_code: string
          email?: string | null
          phone?: string | null
          pan?: string | null
          type?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          gstin?: string | null
          address?: string | null
          city?: string | null
          state?: string
          state_code?: string
          email?: string | null
          phone?: string | null
          pan?: string | null
          type?: string
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          invoice_number: string
          date: string
          due_date: string | null
          status: 'draft' | 'finalized' | 'cancelled'
          subtotal: number | null
          tax_total: number | null
          grand_total: number | null
          customer_snapshot: Json | null
          company_snapshot: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
          master_invoice_id: string | null
          phase_number: number | null
          phase_label: string | null
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          invoice_number: string
          date: string
          due_date?: string | null
          status?: 'draft' | 'finalized' | 'cancelled'
          subtotal?: number | null
          tax_total?: number | null
          grand_total?: number | null
          customer_snapshot?: Json | null
          company_snapshot?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          master_invoice_id?: string | null
          phase_number?: number | null
          phase_label?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          invoice_number?: string
          date?: string
          due_date?: string | null
          status?: 'draft' | 'finalized' | 'cancelled'
          subtotal?: number | null
          tax_total?: number | null
          grand_total?: number | null
          customer_snapshot?: Json | null
          company_snapshot?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          master_invoice_id?: string | null
          phase_number?: number | null
          phase_label?: string | null
        }
      }
      master_invoices: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          master_invoice_number: string
          title: string | null
          start_date: string | null
          end_date: string | null
          total_amount: number
          paid_amount: number
          outstanding_amount: number
          status: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id: string
          master_invoice_number: string
          title?: string | null
          start_date?: string | null
          end_date?: string | null
          total_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          status?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string
          master_invoice_number?: string
          title?: string | null
          start_date?: string | null
          end_date?: string | null
          total_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          status?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_notes: {
        Row: {
          id: string
          company_id: string
          invoice_id: string
          cn_number: string
          date: string
          reason: string | null
          subtotal: number | null
          tax_total: number | null
          grand_total: number | null
          customer_snapshot: Json | null
          company_snapshot: Json | null
          status: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          invoice_id: string
          cn_number: string
          date: string
          reason?: string | null
          subtotal?: number | null
          tax_total?: number | null
          grand_total?: number | null
          customer_snapshot?: Json | null
          company_snapshot?: Json | null
          status?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          invoice_id?: string
          cn_number?: string
          date?: string
          reason?: string | null
          subtotal?: number | null
          tax_total?: number | null
          grand_total?: number | null
          customer_snapshot?: Json | null
          company_snapshot?: Json | null
          status?: string | null
          created_by?: string | null
          created_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
