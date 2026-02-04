'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getParties() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: parties } = await (supabase
        .from('parties') as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return parties || []
}

export async function upsertParty(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const gstin = formData.get('gstin') as string
    const type = formData.get('type') as string
    const state = formData.get('state') as string
    const state_code = formData.get('state_code') as string
    const address = formData.get('address') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const pan = formData.get('pan') as string
    const city = formData.get('city') as string

    const payload = {
        company_id: profile.company_id,
        name,
        gstin,
        type,
        state,
        state_code,
        address,
        email,
        phone,
        pan,
        city
    }

    let error = null

    if (id) {
        const { error: updateError } = await (supabase
            .from('parties') as any)
            .update(payload)
            .eq('id', id)
        error = updateError
    } else {
        const { error: insertError } = await (supabase
            .from('parties') as any)
            .insert(payload)
        error = insertError
    }

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/dashboard/parties')
    return { message: 'success' }
}

export async function getPartyDetails(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return null

    // 1. Fetch Party Details
    const { data: party } = await (supabase
        .from('parties') as any)
        .select('*')
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single()

    if (!party) return null

    // 2. Fetch Invoices
    const { data: invoices } = await (supabase
        .from('invoices') as any)
        .select('*, invoice_items(*)')
        .eq('customer_id', id)
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false)
        .order('date', { ascending: false })

    // 3. Fetch Payments (linked to these invoices)
    // We can fetch payments where invoice_id is in the list of invoice IDs
    const invoiceIds = invoices?.map((inv: any) => inv.id) || []
    let payments: any[] = []

    if (invoiceIds.length > 0) {
        const { data: paymentData } = await (supabase
            .from('payments') as any)
            .select('*, invoices(invoice_number)')
            .in('invoice_id', invoiceIds)
            .order('payment_date', { ascending: false })
        payments = paymentData || []
    }

    // 4. Fetch Master Contracts (Master Invoices)
    const { data: contracts } = await (supabase
        .from('master_invoices') as any)
        .select('*')
        .eq('customer_id', id)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })


    // --- AGGREGATIONS ---

    // Total Billed
    const totalBilled = invoices?.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0) || 0

    // Total Received
    const totalReceived = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // Outstanding
    // Note: Accurately this should be sum(invoice.total - invoice.paid). 
    // Ideally we should trust the 'status' or calculate per invoice.
    // For now: Global difference.
    const outstanding = totalBilled - totalReceived

    // Service Usage Stats
    // Map item names to frequency and total amount
    const serviceStats: Record<string, { count: number, total: number }> = {}

    invoices?.forEach((inv: any) => {
        inv.invoice_items?.forEach((item: any) => {
            const name = item.description || "Unknown Service"
            if (!serviceStats[name]) {
                serviceStats[name] = { count: 0, total: 0 }
            }
            serviceStats[name].count += (item.quantity || 1) // Frequency of usage or quantity? "Frequency" usually means count of invoices containing it.
            // Let's use count of occurrences for "Frequency"
            // serviceStats[name].count += 1 

            serviceStats[name].total += (item.total_amount || 0)
        })
    })

    // Convert to array and sort by total value
    const topServices = Object.entries(serviceStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10) // Top 10


    return {
        party,
        invoices: invoices || [],
        payments,
        contracts: contracts || [],
        stats: {
            totalBilled,
            totalReceived,
            outstanding,
            invoiceCount: invoices?.length || 0,
            activeContracts: contracts?.filter((c: any) => c.status === 'active').length || 0,
            lastInvoiceDate: invoices?.[0]?.date || null
        },
        topServices
    }
}
