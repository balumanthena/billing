import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        paddingTop: 30,
        paddingBottom: 60,
        paddingHorizontal: 40,
        lineHeight: 1.5,
        color: '#1a1a1a', // Darker grey for softer black
    },
    // Cover Page Styles
    coverPageContainer: {
        flex: 1,
        margin: 40,
        borderWidth: 2,
        borderColor: '#1e3a8a',
        padding: 40,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coverHeader: {
        marginTop: 60,
        alignItems: 'center',
    },
    coverTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#1e3a8a',
        marginBottom: 10,
        letterSpacing: 1,
    },
    coverSubtitle: {
        fontSize: 14,
        color: '#64748b', // Slate 500
        letterSpacing: 2,
    },
    coverBody: {
        alignItems: 'center',
        width: '100%',
    },
    coverSection: {
        marginVertical: 10,
        alignItems: 'center',
    },
    coverLabel: {
        fontSize: 9,
        color: '#94a3b8', // Slate 400
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 1,
    },
    coverValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a', // Slate 900
    },
    coverDivider: {
        width: 40,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },
    coverFooter: {
        marginBottom: 20,
        alignItems: 'center',
    },

    // Content Page Styles
    header: {
        position: 'absolute',
        top: 20,
        left: 40,
        right: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    section: {
        marginBottom: 16,
    },
    heading: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4,
        letterSpacing: 0.5,
    },
    text: {
        fontSize: 10,
        textAlign: 'justify',
        marginBottom: 6,
        color: '#334155', // Slate 700
    },
    bold: {
        fontWeight: 'bold',
        color: '#0f172a',
    },

    // List Styles
    list: {
        marginLeft: 10,
        marginBottom: 6,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    bullet: {
        width: 15,
        fontSize: 10,
        color: '#1e3a8a',
    },

    // Table Styles
    table: {
        width: '100%',
        marginVertical: 10,
        borderRadius: 4,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    tableHeaderCell: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    tableRowAlt: {
        backgroundColor: '#f8fafc',
    },
    col1: { width: '50%' },
    col2: { width: '25%' },
    col3: { width: '25%', textAlign: 'right' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },

    // Signatures
    signatureBlock: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        pageBreakInside: 'avoid',
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    signatureBox: {
        width: '45%',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#94a3b8',
        marginTop: 50,
        marginBottom: 5,
        borderStyle: 'dashed',
    },
    signatureRole: {
        fontSize: 9,
        fontStyle: 'italic',
        color: '#64748b',
    }
});

interface ServiceAgreementProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice: any;
    projectParams: {
        developerWebsite?: string;
        technologyStack?: string;
        totalPages?: string;
        monthlyTraffic?: string;
        blogLimit?: string;
        appointmentMode?: string;
        adminFeatures?: string;
        advancePercent?: string;
        milestonePercent?: string;
        finalPercent?: string;
        jurisdiction?: string;
        acceptancePeriod?: string;
        supportPeriod?: string;
        agreementVersion?: string;
    }
}

export const ServiceAgreementPDF = ({ invoice, projectParams }: ServiceAgreementProps) => {
    // 1. INPUT DATA MAPPING
    const developerName = invoice.company_snapshot?.name || 'Developer Name';
    const developerAddress = invoice.company_snapshot?.address || 'Developer Address';
    const developerGstin = invoice.company_snapshot?.gstin || 'N/A';

    const clientName = invoice.customer_snapshot?.name || 'Client Name';
    const clientAddress = invoice.customer_snapshot?.address || 'Client Address';

    const agreementDate = invoice.date ? format(new Date(invoice.date), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');
    const jurisdiction = projectParams.jurisdiction || invoice.company_snapshot?.state || 'India';

    // Fallback if jurisdiction is just a state
    const formattedJurisdiction = jurisdiction.includes(',') ? jurisdiction : `${jurisdiction}, India`;

    const advance = projectParams.advancePercent || '0';
    const milestone = projectParams.milestonePercent || '0';
    const final = projectParams.finalPercent || '0';

    const acceptanceDays = projectParams.acceptancePeriod || '7';
    const supportDays = projectParams.supportPeriod || '30';
    const version = projectParams.agreementVersion || '1.0';

    const services = invoice.invoice_items || [];
    const invoiceId = invoice.invoice_number || 'PENDING';

    const formatCurrency = (amount: number) => {
        return "Rs. " + amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <Document>
            {/* COVER PAGE */}
            <Page size="A4" style={{ padding: 0 }}>
                <View style={styles.coverPageContainer}>
                    {/* Header Section */}
                    <View style={styles.coverHeader}>
                        <Text style={styles.coverTitle}>SERVICE AGREEMENT</Text>
                        <Text style={styles.coverSubtitle}>PREPARED FOR {clientName.toUpperCase()}</Text>
                    </View>

                    {/* Middle Section */}
                    <View style={styles.coverBody}>
                        <View style={styles.coverSection}>
                            <Text style={styles.coverLabel}>Agreement Date</Text>
                            <Text style={styles.coverValue}>{agreementDate}</Text>
                        </View>

                        <View style={styles.coverSection}>
                            <Text style={styles.coverLabel}>Version</Text>
                            <Text style={styles.coverValue}>{version}</Text>
                        </View>

                        <View style={styles.coverDivider} />

                        <View style={styles.coverSection}>
                            <Text style={styles.coverLabel}>Service Provider</Text>
                            <Text style={styles.coverValue}>{developerName}</Text>
                        </View>

                        <View style={styles.coverSection}>
                            <Text style={styles.coverLabel}>Client</Text>
                            <Text style={styles.coverValue}>{clientName}</Text>
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View style={styles.coverFooter}>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>Reference ID: {invoiceId}</Text>
                    </View>
                </View>
            </Page>

            {/* CONTENT PAGES */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header} fixed>
                    <Text style={[styles.headerText, { fontWeight: 'bold', color: '#1e3a8a' }]}>SERVICE AGREEMENT</Text>
                    <Text style={styles.headerText}>{developerName}  |  {invoiceId}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Confidential & Proprietary</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} />
                </View>

                {/* 1. DEFINITIONS */}
                <View style={styles.section}>
                    <Text style={styles.heading}>1. Definitions & Interpretation</Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Agreement"</Text> shall mean this Service Agreement, including all schedules and the Invoice.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Developer"</Text> or "Service Provider" refers to {developerName}, providing the services.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Client"</Text> refers to {clientName}, the recipient of services.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Services"</Text> means the specific tasks and deliverables outlined in this Agreement and the corresponding Invoice.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Invoice"</Text> refers to Invoice ID {invoiceId}, which serves as the primary commercial document.
                    </Text>
                    <Text style={styles.text}>
                        In this Agreement, singular includes plural, and headings are for convenience only.
                    </Text>
                </View>

                {/* 2. PARTIES */}
                <View style={styles.section}>
                    <Text style={styles.heading}>2. Parties</Text>
                    <View style={{ marginBottom: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 }}>
                        <Text style={[styles.text, { marginBottom: 2 }]}>
                            <Text style={styles.bold}>The Developer:</Text> {developerName}
                        </Text>
                        <Text style={[styles.text, { marginBottom: 2, fontSize: 9, color: '#64748b' }]}>
                            Address: {developerAddress}
                        </Text>
                        <Text style={[styles.text, { fontSize: 9, color: '#64748b' }]}>
                            GSTIN: {developerGstin}
                        </Text>
                    </View>
                    <View style={{ padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 }}>
                        <Text style={[styles.text, { marginBottom: 2 }]}>
                            <Text style={styles.bold}>The Client:</Text> {clientName}
                        </Text>
                        <Text style={[styles.text, { fontSize: 9, color: '#64748b' }]}>
                            Address: {clientAddress}
                        </Text>
                    </View>
                </View>

                {/* 3. EFFECTIVE DATE */}
                <View style={styles.section}>
                    <Text style={styles.heading}>3. Effective Date & Term</Text>
                    <Text style={styles.text}>
                        This Agreement shall commence on <Text style={styles.bold}>{agreementDate}</Text> ("Effective Date") and shall remain valid until the completion of the Services or termination by either Party in accordance with this Agreement.
                    </Text>
                </View>

                {/* 4. SCOPE OF SERVICES */}
                <View style={styles.section}>
                    <Text style={styles.heading}>4. Scope of Services</Text>
                    <Text style={styles.text}>The Developer agrees to provide the following Services to the Client:</Text>

                    {/* CUSTOM TABLE */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={styles.col1}><Text style={styles.tableHeaderCell}>Service Description</Text></View>
                            <View style={styles.col2}><Text style={styles.tableHeaderCell}>SAC/HSN</Text></View>
                            <View style={styles.col3}><Text style={styles.tableHeaderCell}>GST Rate</Text></View>
                        </View>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {services.map((item: any, index: number) => (
                            <View style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]} key={index}>
                                <View style={styles.col1}>
                                    <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 2 }]}>{item.item_id || 'Service'}</Text>
                                    <Text style={[styles.text, { fontSize: 9, color: '#64748b' }]}>{item.description}</Text>
                                </View>
                                <View style={styles.col2}><Text style={styles.text}>{item.sac_code || 'N/A'}</Text></View>
                                <View style={styles.col3}><Text style={styles.text}>{item.tax_rate}%</Text></View>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.text, { fontStyle: 'italic', color: '#64748b', fontSize: 9 }]}>
                        * Any service not expressly stated herein shall be deemed excluded from the scope and requires separate approval.
                    </Text>
                </View>

                {/* 5. PROJECT SPECIFICATIONS */}
                {(projectParams.technologyStack || projectParams.totalPages || projectParams.adminFeatures) && (
                    <View style={styles.section}>
                        <Text style={styles.heading}>5. Project Specifications</Text>
                        <View style={styles.list}>
                            {projectParams.technologyStack && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Technology Stack:</Text> {projectParams.technologyStack}</Text>
                                </View>
                            )}
                            {projectParams.totalPages && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Estimated Scope:</Text> {projectParams.totalPages}</Text>
                                </View>
                            )}
                            {projectParams.appointmentMode && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Workflow:</Text> {projectParams.appointmentMode}</Text>
                                </View>
                            )}
                            {projectParams.adminFeatures && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Admin Capabilities:</Text> {projectParams.adminFeatures}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* 6. ROLES & RESPONSIBILITIES */}
                <View style={styles.section}>
                    <Text style={styles.heading}>6. Roles & Responsibilities</Text>

                    <Text style={[styles.text, styles.bold, { color: '#1e3a8a', marginTop: 4 }]}>Developer Responsibilities:</Text>
                    <View style={styles.list}>
                        <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.text}>Deliver services professionally and in accordance with industry standards.</Text></View>
                        <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.text}>Deploy deliverables to the Client's infrastructure upon receipt of final payment.</Text></View>
                    </View>

                    <Text style={[styles.text, styles.bold, { color: '#1e3a8a', marginTop: 4 }]}>Client Responsibilities:</Text>
                    <View style={styles.list}>
                        <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.text}>Provide necessary content, approvals, and access credentials in a timely manner.</Text></View>
                        <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.text}>Make payments strictly according to the Commercial Terms.</Text></View>
                    </View>
                    <Text style={[styles.text, { marginTop: 4 }]}>Delays caused by the Client regarding content or approvals shall extend the project timeline accordingly.</Text>
                </View>

                {/* 7. DELIVERY & ACCEPTANCE */}
                <View style={styles.section}>
                    <Text style={styles.heading}>7. Delivery, Acceptance & Sign-off</Text>
                    <Text style={styles.text}>
                        The Client shall have a period of <Text style={styles.bold}>{acceptanceDays} working days</Text> ("Acceptance Period") to review the deliverables. If no written objection is raised within this period, the deliverables shall be deemed accepted. Minor change requests shall not withhold the final payment or sign-off.
                    </Text>
                </View>

                {/* 8. TECH */}
                <View style={styles.section}>
                    <Text style={styles.heading}>8. Technology Stack & Scalability</Text>
                    <Text style={styles.text}>
                        Services are delivered using modern, scalable platforms. Based on current requirements, existing infrastructure is sufficient at delivery. Future upgrades due to increased usage or scope may be implemented without redevelopment and shall be commercially separate.
                    </Text>
                </View>

                {/* 9. THIRD PARTY */}
                <View style={styles.section}>
                    <Text style={styles.heading}>9. Third-Party Services</Text>
                    <Text style={styles.text}>
                        The Services may rely on third-party platforms, APIs, or hosting providers. The Developer is not liable for any downtime, policy changes, or service failures caused by such third-party providers.
                    </Text>
                </View>

                {/* 10. DATA */}
                <View style={styles.section}>
                    <Text style={styles.heading}>10. Data, Content & Compliance</Text>
                    <Text style={styles.text}>
                        The Client is solely responsible for all content published or used. No sensitive personal data shall be stored unless explicitly agreed. The Developer is not liable for specific regulatory compliance (e.g., medical or financial regulations) unless strictly scoped.
                    </Text>
                </View>

                {/* 11. COMMERCIAL TERMS */}
                <View style={styles.section}>
                    <Text style={styles.heading}>11. Commercial Terms & Payment</Text>
                    <View style={{ backgroundColor: '#f0f9ff', padding: 10, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: '#bae6fd' }}>
                        <Text style={[styles.text, { fontSize: 12, textAlign: 'center' }]}>
                            Total Project Value: <Text style={[styles.bold, { color: '#0369a1' }]}>{formatCurrency(invoice.grand_total)}</Text>
                        </Text>
                        <Text style={{ fontSize: 8, textAlign: 'center', color: '#0ea5e9' }}>(Inclusive of GST)</Text>
                    </View>

                    <Text style={styles.text}>Payment Structure:</Text>
                    <View style={styles.list}>
                        <View style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.text}><Text style={styles.bold}>{advance}% Advance</Text> (Non-refundable upon project commencement).</Text>
                        </View>
                        {(milestone && milestone !== '0') && (
                            <View style={styles.listItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.text}><Text style={styles.bold}>{milestone}% Milestone</Text> after milestone completion.</Text>
                            </View>
                        )}
                        <View style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.text}><Text style={styles.bold}>{final}% Final</Text> before final deployment/handover.</Text>
                        </View>
                    </View>
                    <Text style={styles.text}>The Invoice shall govern the specific taxation and payment details.</Text>
                </View>

                {/* 12. TAXATION */}
                <View style={styles.section}>
                    <Text style={styles.heading}>12. Taxation (GST)</Text>
                    <Text style={styles.text}>
                        Goods and Services Tax (GST) is applicable as per Indian law and is reflected in the Invoice.
                    </Text>
                </View>

                {/* 13. IP */}
                <View style={styles.section}>
                    <Text style={styles.heading}>13. Intellectual Property</Text>
                    <Text style={styles.text}>
                        Upon full payment, ownership of specific deliverables transfers to the Client. The Developer retains rights to reusable code libraries, generic components, and the right to showcase the work in their portfolio.
                    </Text>
                </View>

                {/* 14. SUPPORT */}
                <View style={styles.section}>
                    <Text style={styles.heading}>14. Support & Maintenance</Text>
                    <Text style={styles.text}>
                        The Developer provides a <Text style={styles.bold}>{supportDays}-day limited support period</Text> for bug fixes related to the original scope. No Annual Maintenance Contract (AMC) is included unless separately contracted.
                    </Text>
                </View>

                {/* 15. CONFIDENTIALITY */}
                <View style={styles.section}>
                    <Text style={styles.heading}>15. Confidentiality</Text>
                    <Text style={styles.text}>
                        Both Parties agree to maintain the confidentiality of proprietary information and shall not disclose it to any third party without prior written consent, except as required by law.
                    </Text>
                </View>

                {/* 16. TERMINATION */}
                <View style={styles.section}>
                    <Text style={styles.heading}>16. Termination</Text>
                    <Text style={styles.text}>
                        Either Party may terminate this Agreement with written notice. In the event of termination, the Advance is non-refundable. The Client is liable to pay for all work completed up to the date of termination. No ownership rights transfer until full payment is made.
                    </Text>
                </View>

                {/* 17. FORCE MAJEURE */}
                <View style={styles.section}>
                    <Text style={styles.heading}>17. Force Majeure</Text>
                    <Text style={styles.text}>
                        Neither Party shall be liable for any failure or delay in performance due to causes beyond their reasonable control (e.g., natural disasters, internet outages, acts of government).
                    </Text>
                </View>

                {/* 18. LIABILITY */}
                <View style={styles.section}>
                    <Text style={styles.heading}>18. Limitation of Liability</Text>
                    <Text style={styles.text}>
                        The Developer's total liability under this Agreement shall be limited to the total professional fees paid by the Client. The Developer shall not be liable for any indirect, consequential, or incidental damages.
                    </Text>
                </View>

                {/* 19. GOVERNING LAW */}
                <View style={styles.section}>
                    <Text style={styles.heading}>19. Governing Law & Jurisdiction</Text>
                    <Text style={styles.text}>
                        This Agreement shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in <Text style={styles.bold}>{formattedJurisdiction}</Text>.
                    </Text>
                </View>

                {/* 20. ENTIRE AGREEMENT */}
                <View style={styles.section}>
                    <Text style={styles.heading}>20. Entire Agreement</Text>
                    <Text style={styles.text}>
                        This Agreement, along with the Invoice, constitutes the entire understanding between the Parties and supersedes all prior communications. Amendments must be in writing and signed by both Parties.
                    </Text>
                </View>

                {/* 21. SIGNATURES */}
                <View style={styles.section} break={false}>
                    <Text style={styles.heading}>21. Acceptance & Signatures</Text>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureBox}>
                            <Text style={[styles.text, styles.bold]}>Signed for the Developer:</Text>
                            <Text style={styles.text}>{developerName}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureRole}>Authorized Signatory</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={[styles.text, styles.bold]}>Signed for the Client:</Text>
                            <Text style={styles.text}>{clientName}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureRole}>Authorized Signatory</Text>
                        </View>
                    </View>
                </View>

            </Page>
        </Document>
    );
};
