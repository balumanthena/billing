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
    partyStateCode: string
) {
    const isInterState = companyStateCode !== partyStateCode

    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0

    const lineItems = items.map(item => {
        const taxable = round(item.quantity * item.unit_price) // Assuming no line-item discount for MVP complexity

        let cgst = 0
        let sgst = 0
        let igst = 0

        if (isInterState) {
            igst = round(taxable * (item.tax_rate / 100))
        } else {
            cgst = round(taxable * ((item.tax_rate / 2) / 100))
            sgst = round(taxable * ((item.tax_rate / 2) / 100))
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

    // Final totals (could also sum line items, but floating point drift might occur, typically sum of lines is safer for tax compliance than tax on total)
    // GST Rule: Tax is calculated per line item and rounded.

    return {
        lineItems,
        subtotal: round(subtotal),
        totalCGST: round(totalCGST),
        totalSGST: round(totalSGST),
        totalIGST: round(totalIGST),
        grandTotal: round(subtotal + totalCGST + totalSGST + totalIGST)
    }
}
