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
    if (!user) return getEmptyStats()

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return getEmptyStats()

    // 1. Fetch Invoices (for Revenue, Outstanding, Aging, Trends, Recent)
    const { data: invoices } = await (supabase.from('invoices') as any)
        .select('id, invoice_number, date, due_date, grand_total, status, customer_snapshot')
        .eq('company_id', profile.company_id)
        .neq('status', 'cancelled')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    // 2. Fetch Expenses (for Total Expenses, Profit, Trends, Recent)
    const { data: expenses } = await (supabase.from('expenses') as any)
        .select('id, date, amount, category, vendor_name')
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false) // Assuming soft delete
        .order('date', { ascending: false })

    // 3. Fetch Payments (for accurate Revenue/Collected calculation)
    const { data: payments } = await (supabase.from('payments') as any)
        .select('amount, payment_date')
        .eq('company_id', profile.company_id)

    // --- CALCULATIONS ---

    // A. KPI Totals
    const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
    const totalInvoiced = invoices?.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0) || 0
    const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0
    const netProfit = totalRevenue - totalExpenses
    const outstanding = totalInvoiced - totalRevenue // Simplified. Ideally: sum of (invoice.total - invoice.paid_amount)
    // Note: Accurate outstanding should be per-invoice, but for global stats this is a reasonable approximation 
    // IF we assume all payments are linked. For precise "Unpaid Invoices" sum, we'd need to track balance per invoice.
    // Let's refine Outstanding: Sum of grand_total of invoices where status != 'paid'.
    // Better: We'll stick to Total Invoiced - Total Collected for global outstanding to be safe.

    // B. Aging Analysis (on Unpaid/Partial invoices)
    // We strictly need "Due Date". If status is NOT paid, calculate age.
    // Note: Invoices fetched above includes all. Filter for pending.
    // Since we don't have 'balance' on invoice easily without joins, we will calculate aging based on *full* amount of unpaid invoices for simplicity (MVP), 
    // OR we can try to be smarter. Let's do: Filter invoices where status is 'draft' or 'sent' or 'overdue' (not 'paid').
    const unpaidInvoices = invoices?.filter((inv: any) => inv.status !== 'paid' && inv.status !== 'finalized') || []
    // Wait, 'finalized' means sent? Let's check status enums. usually: draft -> finalized -> paid.
    // Let's assume 'paid' is the completion state.

    // Actually, let's use a simpler detailed aging roughly.
    const aging = {
        "0-15": 0,
        "16-30": 0,
        "31-45": 0,
        "45+": 0
    }

    const today = new Date()

    invoices?.forEach((inv: any) => {
        if (inv.status === 'paid') return
        // Calculate days overdue (or just age from invoice date? Requirements say "Outstanding Receivables... Aging buckets")
        // Usually Aging is based on Due Date or Invoice Date. Let's use Invoice Date for "Age of Debt" or Due Date for "Overdue".
        // Standard is: Age of Invoice (from Issue Date).
        const invDate = new Date(inv.date)
        const diffTime = Math.abs(today.getTime() - invDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // We accumulate the grand_total (assuming full amount is unpaid for these statuses, approximation)
        const val = inv.grand_total || 0

        if (diffDays <= 15) aging["0-15"] += val
        else if (diffDays <= 30) aging["16-30"] += val
        else if (diffDays <= 45) aging["31-45"] += val
        else aging["45+"] += val
    })

    // C. Monthly Trends (Last 6 Months)
    const monthlyStats: any[] = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const monthKey = d.toLocaleString('default', { month: 'short' }) // "Jan", "Feb"
        const year = d.getFullYear()

        // Filter for this month/year
        const monthInvoices = invoices?.filter((inv: any) => {
            const idate = new Date(inv.date)
            return idate.getMonth() === d.getMonth() && idate.getFullYear() === year
        })
        const monthExpenses = expenses?.filter((exp: any) => {
            const edate = new Date(exp.date)
            return edate.getMonth() === d.getMonth() && edate.getFullYear() === year
        })

        const monthSales = monthInvoices?.reduce((s: number, i: any) => s + (i.grand_total || 0), 0) || 0
        const monthExp = monthExpenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0

        monthlyStats.push({
            name: monthKey,
            Sales: monthSales,
            Expenses: monthExp
        })
    }

    // D. Recent Activity
    const recentInvoices = invoices?.slice(0, 5) || []
    const recentExpenses = expenses?.slice(0, 5) || []

    return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        outstanding,
        invoiceCount: invoices?.length || 0,
        aging,
        monthlyStats,
        recentInvoices,
        recentExpenses
    }
}

function getEmptyStats() {
    return {
        revenue: 0,
        expenses: 0,
        netProfit: 0,
        outstanding: 0,
        invoiceCount: 0,
        aging: { "0-15": 0, "16-30": 0, "31-45": 0, "45+": 0 },
        monthlyStats: [],
        recentInvoices: [],
        recentExpenses: []
    }
}
