'use client'

import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

export function PrintPageActions() {
    return (
        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
            <Button
                onClick={() => window.print()}
                className="bg-blue-600 text-white hover:bg-blue-700"
            >
                <Printer className="mr-2 h-4 w-4" />
                Print / Save PDF
            </Button>
            <Button
                onClick={() => window.close()}
                variant="secondary"
            >
                <X className="mr-2 h-4 w-4" />
                Close
            </Button>
        </div>
    )
}
