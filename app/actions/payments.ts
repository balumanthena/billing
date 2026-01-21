'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getPayments() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: payments } = await (supabase
        .from('payments') as any)
        .select('*, invoices(invoice_number, customer_snapshot)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return payments || []
}

export async function recordPayment(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    const invoice_id = formData.get('invoice_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const payment_date = formData.get('payment_date') as string
    const mode = formData.get('mode') as string
    const notes = formData.get('notes') as string

    if (!invoice_id || !amount) {
        return { message: 'Invoice and Amount are required' }
    }

    const { error } = await (supabase.from('payments') as any)
        .insert({
            company_id: profile.company_id,
            invoice_id,
            amount,
            payment_date,
            mode,
            notes
        })

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/dashboard/payments')
    revalidatePath('/dashboard') // Update dashboard stats
    return { message: 'success' }
}

export async function getDashboardStats() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { revenue: 0, outstanding: 0, invoiceCount: 0 }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { revenue: 0, outstanding: 0, invoiceCount: 0 }

    // Get basic stats using simple queries

    // 1. Total Invoiced Value and Count
    const { data: invoices } = await (supabase.from('invoices') as any)
        .select('grand_total, status')
        .eq('company_id', profile.company_id)
        .neq('status', 'cancelled')

    const totalInvoiced = invoices?.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0) || 0
    const invoiceCount = invoices?.length || 0

    // 2. Total Collected
    const { data: payments } = await (supabase.from('payments') as any)
        .select('amount')
        .eq('company_id', profile.company_id)

    const totalCollected = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    return {
        revenue: totalCollected,
        outstanding: totalInvoiced - totalCollected,
        invoiceCount
    }
}
