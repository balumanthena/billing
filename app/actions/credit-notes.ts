'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getCreditNotes(invoiceId?: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    let query = (supabase
        .from('credit_notes') as any)
        .select('*, invoice:invoices(invoice_number)')
        .eq('company_id', profile.company_id)
        .order('date', { ascending: false })

    if (invoiceId) {
        query = query.eq('invoice_id', invoiceId)
    }

    const { data: cns } = await query
    return cns || []
}

export async function createCreditNote(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const rawData = formData.get('data') as string
    if (!rawData) return { message: 'No data provided' }

    const input = JSON.parse(rawData)
    // input = { invoiceId, date, reason, items: [{description, amount, tax_rate...}] }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    // 1. Generate CN Number (Simple auto-increment)
    const { data: existingCNs } = await (supabase.from('credit_notes') as any)
        .select('cn_number')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)

    let nextNum = 'CN-001'
    if (existingCNs && existingCNs.length > 0) {
        const lastNum = existingCNs[0].cn_number
        const parts = lastNum.split('-')
        const num = parseInt(parts[parts.length - 1])
        if (!isNaN(num)) {
            nextNum = `CN-${String(num + 1).padStart(3, '0')}`
        }
    }

    // 2. Compute Totals
    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0

    // We assume input items already have calculated tax split if possible, 
    // OR we recalculate here for safety. Let's recalculate based on rate.
    // Determining if Inter-state or Intra-state:
    // We need the Original Invoice to check state match? 
    // Or we just trust the inputs? 
    // SAFEST: Fetch original invoice => Get Customer Snapshot => Compare State.

    const { data: invoice } = await (supabase.from('invoices') as any)
        .select('company_snapshot, customer_snapshot')
        .eq('id', input.invoiceId)
        .single()

    if (!invoice) return { message: 'Original Invoice not found' }

    const companyState = invoice.company_snapshot.state_code
    const customerState = invoice.customer_snapshot.state_code
    const isInterState = companyState !== customerState

    const itemsPayload = input.items.map((item: any) => {
        const taxable = parseFloat(item.taxableAmount)
        const rate = parseFloat(item.taxRate)
        const taxAmount = taxable * (rate / 100)

        let cgst = 0, sgst = 0, igst = 0
        if (isInterState) {
            igst = taxAmount
        } else {
            cgst = taxAmount / 2
            sgst = taxAmount / 2
        }

        const total = taxable + taxAmount

        subtotal += taxable
        totalCGST += cgst
        totalSGST += sgst
        totalIGST += igst

        return {
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || taxable, // If lump sum, unit price = taxable
            tax_rate: rate,
            taxable_amount: taxable,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            total_amount: total
        }
    })

    const grandTotal = subtotal + totalCGST + totalSGST + totalIGST

    // 3. Insert Header
    const { data: cn, error: cnError } = await (supabase.from('credit_notes') as any)
        .insert({
            company_id: profile.company_id,
            invoice_id: input.invoiceId,
            cn_number: nextNum,
            date: input.date,
            reason: input.reason,
            subtotal,
            tax_total: totalCGST + totalSGST + totalIGST,
            grand_total: grandTotal,
            // Copy snapshots from original invoice for consistency
            company_snapshot: invoice.company_snapshot,
            customer_snapshot: invoice.customer_snapshot,
            created_by: user.id
        })
        .select()
        .single()

    if (cnError) {
        return { message: 'Failed to create Note: ' + cnError.message }
    }

    // 4. Insert Items
    const finalItems = itemsPayload.map((i: any) => ({ ...i, credit_note_id: cn.id }))
    const { error: itemsError } = await (supabase.from('credit_note_items') as any)
        .insert(finalItems)

    if (itemsError) {
        // In real app, delete header to rollback
        return { message: 'Created header but failed items: ' + itemsError.message }
    }

    revalidatePath(`/dashboard/invoices/${input.invoiceId}`)
    return { message: 'success', id: cn.id }
}
