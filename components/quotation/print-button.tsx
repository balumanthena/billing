'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useParams } from "next/navigation"

export function PrintQuotationButton({ id }: { id?: string }) {
    const params = useParams()
    const quoteId = id || (params?.id as string)

    const handlePrint = () => {
        if (!quoteId) return
        // Open the dedicated print route
        window.open(`/print/quotation/${quoteId}`, '_blank')
    }

    return (
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
        </Button>
    )
}
