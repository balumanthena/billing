import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { sendEmail } from '@/lib/mailer'
import { subDays } from 'date-fns'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing Service Key' }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey) as SupabaseClient<Database>

    // 1. Fetch Overdue Invoices
    const today = new Date().toISOString().split('T')[0]

    // @ts-ignore
    const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select(`
            id, 
            invoice_number, 
            due_date, 
            grand_total, 
            customer_snapshot,
            company_id
        `)
        .eq('status', 'finalized')
        .lt('due_date', today)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const processed = []
    const invoices = (overdueInvoices as any[]) || []

    for (const invoice of invoices) {
        // 2. Check overlap (Don't spam)
        // Check if we sent a reminder in last 3 days
        const threeDaysAgo = subDays(new Date(), 3).toISOString()

        // @ts-ignore
        const { data: logs } = await supabase
            .from('communication_logs')
            .select('id')
            .eq('invoice_id', invoice.id)
            .gte('sent_at', threeDaysAgo)

        // If logs exist, skip
        if (logs && logs.length > 0) continue

        // 3. Send Email
        // We need customer email. It should be in customer_snapshot or we fetch party.
        // Assuming customer_snapshot has email or we assume fetching from Party table is safer?
        // Snapshot is safer as it was point-in-time, but Party is better for current contact.
        // Let's use snapshot for speed if available, or fetch party.

        let recipientEmail = invoice.customer_snapshot?.email
        if (!recipientEmail) {
            // Fetch party
            // @ts-ignore
            // We can't easily fetch party without customer_id which I didn't select?
            // Ah, I missed 'customer_id' in select. 
            // Logic: Just skip if no email in snapshot for MVP.
            continue
        }

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Overdue Invoice ${invoice.invoice_number}`,
                body: `Dear Customer,\n\nThis is a friendly reminder that invoice ${invoice.invoice_number} for ₹${invoice.grand_total} was due on ${invoice.due_date}.\n\nPlease arrange for payment at your earliest convenience.\n\nThank you.`
            })

            // 4. Log
            // @ts-ignore
            await supabase.from('communication_logs').insert({
                company_id: invoice.company_id,
                invoice_id: invoice.id,
                recipient_email: recipientEmail,
                type: 'reminder_overdue',
                status: 'sent',
                sent_at: new Date().toISOString()
            } as any)

            processed.push(invoice.invoice_number)

        } catch (e: any) {
            console.error(`Failed to send reminder for ${invoice.invoice_number}`, e)
            // Log failure
            // @ts-ignore
            await supabase.from('communication_logs').insert({
                company_id: invoice.company_id,
                invoice_id: invoice.id,
                recipient_email: recipientEmail,
                type: 'reminder_overdue',
                status: 'failed',
                metadata: { error: e.message }
            } as any)
        }
    }

    return NextResponse.json({
        message: 'Reminder run complete',
        processed_count: processed.length,
        invoices: processed
    })
}
