import { numberToIndianRupees } from './number-utils'

export const renderInvoiceHTML = (invoice: any, items: any[], company: any, customer: any) => {
    // GST Logic
    const companyState = company?.state?.toLowerCase().trim() || ''
    const customerState = customer?.state?.toLowerCase().trim() || ''
    const companyCode = company?.state_code
    const customerCode = customer?.state_code

    // Determine Intra-State (Same State) vs Inter-State (Different State)
    let isIntraState = false
    if (companyCode && customerCode) {
        isIntraState = companyCode == customerCode
    } else {
        isIntraState = companyState === customerState
    }

    // Logo Path (Absolute for Puppeteer)
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`

    // Tax Breakup Calculation
    const taxTotal = invoice.tax_total || 0
    const cgst = isIntraState ? taxTotal / 2 : 0
    const sgst = isIntraState ? taxTotal / 2 : 0
    const igst = !isIntraState ? taxTotal : 0

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
            @page { size: A4; margin: 0; }
            body { 
                font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                margin: 0; 
                padding: 0; 
                color: #111; 
                line-height: 1.5; 
                -webkit-print-color-adjust: exact; 
                background: #fff;
            }

            /* --- HEADER STRIP --- */
            .top-bar {
                background-color: #0F172A; /* Deep Navy */
                height: 44px; /* Reduced height as requested (40-45px range) */
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 40px; /* 40px left/right to align with body content */
                box-sizing: border-box;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10;
                print-color-adjust: exact;
            }

            .strip-logo {
                height: 28px; /* 3x size target (~28-32px) */
                width: auto;
                filter: brightness(0) invert(1); /* Force White */
                object-fit: contain;
                display: block;
                padding-top: 2px; /* Fine-tune optical visual center */
            }

            .strip-website {
                color: rgba(255, 255, 255, 0.70);
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                font-weight: 500;
                line-height: 1;
            }

            /* --- MAIN CONTENT --- */
            .container {
                padding: 84px 40px 40px 40px; /* Header 44px + 40px gap */
            }

            .header-info { 
                display: flex; 
                justify-content: flex-end; 
                align-items: flex-start;
                margin-bottom: 40px; 
                border-bottom: 2px solid #f1f5f9; 
                padding-bottom: 20px; 
            }
            
            /* Since Logo is in top strip, we don't need it below. 
               We just show the Invoice Details block aligned Right (standard) or Left? 
               Usually standard invoices have Supplier Left, title Right. 
               Let's keep Title Right as per previous design but cleaner.
            */

            .invoice-details { text-align: right; width: 100%; }
            .invoice-title { font-size: 32px; color: #0F172A; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 5px; text-transform: uppercase; }
            .meta { color: #64748b; font-size: 14px; font-weight: 500; }
            
            .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
            .addr-block { flex: 1; }
            .addr-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; display: inline-block; }
            .addr-text { font-size: 14px; line-height: 1.6; color: #334155; }
            .addr-name { font-weight: 700; color: #0f172a; font-size: 15px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th { text-align: left; padding: 12px 10px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .text-right { text-align: right; }
            
            .totals-section { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-table { width: 400px; border-collapse: collapse; }
            .totals-table td { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
            .totals-table .label { color: #64748b; font-weight: 500; }
            .totals-table .amount { font-weight: 600; text-align: right; color: #1e293b; }
            .grand-total-row td { border-top: 2px solid #0f172a; border-bottom: none; padding-top: 15px; font-size: 18px; color: #0f172a; font-weight: 800; }
            
            .words-row { margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
            .words-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 5px; }
            .words-text { font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: #0f172a; }
            
            /* Watermark removed/minimized to not overlap header */
            .watermark { position: fixed; top: 55%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; width: 400px; z-index: -1; pointer-events: none; }
            
            .footer { position: fixed; bottom: 40px; left: 40px; right: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
    </head>
    <body>
        <!-- Top Corporate Header -->
        <div class="top-bar">
            <!-- Left padding handled by container 40px to align with text -->
             <img src="${logoUrl}" class="strip-logo" alt="Logo" /> 
            <div class="strip-website">WWW.CITRUX.IN</div>
        </div>

        <img src="${logoUrl}" class="watermark" />

        <div class="container">
            <div class="header-info">
                <div class="invoice-details">
                    <div class="invoice-title">TAX INVOICE</div>
                    <div class="meta">#${invoice.invoice_number}</div>
                    <div class="meta">Date: ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    ${invoice.due_date ? `<div class="meta">Due: ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>` : ''}
                </div>
            </div>

            <div class="addresses">
                <div class="addr-block">
                    <div class="addr-title">Billed By (Supplier)</div>
                    <div class="addr-text">
                        <div class="addr-name">${company?.name}</div>
                        ${company?.address || ''}<br/>
                        ${company?.city || ''}, ${company?.state || ''} - ${company?.pincode || ''}<br/>
                        <strong>GSTIN: ${company?.gstin || '-'}</strong><br/>
                        Email: ${company?.email || 'support@citrux.in'}
                    </div>
                </div>
                <div class="addr-block">
                    <div class="addr-title">Billed To (Recipient)</div>
                    <div class="addr-text">
                        <div class="addr-name">${customer?.name}</div>
                        ${customer?.address || ''}<br/>
                        ${customer?.city || ''}, ${customer?.state || ''} - ${customer?.pincode || ''}<br/>
                        <strong>GSTIN: ${customer?.gstin || 'N/A'}</strong>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40%">Description</th>
                        <th class="text-right">HSN/SAC</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Rate</th>
                        ${isIntraState ?
            `<th class="text-right">CGST</th><th class="text-right">SGST</th>` :
            `<th class="text-right">IGST</th>`
        }
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => {
            return `
                    <tr>
                        <td>
                            <div style="font-weight: 500">${item.description || 'Item'}</div>
                        </td>
                        <td class="text-right">${item.sac_code || '-'}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">₹${item.unit_price.toLocaleString('en-IN')}</td>
                        ${isIntraState ?
                    `<td class="text-right">${item.tax_rate / 2}%</td><td class="text-right">${item.tax_rate / 2}%</td>` :
                    `<td class="text-right">${item.tax_rate}%</td>`
                }
                        <td class="text-right">₹${item.total_amount.toLocaleString('en-IN')}</td>
                    </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Taxable Value</td>
                        <td class="amount">₹${invoice.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                    ${isIntraState ? `
                    <tr>
                        <td class="label">CGST</td>
                        <td class="amount">₹${cgst.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td class="label">SGST</td>
                        <td class="amount">₹${sgst.toLocaleString('en-IN')}</td>
                    </tr>
                    ` : `
                    <tr>
                        <td class="label">IGST</td>
                        <td class="amount">₹${igst.toLocaleString('en-IN')}</td>
                    </tr>
                    `}
                    <tr class="grand-total-row">
                        <td class="label">Grand Total</td>
                        <td class="amount">₹${invoice.grand_total.toLocaleString('en-IN')}</td>
                    </tr>
                </table>
            </div>

            <div class="words-row">
                <div class="words-label">Amount in Words</div>
                <div class="words-text">${numberToIndianRupees(invoice.grand_total)}</div>
            </div>

            <div class="footer">
                <p>This is a computer generated invoice.</p>
                <p>Powered by Citrux Billing • www.citrux.in</p>
            </div>
        </div>
    </body>
    </html>
    `
}
