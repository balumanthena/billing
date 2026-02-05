import { createClient } from '@/lib/supabase/server'
import RecurringRuleForm from '@/components/invoice/recurring-rule-form'

export default async function NewRecurringRulePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Auth required</div>

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single() as any
    const companyId = profile?.company_id

    // Fetch Parties
    const { data: parties } = await supabase
        .from('parties')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('type', 'customer')
        .order('name')

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12 p-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">New Recurring Rule</h1>
                <p className="text-muted-foreground">
                    Set up an automated schedule for creating invoices.
                </p>
            </div>

            <RecurringRuleForm
                companyId={companyId}
                parties={parties || []}
            />
        </div>
    )
}
