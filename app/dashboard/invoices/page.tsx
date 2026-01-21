'use client'

import { useEffect, useState } from 'react'
import { getInvoices } from '@/app/actions/invoices'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Loader2, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    async function loadInvoices() {
        setLoading(true)
        const data = await getInvoices()
        setInvoices(data)
        setLoading(false)
    }

    useEffect(() => {
        loadInvoices()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <Link href="/dashboard/invoices/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No invoices generated yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{format(new Date(invoice.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        {invoice.customer_snapshot?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${invoice.status === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        ₹{invoice.grand_total.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
