import { getInvoice } from '@/app/actions/invoices'
import InvoiceDetailView from '@/components/invoice/invoice-view'
import { notFound } from 'next/navigation'

// Next.js 15+: params is a Promise
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await getInvoice(id)

    if (!invoice) {
        notFound()
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <InvoiceDetailView invoice={invoice} />
        </div>
    )
}
