'use client'

import { useActionState, useEffect, useState } from 'react'
import { getPayments, recordPayment } from '@/app/actions/payments'
import { getInvoices } from '@/app/actions/invoices'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const initialState = {
    message: '',
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const [state, formAction, isPending] = useActionState(recordPayment, initialState)

    async function loadData() {
        setLoading(true)
        const [pData, iData] = await Promise.all([getPayments(), getInvoices()])
        setPayments(pData)
        setInvoices(iData)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (state?.message === 'success') {
            setOpen(false)
            loadData()
        }
    }, [state])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Payments / Receipts</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Record Payment
                </Button>
            </div>

            {loading ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{payment.invoices?.invoice_number || '-'}</TableCell>
                                    <TableCell>{payment.invoices?.customer_snapshot?.name || '-'}</TableCell>
                                    <TableCell className="capitalize">{payment.mode}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        ₹{payment.amount.toLocaleString('en-IN')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment received against an invoice.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="invoice_id" className="text-right">Invoice</Label>
                            <div className="col-span-3">
                                <Select name="invoice_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {invoices.map(inv => (
                                            <SelectItem key={inv.id} value={inv.id}>
                                                {inv.invoice_number} - {inv.customer_snapshot?.name} (₹{inv.grand_total})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment_date" className="text-right">Date</Label>
                            <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mode" className="text-right">Mode</Label>
                            <div className="col-span-3">
                                <Select name="mode" defaultValue="bank_transfer">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer / NEFT</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Notes</Label>
                            <Input id="notes" name="notes" className="col-span-3" />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Receipt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
