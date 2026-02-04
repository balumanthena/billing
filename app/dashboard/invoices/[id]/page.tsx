import { getInvoice } from '@/app/actions/invoices'
import { getMasterInvoice } from '@/app/actions/master-invoices'
import InvoiceDetailView from '@/components/invoice/invoice-view'
import { notFound } from 'next/navigation'

// Next.js 15+: params is a Promise
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Try Standard Invoice First
    let invoice = await getInvoice(id)

    // If not found, Try Master Invoice
    if (!invoice) {
        invoice = await getMasterInvoice(id)
    }

    if (!invoice) {
        notFound()
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <InvoiceDetailView invoice={invoice} />
        </div>
    )
}
