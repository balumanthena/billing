'use client'

import { Button } from "@/components/ui/button"
import { Printer, Download, Loader2 } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReceiptPDF } from "./receipt-pdf"
import { useEffect, useState } from "react"

interface ReceiptActionsProps {
    payment: any;
    invoice: any;
    company: any;
    customer: any;
}

export function ReceiptActions({ payment, invoice, company, customer }: ReceiptActionsProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) return null

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>

            <PDFDownloadLink
                document={<ReceiptPDF payment={payment} invoice={invoice} company={company} customer={customer} />}
                fileName={`Receipt-${payment.receipt_number}.pdf`}
            >
                {/* @ts-ignore */}
                {({ blob, url, loading, error }) => (
                    <Button disabled={loading} variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {loading ? 'Generating...' : 'Download PDF'}
                    </Button>
                )}
            </PDFDownloadLink>
        </div>
    )
}
