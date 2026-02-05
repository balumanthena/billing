'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

export async function createAgreementWithPhases(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single() as any
    if (!profile?.company_id) return { message: 'No company found' }

    try {
        const rawData = formData.get('data') as string
        const input = JSON.parse(rawData)

        // Input structure:
        // {
        //   customerId: string,
        //   title: string, // Mapped to project_settings.title or distinct column?
        //   date: string,
        //   grandTotal: number,
        //   taxMode: 'exclusive' | 'inclusive',
        //   gstRate: number,
        //   tdsRate: number,
        //   billingAddress: object,
        //   phases: [{ name, percentage, amount }]
        // }

        // 1. Create Agreement
        const { data: agreement, error: aggError } = await (supabase.from('agreements') as any)
            .insert({
                company_id: profile.company_id,
                customer_id: input.customerId,
                date: input.date,
                status: 'draft',
                grand_total: input.grandTotal,
                tax_mode: input.taxMode,
                gst_rate: input.gstRate,
                tds_rate: input.tdsRate,
                project_settings: { title: input.title }, // Storing title in json for now or allow schema update?
                // Let's assume we might want a real column later, but JSON is safer for now if column doesn't exist
                services_snapshot: {}, // Legacy requirement
                billing_address: input.billingAddress,
                created_by: user.id
            })
            .select()
            .single()

        if (aggError) throw aggError

        // 2. Create Phases
        if (input.phases && input.phases.length > 0) {
            const phasePayload = input.phases.map((p: any, index: number) => ({
                agreement_id: agreement.id,
                name: p.name,
                percentage: p.percentage,
                amount: p.amount,
                sequence: index + 1,
                status: 'pending'
            }))

            const { error: phaseError } = await (supabase.from('agreement_phases') as any)
                .insert(phasePayload)

            if (phaseError) throw phaseError
        }

        revalidatePath('/dashboard/agreements')
        return { success: true, message: 'Agreement created successfully', id: agreement.id }

    } catch (e: any) {
        console.error('Create Agreement Failed:', e)
        return { success: false, message: e.message }
    }
}

export async function getAgreementWithPhases(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const { data: agreement } = await (supabase.from('agreements') as any)
        .select(`
            *,
            phases:agreement_phases(*)
        `)
        .eq('id', id)
        .single()

    if (agreement && agreement.phases) {
        agreement.phases.sort((a: any, b: any) => a.sequence - b.sequence)
    }

    return agreement
}

export async function getInvoiceablePhases(agreementId: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    // Get phases that are NOT fully invoiced
    const { data: phases } = await (supabase.from('agreement_phases') as any)
        .select(`
            *,
            invoices:invoices(grand_total, status)
        `)
        .eq('agreement_id', agreementId)
        .neq('status', 'fully_invoiced')
        .order('sequence')

    // Calculate remaining for each
    const invoiceable = phases?.map((phase: any) => {
        const invoicedAmount = phase.invoices
            ?.filter((inv: any) => inv.status !== 'cancelled')
            .reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0) || 0

        return {
            ...phase,
            already_invoiced: invoicedAmount,
            remaining_balance: Math.max(0, phase.amount - invoicedAmount)
        }
    })

    return invoiceable || []
}

export async function getActiveAgreements(customerId: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const { data: agreements } = await (supabase.from('agreements') as any)
        .select('id, project_settings, grand_total, date')
        .eq('customer_id', customerId)
        .neq('status', 'expired') // Assuming 'active' or 'draft' or 'signed'
        .order('created_at', { ascending: false })

    return agreements?.map((a: any) => ({
        id: a.id,
        title: a.project_settings?.title || 'Untitled Agreement',
        grand_total: a.grand_total,
        date: a.date
    })) || []
}
