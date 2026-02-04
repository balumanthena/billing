import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { sendBackupEmail } from "./mailer"
import { InvoicePDF } from '@/components/invoice/invoice-pdf';
import { ReceiptPDF } from '@/components/receipt/receipt-pdf';
import { ServiceAgreementPDF } from '@/components/invoice/service-agreement-pdf';
// import { renderPartyHTML } from "./party-template"

// --- TYPES ---
type BackupResult = { success: boolean; error?: any }

import { createClient } from "@/lib/supabase/server"

// --- HELPERS ---
function getFY(date: Date | string) {
    const d = new Date(date)
    const month = d.getMonth() // 0-11
    const year = d.getFullYear()
    let fyStart = year
    if (month < 3) fyStart = year - 1
    return `FY ${fyStart}-${(fyStart + 1).toString().slice(-2)}`
}

async function safeBackup(
    type: string,
    id: string,
    component: React.ReactElement,
    emailLog: string,
    customSubject?: string
): Promise<BackupResult> {
    const supabase = await createClient()

    try {
        console.log(`[Backup Service] Checking Existing Logs for ${type} ${id}...`)

        // 1. Idempotency Check: Prevent duplicate emails
        const { data: existing } = await (supabase
            .from('backup_logs') as any)
            .select('status')
            .eq('entity_type', type)
            .eq('entity_id', id)
            .eq('status', 'sent')
            .single()

        if (existing) {
            console.log(`[Backup Service] Skipped: Backup already sent for ${type} ${id}`)
            return { success: true }
        }

        // 2. Create Log Entry (Audit Trail)
        const { data: logEntry, error: logError } = await (supabase
            .from('backup_logs') as any)
            .insert({
                entity_type: type,
                entity_id: id,
                status: 'processing',
                attempt_count: 1,
                last_attempt_at: new Date().toISOString()
            })
            .select('id')
            .single()

        const logId = logEntry?.id

        if (logError) {
            console.error('[Backup Service] DB Log Failed (proceeding anyway):', logError)
        }

        console.log(`[Backup Service] Starting backup process...`)

        // 3. Generate PDF Buffer using React PDF Renderer
        console.log(`[Backup Service] Generating PDF for ${type} ${id}...`)
        const pdfBuffer = await renderToBuffer(component as any);

        // 4. Send Email
        await sendBackupEmail({
            subject: customSubject || `[BACKUP] New ${type} - ${id}`,
            body: emailLog,
            filename: `${type.toLowerCase()}_${id}.pdf`,
            pdfBuffer
        })

        // 5. Success Marking
        if (logId) {
            await (supabase.from('backup_logs') as any).update({ status: 'sent' }).eq('id', logId)
        }

        console.log(`[Backup Service] Success for ${type} ${id}`)
        return { success: true }

    } catch (error: any) {
        console.error(`[Backup Service] FAILED for ${type} ${id}:`, error)

        // 6. Failure Marking
        // We try to update the log if we can find it. 
        // We catch strict error to avoid crashing the logging update itself.
        try {
            await (supabase.from('backup_logs') as any)
                .update({
                    status: 'failed',
                    error_message: error.message || 'Unknown error'
                })
                .eq('entity_type', type)
                .eq('entity_id', id)
                .neq('status', 'sent') // Don't overwrite success? well we verified success earlier.
        } catch (dbError) {
            console.error('[Backup Service] Failed to update log:', dbError)
        }

        return { success: false, error }
    }
}

// --- PUBLIC API ---

export const BackupService = {
    async backupInvoice(invoice: any, items: any[], company: any, customer: any) {
        const fy = getFY(invoice.date)
        return safeBackup(
            "Invoice",
            invoice.invoice_number,
            // @ts-ignore - invoice object usually contains items, or props match
            React.createElement(InvoicePDF, { invoice: { ...invoice, invoice_items: items }, company, customer } as any),
            `
[SYSTEM GENERATED AUDIT RECORD]

-- TRANSACTION DETAILS --
Record Type: Tax Invoice
Invoice No: ${invoice.invoice_number}
Financial Year: ${fy}
Customer Name: ${customer.name}
Grand Total: ₹${invoice.grand_total?.toLocaleString('en-IN')}

-- AUDIT TRAIL --
Generated On: ${new Date().toLocaleString('en-IN')}
Source System: CitruX Billing Engine
Status: Finalized

This email serves as a digital backup for GST audit purposes. The attached PDF is the primary legal document.

This document was generated and archived automatically at the time of finalization and reflects the final legal state of the record.
            `,
            `[BACKUP] Invoice ${invoice.invoice_number} - ${fy}`
        )
    },

    async backupReceipt(payment: any, invoice: any, company: any, customer: any) {
        const fy = getFY(payment.payment_date)
        const receiptNo = payment.receipt_number || payment.id.substring(0, 8)
        return safeBackup(
            "Receipt",
            receiptNo,
            React.createElement(ReceiptPDF, { payment, invoice, company, customer }),
            `
[SYSTEM GENERATED AUDIT RECORD]

-- TRANSACTION DETAILS --
Record Type: Payment Receipt
Receipt No: ${receiptNo}
Financial Year: ${fy}
Received From: ${customer?.name}
Amount: ₹${payment.amount?.toLocaleString('en-IN')}
Against Invoice: ${invoice?.invoice_number}

-- AUDIT TRAIL --
Generated On: ${new Date().toLocaleString('en-IN')}
Source System: CitruX Billing Engine
Payment Mode: ${payment.mode}

This email serves as a digital backup for GST audit purposes. The attached PDF is the primary legal document.

This document was generated and archived automatically at the time of finalization and reflects the final legal state of the record.
            `,
            `[BACKUP] Receipt ${receiptNo} - ${fy}`
        )
    },

    async backupAgreement(agreement: any, party: any, company: any) {
        const agNum = agreement.agreement_number || agreement.id.substring(0, 8)
        const fy = getFY(agreement.date)
        const status = agreement.status.toUpperCase()

        return safeBackup(
            "Agreement",
            agNum,
            React.createElement(ServiceAgreementPDF, { invoice: agreement }), // Agreement PDF takes 'invoice' prop but treats it as agreement object
            `
[SYSTEM GENERATED AUDIT RECORD]

-- TRANSACTION DETAILS --
Record Type: Service Agreement
Agreement No: ${agNum}
Financial Year: ${fy}
Counterparty: ${party.name}
Contract Value: ₹${agreement.grand_total?.toLocaleString('en-IN')}
Current Status: ${status}

-- AUDIT TRAIL --
Generated On: ${new Date().toLocaleString('en-IN')}
Source System: CitruX Billing Engine

This email serves as a digital backup for legal and audit purposes. The attached PDF is the primary legal document.

This document was generated and archived automatically at the time of finalization and reflects the final legal state of the record.
            `,
            `[BACKUP] Agreement ${agNum} (${status}) - ${fy}`
        )
    },

    async backupParty(party: any, company: any) {
        // Lightweight Mode: No PDF, Text Body Only
        const id = party.name
        const type = "Party"
        try {
            console.log(`[Backup Service] Starting LIGHTWEIGHT backup for ${type} ${id}...`)

            const body = `
[NEW PARTY CREATED]

Name: ${party.name}
Type: ${party.type}
GSTIN: ${party.gstin || 'Unregistered'}
State: ${party.state} (${party.state_code})
Contact: ${party.phone || 'N/A'} | ${party.email || 'N/A'}

Created By: ${company.name}
Timestamp: ${new Date().toLocaleString('en-IN')}
`
            await sendBackupEmail({
                subject: `[BACKUP] New ${party.type} - ${party.name}`,
                body: body
            })
            console.log(`[Backup Service] Success for ${type} ${id}`)
            return { success: true }
        } catch (error) {
            console.error(`[Backup Service] FAILED for ${type} ${id}:`, error)
            return { success: false, error }
        }
    }
}
