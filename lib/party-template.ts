
export const renderPartyHTML = (party: any, company: any) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Party Profile - ${party.name}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; background: #fff; }
            .header { border-bottom: 2px solid #7C5CFC; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .subtitle { font-size: 14px; color: #7C5CFC; font-weight: 600; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-size: 11px; text-transform: uppercase; color: #yyy; font-weight: bold; letter-spacing: 0.5px; }
            .value { font-size: 16px; font-weight: 500; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .footer { margin-top: 50px; font-size: 12px; color: #aaa; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">${party.name}</div>
            <div class="subtitle">New ${party.type} Profile</div>
        </div>

        <div class="grid">
            <div class="field">
                <div class="label">GSTIN</div>
                <div class="value">${party.gstin || '-'}</div>
            </div>
            <div class="field">
                <div class="label">PAN</div>
                <div class="value">${party.pan || '-'}</div>
            </div>
            <div class="field">
                <div class="label">Contact Email</div>
                <div class="value">${party.email || '-'}</div>
            </div>
            <div class="field">
                <div class="label">Phone</div>
                <div class="value">${party.phone || '-'}</div>
            </div>
            <div class="field">
                <div class="label">State</div>
                <div class="value">${party.state} (${party.state_code})</div>
            </div>
            <div class="field">
                <div class="label">City</div>
                <div class="value">${party.city || '-'}</div>
            </div>
            <div style="grid-column: 1 / -1; margin-top: 20px;">
                <div class="label">Full Address</div>
                <div class="value">${party.address || '-'}</div>
            </div>
        </div>

        <div class="footer">
            Created in CitruX Billing System on ${new Date().toLocaleString('en-IN')}
        </div>
    </body>
    </html>
    `
}
