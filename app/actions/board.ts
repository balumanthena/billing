'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export async function getBoardMetrics() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single() as any
    if (!profile?.company_id) return null

    const companyId = profile.company_id

    // 1. TCV (Total Contract Value) & Revenue Quality
    const { data: contracts } = await (supabase.from('master_invoices') as any)
        .select('total_amount, contract_type, status')
        .eq('company_id', companyId)
        .neq('status', 'cancelled')
        .eq('is_deleted', false)

    // TCV is sum of all active/completed contracts
    const tcv = contracts?.reduce((sum: number, c: any) => sum + (c.total_amount || 0), 0) || 0

    // Revenue Quality (Mix)
    const revenueMix = {
        retainer: 0,
        project: 0,
        amc: 0,
        milestone: 0
    }
    contracts?.forEach((c: any) => {
        const type = (c.contract_type || 'project') as keyof typeof revenueMix
        if (revenueMix[type] !== undefined) {
            revenueMix[type] += c.total_amount || 0
        }
    })

    // 2. DSO (Days Sales Outstanding) & Collection Speed
    // Fetch all PAID invoices to calculate average time to collect
    const { data: paidInvoices } = await (supabase.from('invoices') as any)
        .select(`
            id, date, grand_total,
            payments (payment_date, amount)
        `)
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .limit(100)
        .order('date', { ascending: false })

    let totalDays = 0
    let count = 0

    paidInvoices?.forEach((inv: any) => {
        if (inv.payments && inv.payments.length > 0) {
            // Find last payment date (fully paid date)
            const lastPay = inv.payments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
            const invDate = new Date(inv.date).getTime()
            const payDate = new Date(lastPay.payment_date).getTime()
            const diffDays = Math.ceil((payDate - invDate) / (1000 * 60 * 60 * 24))

            if (diffDays >= 0) {
                totalDays += diffDays
                count++
            }
        }
    })

    const avgCollectionDays = count > 0 ? Math.round(totalDays / count) : 0

    // 3. Runway
    // Need Cash In Hand (Current) / Avg Monthly Burn
    // We reuse logic or fetch simplified expenses
    const { data: expenses } = await (supabase.from('expenses') as any)
        .select('amount, date')
        .eq('company_id', companyId)
        .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()) // Last 3 months

    const totalBurn3Mo = expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0
    const avgMonthlyBurn = totalBurn3Mo / 3

    // Get current Cash (Approx: Total Collected - Total Expenses ALL TIME is hard, let's use a simpler heuristic or the one from stats)
    // For Runway, let's just use "Cash Balance" if we had a ledger. 
    // Since we don't track "Opening Balance", we will estimate: 
    // Runway = (Total Collected YTD - Total Exp YTD) / Avg Burn. 
    // *Caveat*: This assumes starting 0. Ideally, User inputs "Current Bank Balance".
    // For now, return the BURN RATE.

    // 4. Concentration Risk
    const { data: invoiceConcentration } = await (supabase.from('invoices') as any)
        .select('grand_total, customer_snapshot')
        .eq('company_id', companyId)
        .neq('status', 'cancelled')
        .eq('is_deleted', false)

    const clientRevenue: Record<string, number> = {}
    let totalRevenue = 0
    invoiceConcentration?.forEach((inv: any) => {
        const name = inv.customer_snapshot?.name || 'Unknown'
        clientRevenue[name] = (clientRevenue[name] || 0) + (inv.grand_total || 0)
        totalRevenue += (inv.grand_total || 0)
    })

    const topClients = Object.entries(clientRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : "0.0"
        }))

    return {
        tcv,
        revenueMix,
        dso: avgCollectionDays,
        burnRate: avgMonthlyBurn,
        topClients,
        totalRevenue
    }
}
