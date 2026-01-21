'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { InvoicePDF } from './invoice-pdf'
import { IssueCreditNoteDialog } from './credit-note-dialog'
import { CancelInvoiceDialog } from './cancel-dialog'
import { finalizeInvoice, deleteInvoice } from '@/app/actions/invoices'
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Dynamically import PDFDownloadLink to avoid server-side issues
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button variant="outline" disabled>Loading PDF...</Button>,
    }
)

export default function InvoiceDetailView({ invoice }: { invoice: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleFinalize = async () => {
        setLoading(true)
        await finalizeInvoice(invoice.id)
        setLoading(false)
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this draft?')) return
        setLoading(true)
        const res = await deleteInvoice(invoice.id)
        setLoading(false)
        if (res.message === 'success') {
            router.push('/dashboard/invoices')
        } else {
            alert(res.message)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'finalized': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {invoice.invoice_number}
                            </h1>
                            <Badge className={getStatusColor(invoice.status)} variant="outline">
                                {invoice.status.toUpperCase()}
                            </Badge>
                        </div>
                        {invoice.status === 'cancelled' && (
                            <p className="text-xs text-red-600 mt-1">Reason: {invoice.cancel_reason}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Actions for Draft */}
                    {invoice.status === 'draft' && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="default" size="sm" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600">
                                        <CheckCircle className="h-4 w-4 mr-2" /> Finalize
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-md border-none shadow-2xl ring-1 ring-slate-100">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                                            Finalize Invoice?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-base text-slate-600">
                                            This action will lock the invoice and prevent any further edits.
                                            <br /><br />
                                            <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-sm font-medium border border-emerald-100">
                                                Invoice #{invoice.invoice_number}
                                            </span>
                                            <br /><br />
                                            Are you sure you want to proceed with finalizing this document?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleFinalize} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md">
                                            Yes, Finalize Invoice
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {/* Actions for Finalized */}
                    {invoice.status === 'finalized' && (
                        <>
                            <IssueCreditNoteDialog invoice={invoice} />

                            <PDFDownloadLink
                                document={<InvoicePDF invoice={invoice} />}
                                fileName={`${invoice.invoice_number}.pdf`}
                            >
                                {({ blob, url, loading, error }) =>
                                    <Button disabled={loading} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        {loading ? '...' : 'PDF'}
                                    </Button>
                                }
                            </PDFDownloadLink>
                        </>
                    )}

                    {/* Cancel Action (Available for Draft and Finalized, NOT Cancelled) */}
                    {invoice.status !== 'cancelled' && (
                        <CancelInvoiceDialog invoice={invoice} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg">{invoice.company_snapshot.name}</div>
                        <div className="text-sm space-y-1 mt-2">
                            <div>{invoice.company_snapshot.address}</div>
                            <div>{invoice.company_snapshot.state}</div>
                            <div>GSTIN: {invoice.company_snapshot.gstin}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Bill To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg">{invoice.customer_snapshot.name}</div>
                        <div className="text-sm space-y-1 mt-2">
                            <div>{invoice.customer_snapshot.address}</div>
                            <div>{invoice.customer_snapshot.state}</div>
                            <div>GSTIN: {invoice.customer_snapshot.gstin}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SAC</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Qty</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tax</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {invoice.invoice_items.map((item: any) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">{item.description}</td>
                                        <td className="p-4 align-middle">{item.sac_code}</td>
                                        <td className="p-4 align-middle">{item.quantity}</td>
                                        <td className="p-4 align-middle">{item.unit_price}</td>
                                        <td className="p-4 align-middle">{item.tax_rate}%</td>
                                        <td className="p-4 align-middle text-right">{item.total_amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Card className="w-full md:w-1/3">
                    <CardContent className="space-y-2 pt-6">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>₹{invoice.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tax Total:</span>
                            <span>₹{invoice.tax_total}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Grand Total:</span>
                            <span>₹{invoice.grand_total}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
