
import { createClient } from '@/lib/supabase/server'
import CreateAgreementForm from '@/components/agreements/create-agreement-form'
import { getAgreement } from '@/app/actions/agreements'

export default async function EditAgreementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Please log in</div>

    // 2. Fetch dependencies
    const { data: parties } = await supabase.from('parties').select('*').eq('type', 'customer')
    const { data: items } = await supabase.from('items').select('*')
    const { data: profile } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()

    const company = (profile as any)?.companies

    // 3. Fetch Agreement
    const agreement = await getAgreement(id)

    if (!agreement) {
        return <div>Agreement not found</div>
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <CreateAgreementForm
                company={company}
                parties={parties || []}
                items={items || []}
                initialData={agreement}
            />
        </div>
    )
}
