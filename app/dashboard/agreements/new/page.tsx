import { getParties } from '@/app/actions/parties'
import { getItems } from '@/app/actions/items'
import { getCompany } from '@/app/actions/company'
import CreateAgreementForm from '@/components/agreements/create-agreement-form'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function NewAgreementPage() {
    const [parties, items, company] = await Promise.all([
        getParties(),
        getItems(),
        getCompany()
    ])

    if (!company) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Please ensure your Company Profile is fully set up before generating agreements.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <CreateAgreementForm
                company={company}
                parties={parties}
                items={items}
            />
        </div>
    )
}
