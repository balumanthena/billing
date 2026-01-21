'use client'

import { useEffect, useState } from 'react'
import { getInvoices } from '@/app/actions/invoices'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Loader2, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <Link href="/dashboard/invoices/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            {loading ? (
                <>
                    {/* Desktop Skeleton */}
                    <div className="hidden md:block border rounded-md">
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
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Skeleton */}
                    <div className="md:hidden space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-3 w-[100px]" />
                                    </div>
                                    <Skeleton className="h-5 w-[60px] rounded-full" />
                                </div>
                                <div className="flex justify-between items-end border-t pt-3">
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-[50px]" />
                                        <Skeleton className="h-6 w-[100px]" />
                                    </div>
                                    <Skeleton className="h-8 w-[80px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-md">
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

                    {/* Mobile Card List View */}
                    <div className="md:hidden space-y-4">
                        {invoices.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/10">
                                No invoices generated yet.
                            </div>
                        )}
                        {invoices.map((invoice) => (
                            <div key={invoice.id} className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-base">{invoice.customer_snapshot?.name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">
                                            #{invoice.invoice_number} • {format(new Date(invoice.date), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${invoice.status === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {invoice.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-end border-t pt-3">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Grand Total</div>
                                        <div className="text-xl font-bold">₹{invoice.grand_total.toLocaleString('en-IN')}</div>
                                    </div>
                                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                                        <Button size="sm" variant="outline">
                                            <FileText className="mr-2 h-4 w-4" /> View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
