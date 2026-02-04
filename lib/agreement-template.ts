import { numberToIndianRupees } from './number-utils'

export const renderAgreementHTML = (agreement: any, party: any, company: any) => {
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Agreement ${agreement.id}</title>
        <style>
             @page { size: A4; margin: 0; }
             body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 50px; color: #111; line-height: 1.6; font-size: 14px; }
             .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px; }
             .logo-img { height: 50px; width: auto; margin-bottom: 10px; }
             .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
             .doc-title { font-size: 24px; font-weight: 700; margin-top: 10px; }
             .meta { font-size: 12px; color: #666; margin-bottom: 5px; }
             
             .content { text-align: justify; }
             .section { margin-bottom: 25px; }
             .section-title { font-weight: 700; margin-bottom: 8px; text-transform: uppercase; font-size: 13px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 3px; display: inline-block; }
             
             .signature-block { display: flex; justify-content: space-between; margin-top: 80px; }
             .sign-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; }
             .sign-label { font-size: 12px; color: #666; margin-top: 5px; }
             
             .highlight { font-weight: 700; }
             ul { margin: 5px 0 0 20px; padding: 0; }
             li { margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="${logoUrl}" class="logo-img" alt="${company?.name}" />
            <div class="company-name">${company?.name}</div>
            <div class="meta">${company?.address || 'Registered Office'}</div>
            <div class="doc-title">MASTER SERVICE AGREEMENT</div>
            <div class="meta">Agreement Ref: #${agreement.agreement_number || agreement.id.substring(0, 8)}</div>
        </div>

        <div class="content">
            <p>This Agreement is executed on <strong>${new Date(agreement.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> by and between:</p>

            <div class="section">
                <p><strong>${company?.name}</strong>, with its principal place of business at ${company?.address || ''}, herein referred to as the <strong>"Service Provider"</strong>.</p>
                <p style="text-align:center; font-weight:bold; margin: 10px 0;">AND</p>
                <p><strong>${party?.name}</strong>, with its principal place of business at ${party?.address || ''}, herein referred to as the <strong>"Client"</strong>.</p>
            </div>

            <div class="section">
                <div class="section-title">1. SCOPE OF SERVICES</div>
                <p>The Service Provider agrees to deliver the services as defined in the associated Project Settings and Proposal:</p>
                <ul>
                    ${agreement.project_settings?.repository ? `<li><strong>Code Repository:</strong> ${agreement.project_settings.repository}</li>` : ''}
                    ${agreement.project_settings?.deadline ? `<li><strong>Deadline:</strong> ${agreement.project_settings.deadline}</li>` : ''}
                    <li>All services listed in standard service catalog as per Invoice terms.</li>
                </ul>
            </div>

            <div class="section">
                <div class="section-title">2. CONTRACT VALUE</div>
                <p>The total consideration for this Agreement is <strong>₹${agreement.grand_total?.toLocaleString('en-IN')}</strong>.</p>
                <p>(In words: <em>${numberToIndianRupees(agreement.grand_total)}</em>)</p>
                <p>Tax Mode: ${agreement.tax_mode} (GST applicable as per norms).</p>
            </div>

            <div class="section">
                <div class="section-title">3. TERMS OF ENGAGEMENT</div>
                <p>This agreement shall remain effective until the completion of the scope of work. Confidentiality and Intellectual Property rights shall be governed by the standard terms of the Service Provider.</p>
            </div>
            
            <div class="signature-block">
                <div class="sign-box">
                    <div class="highlight">For ${company?.name}</div>
                    <div class="sign-label">(Authorized Signatory)</div>
                </div>
                <div class="sign-box">
                    <div class="highlight">For ${party?.name}</div>
                    <div class="sign-label">(Authorized Signatory)</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}
