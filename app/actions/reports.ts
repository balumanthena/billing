'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getProfitAndLoss(startDate?: string, endDate?: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return null

    // Default to current month if no dates
    // Logic: Sum Invoice Subtotals (Revenue) - Sum Expense Amounts
    // Note: We use 'subtotal' (taxable value) for Revenue typically, 
    // but if user wants cash flow, we use grand_total. 
    // Let's use grand_total for this MVP as it matches "Cash In / Cash Out" for small biz better usually
    // UNLESS they are GST registered, then Taxable is better. 
    // Let's stick to Grand Total for now for simplicity of "Earnings", 
    // or maybe return both. Let's return a simple structure.

    let invoiceQuery = (supabase.from('invoices') as any)
        .select('grand_total, subtotal, date')
        .eq('company_id', profile.company_id)
        .neq('status', 'cancelled')

    let expenseQuery = (supabase.from('expenses') as any)
        .select('amount, date, category')
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false)

    if (startDate && endDate) {
        invoiceQuery = invoiceQuery.gte('date', startDate).lte('date', endDate)
        expenseQuery = expenseQuery.gte('date', startDate).lte('date', endDate)
    }

    const [{ data: invoices }, { data: expenses }] = await Promise.all([
        invoiceQuery,
        expenseQuery
    ])

    const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0) || 0
    const totalTaxable = invoices?.reduce((sum: number, inv: any) => sum + (inv.subtotal || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    const netProfit = totalRevenue - totalExpenses

    // Category breakdown
    const expenseBreakdown: Record<string, number> = {}
    expenses?.forEach((exp: any) => {
        const cat = exp.category || 'Uncategorized'
        expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (exp.amount || 0)
    })

    return {
        revenue: totalRevenue,
        taxable_revenue: totalTaxable,
        expenses: totalExpenses,
        net_profit: netProfit,
        expense_breakdown: expenseBreakdown,
        invoice_count: invoices?.length || 0,
        expense_count: expenses?.length || 0
    }
}

export async function getOutstanding() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    // Fetch all finalized invoices
    const { data: invoices } = await (supabase.from('invoices') as any)
        .select('*, customer_snapshot')
        .eq('company_id', profile.company_id)
        .eq('status', 'finalized')
        .order('due_date', { ascending: true })

    // Fetch all payments
    const { data: payments } = await (supabase.from('payments') as any)
        .select('invoice_id, amount')
        .eq('company_id', profile.company_id)

    if (!invoices) return []

    // Map payments to invoices
    const invoiceMap = invoices.map((inv: any) => {
        const paid = payments
            ?.filter((p: any) => p.invoice_id === inv.id)
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

        const pending = (inv.grand_total || 0) - paid

        // Calculate days overdue
        const dueDate = new Date(inv.due_date || inv.date)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - dueDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        // If today < dueDate, it's not overdue, but aging usually counts from Invoice Date.
        // Let's assume aging from Due Date for strict collection or Invoice Date?
        // Standard is typically from Invoice Date.
        // Let's use Invoice Date for "Aging Bucket" but Due Date for "Overdue" status if needed.
        // Actually MVP Reuqest says "Invoice aging (0-30...)"

        const invoiceDate = new Date(inv.date)
        const ageTime = Math.abs(today.getTime() - invoiceDate.getTime())
        const ageDays = Math.ceil(ageTime / (1000 * 60 * 60 * 24))

        return {
            ...inv,
            paid_amount: paid,
            pending_amount: pending,
            age_days: ageDays,
            customer_name: inv.customer_snapshot?.name || 'Unknown'
        }
    })

    // Filter only those with pending amount > 0 (or close to 0 allowing for float errors)
    return invoiceMap.filter((inv: any) => inv.pending_amount > 1)
}

export async function getSalesRegister(startDate?: string, endDate?: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    // Fetch invoices with items to calculate tax breakup
    let query = supabase
        .from('invoices')
        .select(`
            *,
            invoice_items (
                cgst_amount,
                sgst_amount,
                igst_amount,
                taxable_amount,
                total_amount
            )
        `)
        .eq('company_id', profile.company_id)
        .neq('status', 'cancelled')
        .order('date', { ascending: false })

    if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: invoices } = await (query as any)

    if (!invoices) return []

    // Process invoices to flatten structure for the register
    return invoices.map((inv: any) => {
        const items = inv.invoice_items || []
        const cgst = items.reduce((sum: number, item: any) => sum + (item.cgst_amount || 0), 0)
        const sgst = items.reduce((sum: number, item: any) => sum + (item.sgst_amount || 0), 0)
        const igst = items.reduce((sum: number, item: any) => sum + (item.igst_amount || 0), 0)

        return {
            id: inv.id,
            date: inv.date,
            invoice_number: inv.invoice_number,
            customer_name: inv.customer_snapshot?.name || 'Unknown',
            gstin: inv.customer_snapshot?.gstin || 'N/A',
            taxable_amount: inv.subtotal,
            cgst,
            sgst,
            igst,
            total_tax: inv.tax_total,
            grand_total: inv.grand_total,
            status: inv.status
        }
    })
}

export async function getGSTSummary(startDate?: string, endDate?: string) {
    // 1. Get Sales Tax (Output Tax)
    const sales = await getSalesRegister(startDate, endDate)

    // Aggregate Sales Tax
    const outputTax = sales.reduce((acc: any, inv: any) => ({
        taxable: acc.taxable + inv.taxable_amount,
        cgst: acc.cgst + inv.cgst,
        sgst: acc.sgst + inv.sgst,
        igst: acc.igst + inv.igst,
        total: acc.total + inv.total_tax
    }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 })

    // 2. Get Purchase Tax (Input Tax) from Expenses
    // Note: In Phase 2, expenses only have a flat 'gst_amount'
    // We will assume Input Tax credit is available for all GST expenses for MVP.
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    let expenseQuery = supabase.from('expenses')
        .select('amount, gst_amount')
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false)
        .gt('gst_amount', 0)

    if (startDate && endDate) {
        expenseQuery = expenseQuery.gte('date', startDate).lte('date', endDate)
    }

    const { data: expenses } = await (expenseQuery as any)

    const inputTax = expenses?.reduce((acc: any, exp: any) => ({
        taxable: acc.taxable + (exp.amount - exp.gst_amount),
        total_gst: acc.total_gst + exp.gst_amount
    }), { taxable: 0, total_gst: 0 }) || { taxable: 0, total_gst: 0 }

    return {
        start_date: startDate,
        end_date: endDate,
        output: outputTax,
        input: inputTax,
        net_payable: outputTax.total - inputTax.total_gst
    }
}
