import { getNextInvoiceNumber } from '@/app/actions/invoices'
import { getParties } from '@/app/actions/parties'
import { getItems } from '@/app/actions/items'
import { getCompany } from '@/app/actions/company'
import CreateInvoiceForm from '@/components/invoice/create-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export default async function NewInvoicePage() {
    const [parties, items, nextNum, company] = await Promise.all([
        getParties(),
        getItems(),
        getNextInvoiceNumber(),
        getCompany()
    ])

    // Diagnostic Check if company is missing
    if (!company) {
        const supabase = (await createClient()) as SupabaseClient<Database>
        const { data: { user } } = await supabase.auth.getUser()

        let profile: any = null
        let profileError = null
        let companyCheck = null
        let companyError = null

        if (user) {
            const p = await supabase.from('profiles').select('*').eq('id', user.id)
            profile = p.data?.[0]
            profileError = p.error

            if (profile?.company_id) {
                const c = await supabase.from('companies').select('*').eq('id', profile.company_id)
                companyCheck = c.data?.[0]
                companyError = c.error
            }
        }

        return (
            <Alert variant="destructive">
                <AlertDescription>
                    <p className="font-bold mb-2">Diagnostic Report (Share this with support):</p>
                    <div className="text-xs mt-2 p-2 bg-slate-950 text-green-400 rounded font-mono whitespace-pre-wrap overflow-auto max-h-96">
                        Auth User: {user ? user.id : 'Make sure you are logged in'}
                        {'\n'}
                        Profile Query Status: {JSON.stringify(profileError) || 'OK'}
                        {'\n'}
                        Profile Found: {profile ? 'YES' : 'NO'}
                        {'\n'}
                        Profile Data: {JSON.stringify(profile, null, 2)}
                        {'\n'}
                        --------------------------------
                        {'\n'}
                        Company Query Status: {JSON.stringify(companyError) || 'OK'}
                        {'\n'}
                        Company Found: {companyCheck ? 'YES' : 'NO'}
                        {'\n'}
                        Company Data: {JSON.stringify(companyCheck, null, 2)}
                    </div>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
            </div>

            <CreateInvoiceForm
                company={company}
                parties={parties}
                items={items}
                nextInvoiceNumber={nextNum}
            />
        </div>
    )
}
