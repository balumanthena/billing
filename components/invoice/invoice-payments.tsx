'use client'

import { useState, useEffect, useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Plus, Receipt, Loader2, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recordPayment } from '@/app/actions/payments'
import { format } from 'date-fns'
import Link from 'next/link'

const initialState = {
    message: ''
}

export function InvoicePaymentsSection({ invoiceId, grandTotal }: { invoiceId: string, grandTotal: number }) {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState(0)

    const [state, formAction, isPending] = useActionState(recordPayment, initialState)
    const supabase = createClient()

    async function fetchPayments() {
        setLoading(true)
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('created_at', { ascending: false })

        if (data) {
            setPayments(data)
            const sum = (data as any[]).reduce((acc, p) => acc + (p.amount || 0), 0)
            setPaidAmount(sum)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPayments()
    }, [invoiceId])

    useEffect(() => {
        if (state?.message === 'success') {
            setOpen(false)
            fetchPayments()
            // Optionally refresh router to update invoice status if needed
            // router.refresh() 
        }
    }, [state])

    const outstanding = grandTotal - paidAmount
    const status = outstanding <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Unpaid')

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20">
                <div className="flex items-center gap-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-violet-600" /> Payment History
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Received: <span className="font-semibold text-slate-700">₹{paidAmount.toLocaleString()}</span> •
                        Outstanding: <span className="font-semibold text-slate-700">₹{Math.max(0, outstanding).toLocaleString()}</span>
                    </div>
                </div>
                {outstanding > 0 && (
                    <Button size="sm" onClick={() => setOpen(true)} className="h-8 bg-violet-600 hover:bg-violet-700 text-white">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Payment
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[150px]">Receipt #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[100px] text-center">Receipt</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Loading payments...</TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No payments recorded.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-xs">{p.receipt_number || '-'}</TableCell>
                                    <TableCell>{format(new Date(p.payment_date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="capitalize">{p.mode}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{p.reference_id || '-'}</TableCell>
                                    <TableCell className="text-right font-medium">₹{p.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-violet-600" asChild>
                                            <Link href={`/dashboard/receipts/${p.id}`} target="_blank">
                                                <FileText className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Generate a receipt for payment received against this invoice.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="space-y-4 pt-2">
                        <input type="hidden" name="invoice_id" value={invoiceId} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input name="payment_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (₹)</Label>
                                <Input name="amount" type="number" step="0.01" required defaultValue={outstanding} max={outstanding} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Mode</Label>
                                <Select name="mode" defaultValue="bank_transfer">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank_transfer">Bank Transfer / NEFT</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reference ID</Label>
                                <Input name="reference_id" placeholder="UTR / Cheque No." required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input name="notes" placeholder="Additional details..." />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{state.message}</div>
                        )}

                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={isPending} className="w-full bg-violet-600 hover:bg-violet-700">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm & Generate Receipt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
