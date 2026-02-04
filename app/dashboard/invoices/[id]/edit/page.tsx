
import { getInvoice } from '@/app/actions/invoices'
import { getMasterInvoice } from '@/app/actions/master-invoices'
import { getParties } from '@/app/actions/parties'
import { getItems } from '@/app/actions/items'
import { getCompany } from '@/app/actions/company'
import CreateInvoiceForm from '@/components/invoice/create-form'
import { redirect } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Try to get as Standard Invoice first
    let invoice = await getInvoice(id)
    let isMaster = false
    let targetId = id

    if (invoice) {
        // Found in 'invoices' table.
        // Check if it's a phase of a master invoice
        if (invoice.master_invoice_id) {
            // It's a phase! We should edit the Master Invoice instead.
            const master = await getMasterInvoice(invoice.master_invoice_id)
            if (master) {
                invoice = master
                targetId = master.id // Use master ID for actions
                isMaster = true
            }
        }
    } else {
        // Not found in 'invoices', check 'master_invoices'
        const master = await getMasterInvoice(id)
        if (master) {
            invoice = master
            isMaster = true
        }
    }

    if (!invoice) {
        return <div className="p-8 text-center text-red-500">Invoice not found</div>
    }

    const [parties, items, company] = await Promise.all([
        getParties(),
        getItems(),
        getCompany()
    ])

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">
                    {isMaster ? 'Edit Master Contract' : 'Edit Invoice'}
                </h1>
            </div>

            <CreateInvoiceForm
                company={company}
                parties={parties}
                items={items}
                nextInvoiceNumber={isMaster ? invoice.master_invoice_number : invoice.invoice_number}
                initialData={invoice}
                invoiceId={targetId}
            />
        </div>
    )
}
