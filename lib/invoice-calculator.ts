export type InvoiceItem = {
    id?: string // temp id for key
    item_id: string
    description: string
    sac_code: string
    quantity: number
    unit_price: number
    tax_rate: number // 0, 5, 12, 18, 28
}

export type TaxBreakup = {
    taxable_amount: number
    cgst: number
    sgst: number
    igst: number
    total: number
}

// Helper to round currency
function round(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100
}

export function calculateInvoice(
    items: InvoiceItem[],
    companyStateCode: string,
    partyStateCode: string,
    taxMode: 'inclusive' | 'exclusive' = 'exclusive',
    tdsRate: number = 0
) {
    const isInterState = companyStateCode !== partyStateCode

    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0

    const lineItems = items.map(item => {
        const rawTotal = item.quantity * item.unit_price // Base amount

        let taxable = 0
        let taxAmount = 0

        // Calculate Taxable & Tax based on Mode
        if (taxMode === 'inclusive') {
            // Formula: Taxable = Total / (1 + Rate/100)
            taxable = round(rawTotal / (1 + (item.tax_rate / 100)))
            taxAmount = round(rawTotal - taxable)
        } else {
            // Exclusive
            taxable = round(rawTotal)
            taxAmount = round(taxable * (item.tax_rate / 100))
        }

        let cgst = 0
        let sgst = 0
        let igst = 0

        // Distribute Tax Amount
        if (isInterState) {
            igst = taxAmount
        } else {
            cgst = round(taxAmount / 2)
            sgst = round(taxAmount - cgst) // Balance rounding diffs
        }

        const total = round(taxable + cgst + sgst + igst)

        subtotal += taxable
        totalCGST += cgst
        totalSGST += sgst
        totalIGST += igst

        return {
            ...item,
            taxable,
            cgst,
            sgst,
            igst,
            total
        }
    })

    const grandTotal = round(subtotal + totalCGST + totalSGST + totalIGST)
    const tdsAmount = round(subtotal * (tdsRate / 100))
    const netReceivable = round(grandTotal - tdsAmount)

    // Final totals
    // grandTotal IS the invoice value.
    // netReceivable is what we expect to get paid.
    return {
        lineItems,
        subtotal: round(subtotal),
        totalCGST: round(totalCGST),
        totalSGST: round(totalSGST),
        totalIGST: round(totalIGST),
        grandTotal,
        tdsAmount,
        netReceivable
    }
}
