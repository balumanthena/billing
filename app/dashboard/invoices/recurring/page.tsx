import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import RecurringRulesList from '@/components/invoice/recurring-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function RecurringInvoicesPage() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user's company rules
    // Need company_id first
    let rules: any[] = []

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (profile?.company_id) {
            // @ts-ignore
            const { data } = await (supabase
                .from('recurring_rules')
                .select('*') as any) // Break the chain typing here
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })
            rules = (data as any[]) || []
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recurring Rules</h1>
                    <p className="text-muted-foreground mt-1">Automate your monthly billing cycle.</p>
                </div>
                <Link href="/dashboard/invoices/recurring/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Rule
                    </Button>
                </Link>
            </div>

            <RecurringRulesList rules={rules} />
        </div>
    )
}
