'use client'

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Trash2, CheckCircle, Info, CircleHelp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { InvoicePDF } from './invoice-pdf'
import { IssueCreditNoteDialog } from './credit-note-dialog'
import { CancelInvoiceDialog } from './cancel-dialog'
import { AgreementDialog } from './agreement-dialog'
import { finalizeInvoice, deleteInvoice } from '@/app/actions/invoices'
import { InvoicePaymentsSection } from '@/components/invoice/invoice-payments'
import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
// @ts-ignore
import bwipjs from 'bwip-js'
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
    const [barcodeUrl, setBarcodeUrl] = useState<string>('')

    useEffect(() => {
        try {
            const canvas = document.createElement('canvas')

            // Format data for the QR code
            const qrData = `Invoice: ${invoice.invoice_number}\nCustomer: ${invoice.customer_snapshot?.name || 'Customer'}\nDate: ${invoice.date || ''}\nAmount: ${invoice.grand_total || 0}`

            bwipjs.toCanvas(canvas, {
                bcid: 'qrcode',        // QR Code
                text: qrData,          // Formatted text
                scale: 3,              // Scaling factor
                includetext: false,    // No text below QR code
            })
            setBarcodeUrl(canvas.toDataURL('image/png'))
        } catch (e) {
            console.error('QR generation failed', e)
        }
    }, [invoice])

    const handleFinalize = async () => {
        setLoading(true)
        try {
            const res = await finalizeInvoice(invoice.id)

            if (res.message !== 'success') {
                toast.error(res.message)
            } else {
                toast.success("Invoice finalized successfully")
                router.refresh()
            }
        } catch (error: any) {
            console.error('Finalize error', error)
            toast.error(error.message || "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        const res = await deleteInvoice(invoice.id)
        setLoading(false)
        if (res.message === 'success') {
            router.push('/dashboard/invoices')
        } else {
            toast.error(res.message)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'finalized': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'completed': return 'bg-purple-100 text-purple-800' // For Master
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Check if this is a Child Invoice (Phase)
    const isPhaseInvoice = !!invoice.master_invoice_id;

    return (
        <div className="space-y-6">
            {/* ERP-Style Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-9 w-9 p-0 rounded-full border-slate-300">
                            <ArrowLeft className="h-4 w-4 text-slate-600" />
                        </Button>

                        <div>
                            {/* Primary: Invoice Number */}
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    {invoice.invoice_number}
                                </h1>
                                {/* Status Badge - Subtle Pill */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${invoice.status === 'finalized' ? 'bg-green-50 text-green-700 border-green-200' :
                                                invoice.status === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    invoice.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {invoice.status}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Current Invoice Status</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Secondary: Phase Context */}
                            {isPhaseInvoice && (
                                <div className="flex items-center gap-3 mt-1.5">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 font-medium">
                                        {invoice.phase_label || `Phase ${invoice.phase_number}`}
                                    </Badge>

                                    {/* Linked Contract - Muted & Professional */}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span className="text-slate-400">|</span>
                                        <span className="font-medium">Linked Contract:</span>
                                        <span className="font-mono text-slate-600 font-semibold tracking-tight">
                                            {invoice.master_invoice?.master_invoice_number || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Cancel Reason */}
                            {invoice.status === 'cancelled' && (
                                <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 px-2 py-1 rounded inline-block">
                                    Cancelled: {invoice.cancel_reason}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {/* Actions for Draft */}
                    {invoice.status === 'draft' && (
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={loading} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-none shadow-xl ring-1 ring-red-100">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                            <Trash2 className="h-5 w-5" />
                                            Delete Draft Invoice?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-600">
                                            This action cannot be undone. This will permanently delete the draft invoice <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                            Delete Invoice
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="default" size="sm" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600">
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Finalize
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Locks the invoice to prevent further edits.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
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
                                document={<InvoicePDF invoice={{ ...invoice, barcodeUrl }} />}
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
                        <div className="font-bold text-lg">{invoice.company_snapshot?.name || 'Unknown Company'}</div>
                        <div className="text-sm space-y-1 mt-2">
                            <div>{invoice.company_snapshot?.address}</div>
                            <div>{invoice.company_snapshot?.state}</div>
                            <div>GSTIN: {invoice.company_snapshot?.gstin}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Bill To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg">{invoice.customer_snapshot?.name || 'Unknown Customer'}</div>
                        <div className="text-sm space-y-1 mt-2">
                            <div>{invoice.customer_snapshot?.address}</div>
                            <div>{invoice.customer_snapshot?.state}</div>
                            <div>GSTIN: {invoice.customer_snapshot?.gstin}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Table: Items (Standard) or Phases (Master) */}
            <Card>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    {invoice.phases ? (
                                        <>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] text-center">Phase #</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Action</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SAC</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Qty</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tax</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {invoice.phases ? (
                                    // Master Invoice Phases
                                    invoice.phases.map((phase: any) => (
                                        <tr key={phase.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle text-center font-bold text-muted-foreground">{phase.phase_number}</td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium text-slate-900">{phase.phase_label}</div>
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{phase.invoice_number}</div>
                                            </td>
                                            <td className="p-4 align-middle">{phase.due_date}</td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="secondary" className={`
                                                    ${phase.status === 'finalized' ? 'bg-green-100 text-green-700' :
                                                        phase.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'}
                                                `}>
                                                    {phase.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">₹{phase.grand_total}</td>
                                            <td className="p-4 align-middle text-center">
                                                <Button size="sm" variant="outline" asChild className="h-8">
                                                    <a href={`/dashboard/invoices/${phase.id}`}>View</a>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    // Standard Invoice Items
                                    (invoice.invoice_items?.map((item: any) => (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle">{item.description}</td>
                                            <td className="p-4 align-middle">{item.sac_code}</td>
                                            <td className="p-4 align-middle">{item.quantity}</td>
                                            <td className="p-4 align-middle">{item.unit_price}</td>
                                            <td className="p-4 align-middle">{item.tax_rate}%</td>
                                            <td className="p-4 align-middle text-right">{item.total_amount}</td>
                                        </tr>
                                    )) || (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-muted-foreground">No items</td>
                                            </tr>
                                        ))
                                )}
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

            {/* Payments Section */}
            <div className="pt-6 border-t border-border/40">
                <InvoicePaymentsSection
                    invoiceId={invoice.id}
                    grandTotal={invoice.grand_total}
                    netReceivable={invoice.net_receivable || invoice.grand_total}
                />
            </div>
        </div>
    )
}


