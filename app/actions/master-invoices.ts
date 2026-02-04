'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getMasterInvoices() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: invoices } = await (supabase
        .from('master_invoices') as any)
        .select(`
            *,
            customer:parties(name)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return invoices || []
}

export async function getMasterInvoice(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get master invoice with phases (child invoices)
    const { data: masterInvoice } = await (supabase
        .from('master_invoices') as any)
        .select(`
            *,
            customer:parties(*),
            phases:invoices(*)
        `)
        .eq('id', id)
        .single()

    if (!masterInvoice) return null

    // Sort phases by phase_number
    if (masterInvoice.phases) {
        masterInvoice.phases.sort((a: any, b: any) => (a.phase_number || 0) - (b.phase_number || 0))
    }

    return masterInvoice
}

export async function createMasterInvoice(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const rawData = formData.get('data') as string
    if (!rawData) return { message: 'No data provided' }

    const input = JSON.parse(rawData)
    // Structure expected:
    // {
    //   customerId: string,
    //   title: string,
    //   masterNumber: string,
    //   startDate: string,
    //   endDate: string,
    //   totalAmount: number,
    //   phases: [
    //     {
    //       number: 1,
    //       label: 'Phase 1',
    //       amount: number,
    //       dueDate: string,
    //       invoiceNumber: string, // generated on UI or BE
    //       lineItems: [] // Optional: if we want detailed line items per phase
    //     }
    //   ]
    // }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    // 1. Get Company & Customer Snapshots
    const { data: company } = await (supabase.from('companies') as any)
        .select('*').eq('id', profile.company_id).single()

    const { data: customer } = await (supabase.from('parties') as any)
        .select('*').eq('id', input.customerId).single()

    if (!customer) return { message: 'Customer not found' }

    // 2. Create Master Invoice
    const { data: masterInvoice, error: masterError } = await (supabase.from('master_invoices') as any)
        .insert({
            company_id: profile.company_id,
            customer_id: input.customerId,
            master_invoice_number: input.masterNumber,
            title: input.title,
            start_date: input.startDate || null,
            end_date: input.endDate || null,
            total_amount: input.totalAmount,
            paid_amount: 0,
            outstanding_amount: input.totalAmount, // Initially full amount
            status: 'active',
            created_by: user.id
        })
        .select()
        .single()

    if (masterError) {
        console.error('Master Invoice Creation Error:', masterError)
        return { message: 'Error creating master invoice: ' + masterError.message }
    }

    // 3. Create Phases (Child Invoices)
    const phasesPayload = input.phases.map((phase: any) => ({
        company_id: profile.company_id,
        customer_id: input.customerId,
        master_invoice_id: masterInvoice.id,

        invoice_number: phase.invoiceNumber,
        date: phase.date || input.startDate || new Date().toISOString().split('T')[0], // Phase invoice date
        due_date: phase.dueDate || null,

        status: 'draft', // Created as drafts

        // Totals
        subtotal: phase.subtotal || phase.amount,
        tax_total: phase.tax_total || 0,
        grand_total: phase.grand_total || phase.amount,

        phase_number: phase.number,
        phase_label: phase.label,

        customer_snapshot: customer,
        company_snapshot: company,
        created_by: user.id
    }))

    const { data: createdPhases, error: phasesError } = await (supabase.from('invoices') as any)
        .insert(phasesPayload)
        .select()

    if (phasesError) {
        console.error('Phase Creation Error:', phasesError)
        // Cleanup master?
        return { message: 'Error creating phase invoices: ' + phasesError.message }
    }

    // 4. Create Line Items for each Phase (Generic "Consulting Services" item if not provided)
    // For MVP, we add one generic line item matching the phase amount so PDF looks okay.
    // Fetch a generic item or just insert ad-hoc.

    if (createdPhases && createdPhases.length > 0) {
        const lineItemsPayload = createdPhases.map((phaseInv: any) => {
            // Find inputs for this phase
            const phaseInput = input.phases.find((p: any) => p.number === phaseInv.phase_number)
            const desc = phaseInput?.label || `Phase ${phaseInv.phase_number} Payment`

            return {
                invoice_id: phaseInv.id,
                description: desc,
                quantity: 1,
                unit_price: phaseInv.subtotal,
                tax_rate: 18, // Fixed 18% for IT Services as per requirement
                taxable_amount: phaseInv.subtotal,
                total_amount: phaseInv.grand_total,
                cgst_amount: phaseInv.tax_total / 2, // Split 50/50 for MVP (Intra-state assumption)
                sgst_amount: phaseInv.tax_total / 2,
                igst_amount: 0 // Ideally check state codes
            }
        })

        const { error: itemsError } = await (supabase.from('invoice_items') as any).insert(lineItemsPayload)
        if (itemsError) console.error('Error creating default line items for phases:', itemsError)
    }

    revalidatePath('/dashboard/invoices')
    return { message: 'success', masterInvoiceId: masterInvoice.id }
}

export async function updateMasterInvoice(id: string, prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const rawData = formData.get('data') as string
    if (!rawData) return { message: 'No data provided' }

    const input = JSON.parse(rawData)

    // 1. Fetch existing master & phases
    const { data: existingMaster } = await (supabase
        .from('master_invoices') as any)
        .select(`*, phases:invoices(*)`)
        .eq('id', id)
        .single()

    if (!existingMaster) return { message: 'Master Invoice not found' }

    // Check Company
    const { data: profile } = await (supabase.from('profiles') as any).select('company_id').eq('id', user.id).single()
    if (existingMaster.company_id !== profile?.company_id) return { message: 'Unauthorized' }

    // 2. Update Master Record
    const { error: masterError } = await (supabase.from('master_invoices') as any)
        .update({
            title: input.title,
            start_date: input.startDate || null,
            end_date: input.endDate || null,
            total_amount: input.totalAmount,
            customer_id: input.customerId
        })
        .eq('id', id)

    if (masterError) return { message: 'Error updating master invoice' }

    // 3. Handle Phases
    const existingPhases = existingMaster.phases || []

    // Deletion: Find database phases NOT in input
    // Only allow deleting if status is 'draft'
    const inputPhaseNumbers = new Set(input.phases.map((p: any) => p.number))
    const phasesToDelete = existingPhases.filter((ep: any) => !inputPhaseNumbers.has(ep.phase_number))

    for (const p of phasesToDelete) {
        if (p.status !== 'draft') {
            return { message: `Cannot delete Phase ${p.phase_number} because it is ${p.status}` }
        }
        await (supabase.from('invoices') as any).delete().eq('id', p.id)
    }

    // Upsert: Create or Update
    for (const p of input.phases) {
        const existing = existingPhases.find((ep: any) => ep.phase_number === p.number)

        // If exists and IS NOT DRAFT -> PROTECT IT
        // We only allow updating metadata like label if needed, but amounts should match if we want strictness.
        // For now, if it's finalized, we skip updating finalized phases entirely to be safe,
        // OR we only update benign fields. Let's just skip updating finalized phases to prevent data corruption.
        if (existing && existing.status !== 'draft') {
            // Optional: Check if user tried to change amount of finalized phase?
            // For this MVP, we just skip updating finalized phases entirely to be safe,
            // OR we only update benign fields. Let's just skip updating finalized phases to prevent data corruption.
            continue;
        }

        // Prepare payload for Drafts (New or Existing)
        const phasePayload = {
            company_id: existingMaster.company_id,
            customer_id: input.customerId, // ensure customer stays synced
            master_invoice_id: id,
            phase_number: p.number,
            phase_label: p.label,
            invoice_number: `${existingMaster.master_invoice_number}-P${p.number}`, // Ensure naming convention
            date: existingMaster.start_date, // Default to contract start? Or specific phase date?
            due_date: p.dueDate || null,
            subtotal: p.subtotal || p.amount,
            tax_total: p.tax_total || 0,
            grand_total: p.grand_total || p.amount,
            // If new, status is draft. If existing, it stays what it was (draft).
            status: existing ? existing.status : 'draft'
        }

        if (existing) {
            await (supabase.from('invoices') as any).update(phasePayload).eq('id', existing.id)
            // Ideally update line items too but skipping for MVP
        } else {
            const { data: newPhase } = await (supabase.from('invoices') as any).insert({
                ...phasePayload,
                created_by: user.id
            }).select().single()

            // Create default line item for new phase
            if (newPhase) {
                await (supabase.from('invoice_items') as any).insert({
                    invoice_id: newPhase.id,
                    description: p.label || `Phase ${p.number} Payment`,
                    quantity: 1,
                    unit_price: p.subtotal || p.amount,
                    tax_rate: 18,
                    taxable_amount: p.subtotal || p.amount,
                    total_amount: p.grand_total || p.amount,
                    cgst_amount: (p.tax_total || 0) / 2,
                    sgst_amount: (p.tax_total || 0) / 2,
                    igst_amount: 0
                })
            }
        }
    }

    revalidatePath('/dashboard/invoices')
    return { message: 'success', masterInvoiceId: id }
}
