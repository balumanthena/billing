import { getNextInvoiceNumber } from '@/app/actions/invoices'
import { getNextMasterInvoiceNumber } from '@/app/actions/master-invoices'
import { getParties } from '@/app/actions/parties'
import { getItems } from '@/app/actions/items'
import { getCompany } from '@/app/actions/company'
import CreateInvoiceForm from '@/components/invoice/create-form'

export default async function NewInvoicePage() {
    const [parties, items, company, nextInvoiceNumber, nextMasterNum] = await Promise.all([
        getParties(),
        getItems(),
        getCompany(),
        getNextInvoiceNumber(),
        getNextMasterInvoiceNumber()
    ])

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
            </div>

            <CreateInvoiceForm
                company={company}
                parties={parties}
                items={items}
                nextInvoiceNumber={nextInvoiceNumber}
                nextMasterInvoiceNumber={nextMasterNum}
            />
        </div>
    )
}
