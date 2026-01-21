'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { createCreditNote } from '@/app/actions/credit-notes'

interface IssueCreditNoteDialogProps {
    invoice: any
}

export function IssueCreditNoteDialog({ invoice }: IssueCreditNoteDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Default to Full Refund logic?
    // For MVP, we allow entering a "Lump Sum" taxable amount to reverse.
    // Or we show items and allow selecting quantity.
    // Let's do simple "Partial/Full Value Reversal" for Phase 1 MVP.
    // User enters a description and a Taxable Amount. The system calculates GST.

    const [description, setDescription] = useState('Sales Return')
    const [reason, setReason] = useState('Sales Return')
    const [taxableAmount, setTaxableAmount] = useState('')
    // We default to the first item's tax rate or a standard 18% if mixed?
    // Actually, locking to invoice's max tax rate is safer, or explicit input.
    // Let's ask for Tax Rate too.
    const [taxRate, setTaxRate] = useState('18')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const payload = {
            invoiceId: invoice.id,
            date: new Date().toISOString().split('T')[0],
            reason,
            items: [
                {
                    description,
                    taxableAmount: parseFloat(taxableAmount),
                    taxRate: parseFloat(taxRate)
                }
            ]
        }

        const formData = new FormData()
        formData.append('data', JSON.stringify(payload))

        try {
            const result = await createCreditNote(null, formData)
            if (result.message !== 'success') {
                setError(result.message)
            } else {
                setOpen(false)
                // Optionally refresh or show success toast
            }
        } catch (err: any) {
            setError('Failed to issue credit note')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">Issue Credit Note</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Issue Credit Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Sales Return, Defective Goods"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Item Description</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description of reversal"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Taxable Value Reversal (₹)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={taxableAmount}
                                onChange={(e) => setTaxableAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>GST Rate (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        Note: GST (CGST/SGST or IGST) will be automatically calculated based on the original invoice state logic.
                        Max allowable reversal: ₹{invoice.subtotal}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Credit Note
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
