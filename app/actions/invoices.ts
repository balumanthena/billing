'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getInvoices() {
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
        .from('invoices') as any)
        .select('*, customer_snapshot')
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    return invoices || []
}

export async function createInvoice(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    // Parse raw form data (it's JSON stringified for complex structures or we use hidden inputs)
    // For complex forms, often easier to submit JSON as a single field
    const rawData = formData.get('data') as string
    if (!rawData) return { message: 'No data provided' }

    const input = JSON.parse(rawData)

    // Validation would go here (Zod)

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    // 1. Get Company Snapshot
    const { data: company } = await (supabase
        .from('companies') as any)
        .select('*')
        .eq('id', profile.company_id)
        .single()

    // 2. Get Party Snapshot
    const { data: party } = await (supabase
        .from('parties') as any)
        .select('*')
        .eq('id', input.customerId)
        .single()

    if (!party) return { message: 'Customer not found' }

    // 3. Create Invoice Record
    const { data: invoice, error: invoiceError } = await (supabase.from('invoices') as any)
        .insert({
            company_id: profile.company_id,
            customer_id: input.customerId,
            invoice_number: input.invoiceNumber,
            date: input.date,
            due_date: input.dueDate,
            status: 'draft',
            subtotal: input.totals.subtotal,
            tax_total: input.totals.totalCGST + input.totals.totalSGST + input.totals.totalIGST,
            grand_total: input.totals.grandTotal,
            customer_snapshot: party,
            company_snapshot: company,
            created_by: user.id
        })
        .select()
        .single()

    if (invoiceError) {
        console.error(invoiceError)
        return { message: 'Error creating invoice: ' + invoiceError.message }
    }

    // 4. Create Invoice Items
    const itemsPayload = input.lineItems.map((item: any) => ({
        invoice_id: invoice.id,
        item_id: item.item_id,
        description: item.description,
        sac_code: item.sac_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        taxable_amount: item.taxable,
        cgst_amount: item.cgst,
        sgst_amount: item.sgst,
        igst_amount: item.igst,
        total_amount: item.total
    }))

    const { error: itemsError } = await (supabase.from('invoice_items') as any)
        .insert(itemsPayload)

    if (itemsError) {
        // Rollback typically? For MVP we just report error.
        console.error(itemsError)
        return { message: 'Error creating line items' }
    }

    revalidatePath('/dashboard/invoices')
    return { message: 'success', invoiceId: invoice.id }
}

export async function getNextInvoiceNumber() {
    // Generate auto-increment invoice number
    // Format: INV/YYYY/001
    // MVP: Simple count + 1 or max + 1
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'INV-001'

    // Get company ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return 'INV-001'

    const { data: invoices } = await (supabase.from('invoices') as any)
        .select('invoice_number')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)

    if (invoices && invoices.length > 0) {
        const lastNum = invoices[0].invoice_number
        // Try to parse number
        const parts = lastNum.split('-')
        const num = parseInt(parts[parts.length - 1])
        if (!isNaN(num)) {
            return `INV-${String(num + 1).padStart(3, '0')}`
        }
    }

    return 'INV-001'
}

export async function getInvoice(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch invoice with items
    const { data: invoice } = await (supabase
        .from('invoices') as any)
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single()

    return invoice
}

export async function finalizeInvoice(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    // Check ownership & status
    const { data: invoice } = await (supabase.from('invoices') as any).select('status, company_id').eq('id', id).single()
    if (!invoice) return { message: 'Invoice not found' }

    // Verify company
    const { data: profile } = await (supabase.from('profiles') as any).select('company_id').eq('id', user.id).single()
    if (invoice.company_id !== profile?.company_id) return { message: 'Unauthorized' }

    if (invoice.status !== 'draft') return { message: 'Invoice is already finalized or cancelled' }

    const { error } = await (supabase.from('invoices') as any)
        .update({ status: 'finalized' })
        .eq('id', id)

    if (error) return { message: 'Error finalizing invoice' }

    revalidatePath(`/dashboard/invoices/${id}`)
    revalidatePath('/dashboard/invoices')
    return { message: 'success' }
}

export async function cancelInvoice(id: string, reason: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    if (!reason || reason.trim().length < 5) return { message: 'Reason is required (min 5 chars)' }

    // Check ownership
    const { data: invoice } = await (supabase.from('invoices') as any).select('status, company_id').eq('id', id).single()
    if (!invoice) return { message: 'Invoice not found' }

    const { data: profile } = await (supabase.from('profiles') as any).select('company_id').eq('id', user.id).single()
    if (invoice.company_id !== profile?.company_id) return { message: 'Unauthorized' }

    // Allow cancelling 'draft' or 'finalized'
    // Cannot cancel already 'cancelled'
    if (invoice.status === 'cancelled') return { message: 'Invoice is already cancelled' }

    const { error } = await (supabase.from('invoices') as any)
        .update({
            status: 'cancelled',
            cancel_reason: reason
        })
        .eq('id', id)

    if (error) return { message: 'Error cancelling invoice' }

    revalidatePath(`/dashboard/invoices/${id}`)
    revalidatePath('/dashboard/invoices')
    return { message: 'success' }
}

export async function deleteInvoice(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: invoice } = await (supabase.from('invoices') as any).select('status, company_id').eq('id', id).single()
    if (!invoice) return { message: 'Invoice not found' }

    const { data: profile } = await (supabase.from('profiles') as any).select('company_id').eq('id', user.id).single()
    if (invoice.company_id !== profile?.company_id) return { message: 'Unauthorized' }

    // STRICT VALIDATION: Only Draft can be deleted
    // Soft delete is preferred, but user task just says "Lock Finalized".
    // If we use soft delete, we set is_deleted=true.
    // Let's use is_deleted as per previous phase 4 instructions (audit_and_migrate.sql added it).

    if (invoice.status !== 'draft') return { message: 'Only Draft invoices can be deleted. Please cancel finalized invoices.' }

    // Check if is_deleted column exists or if we should just DELETE?
    // The audit_and_migrate.sql script added is_deleted.
    // So we should soft delete.

    const { error } = await (supabase.from('invoices') as any)
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) return { message: 'Error deleting invoice' }

    revalidatePath('/dashboard/invoices')
    return { message: 'success' }
}
