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

export async function getNextMasterInvoiceNumber() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'INV-001'

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return 'INV-001'

    // Get latest master invoice
    const { data: lastMaster } = await (supabase
        .from('master_invoices') as any)
        .select('master_invoice_number')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!lastMaster) return 'INV-001'

    // Extract number and increment, assuming format INV-XXX
    const lastNum = parseInt(lastMaster.master_invoice_number.replace('INV-', '')) || 0
    return `INV-${String(lastNum + 1).padStart(3, '0')}`
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
            sac_code: input.sacCode || null,
            start_date: input.startDate || null,
            end_date: input.endDate || null,
            total_amount: input.totalAmount,
            paid_amount: 0,
            outstanding_amount: input.totalAmount, // Initially full amount
            status: 'active',
            created_by: user.id,
            is_tax_inclusive: input.isTaxInclusive || false
        })
        .select()
        .single()

    if (masterError) {
        console.error('Master Invoice Creation Error:', masterError)
        return { message: 'Error creating master invoice: ' + masterError.message }
    }

    // 3. Create Phases (Child Invoices)
    // Helper logic for totals
    const getTotals = (p: any) => {
        const s = p.subtotal || p.amount || 0;
        let t = p.tax_total || 0;
        let g = p.grand_total || 0;
        if (t === 0 && s > 0) t = s * 0.18;
        if (g === 0) g = s + t;
        return { s, t, g };
    }

    const phasesPayload = input.phases.map((phase: any) => {
        const { s, t, g } = getTotals(phase);
        return {
            company_id: profile.company_id,
            customer_id: input.customerId,
            master_invoice_id: masterInvoice.id,

            invoice_number: `${masterInvoice.master_invoice_number}-P${phase.number}`,
            date: phase.date || input.startDate || new Date().toISOString().split('T')[0],
            due_date: phase.dueDate || null,
            status: 'draft',

            subtotal: s,
            tax_total: t,
            grand_total: g,

            phase_number: phase.number,
            phase_label: phase.label,

            customer_snapshot: customer,
            company_snapshot: company,
            created_by: user.id
        }
    })

    const { data: createdPhases, error: phasesError } = await (supabase.from('invoices') as any)
        .insert(phasesPayload)
        .select()

    if (phasesError) {
        console.error('Phase Creation Error:', phasesError)
        return { message: 'Error creating phase invoices: ' + phasesError.message }
    }

    if (createdPhases && createdPhases.length > 0) {
        const lineItemsPayload = createdPhases.map((phaseInv: any) => {
            const phaseInput = input.phases.find((p: any) => p.number === phaseInv.phase_number)
            // Combined Description: "{Service Name} - {Phase Label}"
            const desc = `${input.title} - ${phaseInput?.label || `Phase ${phaseInv.phase_number}`}`

            // Re-calculate to match above (or use saved values)
            // phaseInv has the correct totals now.
            return {
                invoice_id: phaseInv.id,
                description: desc,
                sac_code: input.sacCode || null, // Inherit SAC from Master
                quantity: 1,
                unit_price: phaseInv.subtotal,
                tax_rate: 18,
                taxable_amount: phaseInv.subtotal,
                total_amount: phaseInv.grand_total,
                cgst_amount: phaseInv.tax_total / 2,
                sgst_amount: phaseInv.tax_total / 2,
                igst_amount: 0
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
            customer_id: input.customerId,
            is_tax_inclusive: input.isTaxInclusive || false
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

    // Helper to calculate totals
    const calculatePhaseTotals = (p: any) => {
        const subtotal = p.subtotal || p.amount || 0
        let tax_total = p.tax_total || 0
        let grand_total = p.grand_total || 0

        // Auto-calculate 18% Tax if missing
        if (tax_total === 0 && subtotal > 0) {
            tax_total = subtotal * 0.18
            grand_total = subtotal + tax_total
        } else if (grand_total === 0) {
            grand_total = subtotal + tax_total
        }

        return { subtotal, tax_total, grand_total }
    }

    // Upsert: Create or Update
    for (const p of input.phases) {
        const existing = existingPhases.find((ep: any) => ep.phase_number === p.number)

        // If exists and IS NOT DRAFT -> PROTECT IT
        // We only allow updating metadata like label if needed.
        if (existing && existing.status !== 'draft') {
            continue;
        }

        const totals = calculatePhaseTotals(p)

        // Prepare payload for Drafts (New or Existing)
        const phasePayload = {
            company_id: existingMaster.company_id,
            customer_id: input.customerId, // ensure customer stays synced
            master_invoice_id: id,
            phase_number: p.number,
            phase_label: p.label,
            invoice_number: `${existingMaster.master_invoice_number}-P${p.number}`,
            date: existingMaster.start_date,
            due_date: p.dueDate || null,
            subtotal: totals.subtotal,
            tax_total: totals.tax_total,
            grand_total: totals.grand_total,
            status: existing ? existing.status : 'draft'
        }

        let phaseId = existing?.id

        if (existing) {
            // Update Phase Invoice
            await (supabase.from('invoices') as any).update(phasePayload).eq('id', existing.id)
            phaseId = existing.id

            // Delete existing line items to recreate them (Ensure tax update)
            await (supabase.from('invoice_items') as any).delete().eq('invoice_id', existing.id)

        } else {
            // Create New Phase Invoice
            const { data: newPhase } = await (supabase.from('invoices') as any).insert({
                ...phasePayload,
                created_by: user.id
            }).select().single()

            phaseId = newPhase?.id
        }

        // Create Line Item
        if (phaseId) {
            await (supabase.from('invoice_items') as any).insert({
                invoice_id: phaseId,
                description: p.label || `Phase ${p.number} Payment`,
                quantity: 1,
                unit_price: totals.subtotal,
                tax_rate: 18,
                taxable_amount: totals.subtotal,
                total_amount: totals.grand_total,
                cgst_amount: totals.tax_total / 2,
                sgst_amount: totals.tax_total / 2,
                igst_amount: 0
            })
        }
    }

    revalidatePath('/dashboard/invoices')
    return { message: 'success', masterInvoiceId: id }
}


