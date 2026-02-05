import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client' // API Routes use Client or Server? API routes are server.
import { createClient as createServerClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { calculateNextRun } from '@/lib/cron-utils'

// We need SERVICE_ROLE access to run Cron Jobs without a user session
// Assuming process.env.SUPABASE_SERVICE_ROLE_KEY is set.
// If not, we might be limited. We will check env. 

export async function GET(req: NextRequest) {
    // 1. Auth Check (Cron Secret)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow local dev bypass if needed or strictly enforce
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Server configuration error: Missing Service Key' }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey) as SupabaseClient<Database>

    // 2. Fetch Due Rules
    const now = new Date().toISOString()
    const { data: rules, error: fetchError } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('status', 'active')
        .lte('next_run_at', now)

    const activeRules = rules as any[] || []

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (activeRules.length === 0) {
        return NextResponse.json({ message: 'No rules due for execution', count: 0 })
    }

    const results = []

    // 3. Process Rules
    for (const rule of activeRules) {
        try {
            // A. Create Draft Invoice
            // We need to parse snapshot data
            // Assuming rule.items_snapshot is array of Check `created_invoice` schema

            // Get Invoice Number (Simplified logic here or call a DB function? 
            // Better to let DB handle it or fetch next. 
            // We'll insert and assume Trigger handles number generation if strictly implemented, 
            // BUT our `createInvoice` action Logic did it manually. 
            // Let's fetch next number.

            // Fetch next number logic (Inline for speed)
            const { data: latestInvData } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('company_id', rule.company_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const latestInv = latestInvData as any

            // Basic increment logic
            let nextNum = 'INV-AUTO-001'
            if (latestInv?.invoice_number) {
                const parts = latestInv.invoice_number.split('-')
                const n = parseInt(parts[parts.length - 1])
                if (!isNaN(n)) nextNum = `INV-AUTO-${String(n + 1).padStart(3, '0')}` // Simple pattern
            }

            // Create Invoice
            // Create Invoice
            const { data: newInvData, error: insertError } = await supabase
                .from('invoices')
                .insert({
                    company_id: rule.company_id,
                    customer_id: rule.customer_id,
                    invoice_number: nextNum, // Or use DB trigger if available
                    date: new Date().toISOString().split('T')[0], // Today
                    due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Default +7 days? Should be in rule? MVP: +7
                    status: 'draft', // SAFETY FIRST
                    tax_mode: rule.tax_mode || 'exclusive',
                    grand_total: rule.amount,
                    created_by: rule.created_by
                } as any)
                .select()
                .single()

            if (insertError) throw new Error(insertError.message)
            const newInvoice = (newInvData || {}) as any

            // B. Add Line Items
            const items = (rule.items_snapshot as any[]) || []
            if (items.length > 0) {
                const newItems = items.map((item: any) => ({
                    invoice_id: newInvoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_amount: item.total_amount,
                    // Map other fields
                }))
                // @ts-ignore
                await supabase.from('invoice_items').insert(newItems as any)
            }

            // C. Update Rule (Next Run)
            const nextRun = calculateNextRun(rule.cron_expression, new Date(rule.next_run_at))

            const q = supabase.from('recurring_rules')
            // @ts-ignore
            await q.update({
                last_run_at: new Date().toISOString(),
                next_run_at: nextRun.toISOString()
            } as any)
                .eq('id', rule.id)

            // D. Log
            results.push({ ruleId: rule.id, invoiceId: newInvoice.id, status: 'success' })

        } catch (e: any) {
            console.error(`Rule ${rule.id} failed:`, e)
            results.push({ ruleId: rule.id, error: e.message, status: 'failed' })
        }
    }

    return NextResponse.json({
        message: 'Recurring generation complete',
        processed: results.length,
        results
    })
}
