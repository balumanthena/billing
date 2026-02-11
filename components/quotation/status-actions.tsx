'use client'

import { useState } from "react"
import { updateQuotationStatus, convertQuotation } from "@/app/actions/quotations"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, FileText, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface Props {
    id: string
    status: string
    convertedAgreementId?: string
    convertedInvoiceId?: string
}

export function QuotationStatusActions({ id, status, convertedAgreementId, convertedInvoiceId }: Props) {
    const { toast } = useToast()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleStatusUpdate = async (newStatus: string) => {
        setLoading(true)
        const res = await updateQuotationStatus(id, newStatus)
        if (res.success) {
            toast({ title: "Status Updated", description: `Quotation marked as ${newStatus}` })
            router.refresh()
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" })
        }
        setLoading(false)
    }

    const handleConvert = async (target: 'invoice' | 'agreement') => {
        if (!confirm(`Are you sure you want to convert this quotation to an ${target}? This cannot be undone.`)) return

        setLoading(true)
        const res = await convertQuotation(id, target)
        if (res?.success) {
            toast({ title: "Converted Successfully", description: `Created new ${target}` })
            router.refresh()
            // Optionally redirect
            // router.push(target === 'invoice' ? `/dashboard/invoices/${res.targetId}` : `/dashboard/agreements`)
        } else {
            toast({ title: "Conversion Failed", description: res?.message, variant: "destructive" })
        }
        setLoading(false)
    }

    if (loading) {
        return <Button disabled variant="ghost"><Loader2 className="h-4 w-4 animate-spin" /></Button>
    }

    if (status === 'draft' || status === 'viewed') {
        return (
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate('sent')}>
                    Mark Sent
                </Button>
                <Button size="sm" onClick={() => handleStatusUpdate('approved')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
            </div>
        )
    }

    if (status === 'sent') {
        return (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('rejected')}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button size="sm" onClick={() => handleStatusUpdate('approved')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
            </div>
        )
    }

    if (status === 'approved') {
        return (
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            Convert <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConvert('invoice')}>
                            Convert to Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvert('agreement')}>
                            Convert to Agreement
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }

    if (status === 'converted') {
        return (
            <div className="flex gap-2">
                {convertedInvoiceId && (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/invoices/${convertedInvoiceId}`)}>
                        View Invoice
                    </Button>
                )}
                {convertedAgreementId && (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agreements`)}>
                        View Agreement
                    </Button>
                )}
            </div>
        )
    }

    return null
}
