'use client'

import { useEffect, useState } from 'react'
import { getInvoices } from '@/app/actions/invoices'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Filter, Search, FileText, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    async function loadInvoices() {
        setLoading(true)
        const data = await getInvoices()
        setInvoices(data)
        setLoading(false)
    }

    useEffect(() => {
        loadInvoices()
    }, [])

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Status Badge Helper
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-slate-100 text-slate-600 border-slate-200'
            case 'finalized': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
            case 'paid': return 'bg-green-50 text-green-700 border-green-100' // Using deeper green for paid
            case 'partially_paid': return 'bg-blue-50 text-blue-700 border-blue-100'
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
            case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-100'
            default: return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    // Amount Helper
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="w-full px-6 py-6 space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        All invoices issued across customers and contracts
                    </p>
                </div>
                <Link href="/dashboard/invoices/new">
                    <Button className="bg-[#7C5CFC] hover:bg-[#6b4ce6] text-white shadow-sm rounded-md">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search or filter..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[260px] bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="finalized">Finalized</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                {/* Date Picker could go here in future */}
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px] font-semibold text-slate-500 uppercase text-[11px] tracking-wider py-4">Invoice No</TableHead>
                            <TableHead className="w-[120px] font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Date</TableHead>
                            <TableHead className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Customer</TableHead>
                            <TableHead className="w-[140px] font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Status</TableHead>
                            <TableHead className="text-right font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Amount</TableHead>
                            <TableHead className="w-[80px] text-right font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[100px] ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 opacity-20" />
                                        <p>No invoices found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="group hover:bg-[#7C5CFC]/5 hover:border-violet-200 cursor-pointer text-sm transition-all border-b border-slate-50 last:border-0">
                                    <TableCell className="py-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-medium text-slate-700 text-[13px] tracking-tight">
                                                {invoice.invoice_number}
                                            </span>
                                            {invoice.master_invoice?.master_invoice_number && (
                                                <span className="text-[10px] text-slate-400 mt-0.5 font-normal">
                                                    Linked: {invoice.master_invoice.master_invoice_number}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 align-top pt-4">
                                        {format(new Date(invoice.date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <div className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-[300px]">
                                            {invoice.customer_snapshot?.name || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusStyle(invoice.status)} capitalize`}>
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right align-top pt-4">
                                        <span className={`font-semibold tracking-tight ${invoice.status === 'paid' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                            {formatCurrency(invoice.grand_total)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right align-top pt-3">
                                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile-Only Summary (Optional, if table is too dense for mobile) */}
            <div className="md:hidden text-center text-xs text-slate-400 mt-4">
                Tip: View on desktop for full details
            </div>
        </div>
    )
}
