'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Ban, Loader2 } from "lucide-react"
import { cancelInvoice } from '@/app/actions/invoices'
import { useRouter } from 'next/navigation'

export function CancelInvoiceDialog({ invoice }: { invoice: any }) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCancel = async () => {
        if (!reason || reason.length < 5) return
        setLoading(true)
        const res = await cancelInvoice(invoice.id, reason)
        setLoading(false)
        if (res.message === 'success') {
            setOpen(false)
            setReason('')
            router.refresh()
        } else {
            alert(res.message)
        }
    }

    if (invoice.status === 'cancelled') return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Ban className="mr-2 h-4 w-4" /> Cancel Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cancel Invoice</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel this invoice? This action cannot be undone.
                        You must provide a reason.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Cancellation</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Incorrect amount, Duplicate entry..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Back</Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={loading || reason.length < 5}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
