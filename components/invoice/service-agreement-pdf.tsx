import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        paddingTop: 60, // Increased top padding
        paddingBottom: 60, // Increased bottom padding
        paddingHorizontal: 60, // Increased side margins
        lineHeight: 1.5,
        color: '#222', // Softer black for professional look
    },
    // Cover Page Styles
    coverPageContainer: {
        flex: 1,
        margin: 20,
        borderWidth: 1, // Double border effect can be nice, but simple is better
        borderColor: '#000000',
        padding: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 30, // More space
        textAlign: 'center',
        color: '#000',
        letterSpacing: 1,
    },
    coverSubtitle: {
        fontSize: 16,
        marginBottom: 60,
        textAlign: 'center',
        color: '#444',
    },
    coverSection: {
        marginBottom: 25,
        alignItems: 'center',
    },
    coverLabel: {
        fontSize: 9,
        color: '#666',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    coverValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },

    // Header/Footer
    header: {
        position: 'absolute',
        top: 25,
        left: 60,
        right: 60,
        borderBottomWidth: 0.5,
        borderBottomColor: '#999',
        paddingBottom: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#888',
    },
    footer: {
        position: 'absolute',
        bottom: 45, // Moved up to ensure visibility
        left: 60,
        right: 60,
        borderTopWidth: 0.5,
        borderTopColor: '#999',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align vertically
        fontSize: 8,
        color: '#444', // Darker for better visibility
    },

    // Content
    section: {
        marginBottom: 20, // Better separation between clauses
    },
    heading: {
        fontSize: 11,
        fontWeight: 'bold', // Standard bold for Helvetica
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 5,
        color: '#000',
        letterSpacing: 0.5,
        // textDecoration: 'underline', // Removed for modern look
    },
    text: {
        fontSize: 10,
        textAlign: 'justify',
        marginBottom: 8,
        color: '#222',
        lineHeight: 1.6,
    },
    bold: {
        fontWeight: 'bold',
        color: '#000',
    },

    // Lists
    list: {
        marginLeft: 20,
        marginBottom: 10,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    bullet: {
        width: 20,
        fontSize: 10,
        color: '#444',
    },

    // Tables
    table: {
        width: '100%',
        marginVertical: 15,
        borderWidth: 0.5,
        borderColor: '#ccc',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableCell: {
        fontSize: 9,
        color: '#333',
    },
    col1: { width: '50%' },
    col2: { width: '25%' },
    col3: { width: '25%', textAlign: 'right' },

    // Financial Box
    financialBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        marginVertical: 15,
        backgroundColor: '#fafafa',
        borderRadius: 2,
    },

    // Signatures
    signatureBlock: {
        marginTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        pageBreakInside: 'avoid',
    },
    signatureBox: {
        width: '48%', // Increased from 40% to 48% to prevent wrapping
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginTop: 50,
        marginBottom: 8,
    }
});

interface ServiceAgreementProps {
    invoice: any;
    // We expect the 'invoice' object to contain all necessary data structure
}

export const ServiceAgreementPDF = ({ invoice }: ServiceAgreementProps) => {

    // 1. DATA EXTRACTION
    const agreementType = "MASTER SERVICES AGREEMENT"; // Fixed or from input? Prompt says {{agreement_type}} input. defaulting.
    const agreementDate = invoice.date ? format(new Date(invoice.date), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy');
    const version = invoice.project_settings?.agreementVersion || '1.0';
    const invoiceId = invoice.invoice_number || invoice.agreement_number || 'DRAFT';

    // Parties
    const developerName = invoice.company_snapshot?.name || 'Developer Name';
    const developerAddress = invoice.company_snapshot?.address || '';
    const developerGstin = invoice.company_snapshot?.gstin || '';

    const clientName = invoice.customer_snapshot?.name || 'Client Name';
    const clientAddress = invoice.customer_snapshot?.address || '';

    // Commercials
    const grandTotal = invoice.grand_total || 0;
    const advancePercent = invoice.project_settings?.advancePercent || '0';
    const milestonePercent = invoice.project_settings?.milestonePercent || '0';
    const finalPercent = invoice.project_settings?.finalPercent || '0';

    // Services
    // Prefer services_snapshot, fallback to invoice_items
    const services = invoice.services_snapshot || invoice.invoice_items || [];

    // Clauses
    const clauses = invoice.project_settings?.clauses || [];
    const getClause = (key: string) => clauses.find((c: any) => c.clause_key === key);
    const isClauseEnabled = (key: string) => {
        const c = getClause(key);
        return c?.enabled === true;
    };
    const getClauseText = (key: string) => {
        const c = getClause(key);
        return c?.text || '';
    };

    const jurisdiction = invoice.project_settings?.jurisdiction || invoice.company_snapshot?.state || 'India';
    const formattedJurisdiction = jurisdiction.includes(',') ? jurisdiction : `${jurisdiction}, India`;

    const formatCurrency = (amount: number) => {
        return "Rs. " + amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Contact Info (Footer)
    const companyWebsite = invoice.project_settings?.companyWebsite || 'www.citrux.in';
    const companyEmail = invoice.project_settings?.companyEmail || 'info@citrux.in';
    // const companyPhone = invoice.project_settings?.companyPhone || ''; // Not used in footer yet

    return (
        <Document>
            {/* TITLE PAGE */}
            <Page size="A4" style={{ padding: 0 }}>
                <View style={styles.coverPageContainer}>
                    <Text style={styles.coverTitle}>{agreementType}</Text>

                    <View style={styles.coverSection}>
                        <Text style={styles.coverLabel}>AGREEMENT DATE</Text>
                        <Text style={styles.coverValue}>{agreementDate}</Text>
                    </View>

                    <View style={styles.coverSection}>
                        <Text style={styles.coverLabel}>VERSION</Text>
                        <Text style={styles.coverValue}>{version}</Text>
                    </View>

                    <View style={styles.coverSection}>
                        <Text style={styles.coverLabel}>REFERENCE ID</Text>
                        <Text style={styles.coverValue}>{invoiceId}</Text>
                    </View>

                    <View style={{ height: 40 }} />

                    <View style={styles.coverSection}>
                        <Text style={styles.coverLabel}>BETWEEN</Text>
                        <Text style={[styles.coverValue, { fontSize: 18 }]}>{developerName}</Text>
                        <Text style={{ fontSize: 10, marginTop: 4 }}>AND</Text>
                        <Text style={[styles.coverValue, { fontSize: 18, marginTop: 4 }]}>{clientName}</Text>
                    </View>
                </View>
            </Page>

            {/* CONTENT */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header} fixed>
                    <Text>{agreementType}</Text>
                    <Text>{invoiceId}</Text>
                </View>

                {/* 1. DEFINITIONS */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>1. DEFINITIONS & INTERPRETATION</Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Agreement"</Text> means this {agreementType}, including all schedules, annexures, and the Invoice.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Services"</Text> means the scope of work defined in Section 4 and the detailed line items in the Invoice.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Deliverables"</Text> means all software, designs, documentation, and other materials developed by the Developer for the Client.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>"Effective Date"</Text> means the date specified on the Title Page.
                    </Text>
                </View>

                {/* 2. PARTIES */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>2. PARTIES</Text>
                    <Text style={styles.text}>This Agreement is entered into by and between:</Text>

                    <View style={{ marginLeft: 10, marginTop: 5 }}>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>DEVELOPER:</Text> {developerName}, located at {developerAddress} (GSTIN: {developerGstin}).
                        </Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>CLIENT:</Text> {clientName}, located at {clientAddress}.
                        </Text>
                    </View>
                </View>

                {/* 3. EFFECTIVE DATE & TERM */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>3. EFFECTIVE DATE & TERM</Text>
                    <Text style={styles.text}>
                        This Agreement shall commence on the Effective Date ({agreementDate}) and shall continue until the completion of the Services, unless terminated earlier in accordance with the provisions of this Agreement.
                    </Text>
                </View>

                {/* 4. SCOPE OF SERVICES */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>4. SCOPE OF SERVICES</Text>
                    <Text style={styles.text}>The Developer shall provide the following Services:</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={styles.col1}><Text style={[styles.tableCell, styles.bold]}>Service / Item</Text></View>
                            <View style={styles.col2}><Text style={[styles.tableCell, styles.bold]}>HSN/SAC</Text></View>
                            <View style={styles.col3}><Text style={[styles.tableCell, styles.bold, { textAlign: 'right' }]}>Rate</Text></View>
                        </View>
                        {services.map((s: any, i: number) => (
                            <View style={styles.tableRow} key={i}>
                                <View style={styles.col1}><Text style={styles.tableCell}>{s.description || s.item_id}</Text></View>
                                <View style={styles.col2}><Text style={styles.tableCell}>{s.sac_code || '-'}</Text></View>
                                <View style={styles.col3}><Text style={[styles.tableCell, { textAlign: 'right' }]}>{s.tax_rate}%</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 5. PROJECT SPECIFICATIONS */}
                {/* Only include if present in project_settings */}
                {invoice.project_settings?.technologyStack || invoice.project_settings?.totalPages ? (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>5. PROJECT SPECIFICATIONS</Text>
                        <View style={styles.list}>
                            {invoice.project_settings?.technologyStack && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Technology Stack:</Text> {invoice.project_settings.technologyStack}</Text>
                                </View>
                            )}
                            {invoice.project_settings?.totalPages && (
                                <View style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.text}><Text style={styles.bold}>Estimated Volume:</Text> {invoice.project_settings.totalPages}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}

                {/* 6. ROLES & RESPONSIBILITIES (Conditional) */}
                {isClauseEnabled('client_responsibilities') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>6. ROLES & RESPONSIBILITIES</Text>
                        <Text style={styles.text}>{getClauseText('client_responsibilities')}</Text>
                    </View>
                )}

                {/* 7. DELIVERY, ACCEPTANCE & SIGN-OFF (Conditional) */}
                {isClauseEnabled('acceptance_period') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>7. DELIVERY, ACCEPTANCE & SIGN-OFF</Text>
                        <Text style={styles.text}>{getClauseText('acceptance_period')}</Text>
                    </View>
                )}

                {/* 8. TECHNOLOGY STACK & SCALABILITY */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>8. TECHNOLOGY STACK & SCALABILITY</Text>
                    <Text style={styles.text}>
                        Unless otherwise specified, services are delivered using modern, industry-standard technology suitable for the Client's current requirements. Future scalability or feature enhancements beyond the initial Scope of Services shall be treated as a Change Order.
                    </Text>
                </View>

                {/* 9. THIRD-PARTY SERVICES (Conditional) */}
                {isClauseEnabled('third_party_services') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>9. THIRD-PARTY SERVICES</Text>
                        <Text style={styles.text}>{getClauseText('third_party_services')}</Text>
                    </View>
                )}

                {/* 10. DATA, CONTENT & COMPLIANCE (Conditional) */}
                {isClauseEnabled('data_handling') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>10. DATA, CONTENT & COMPLIANCE</Text>
                        <Text style={styles.text}>{getClauseText('data_handling')}</Text>
                    </View>
                )}

                {/* 11. COMMERCIAL TERMS & PAYMENT */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>11. COMMERCIAL TERMS & PAYMENT</Text>
                    <View style={styles.financialBox}>
                        <Text style={[styles.text, { textAlign: 'center' }]}>
                            TOTAL PROJECT VALUE: <Text style={styles.bold}>{formatCurrency(grandTotal)}</Text>
                        </Text>
                        <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 2 }}>(Inclusive of GST)</Text>
                    </View>
                    <Text style={styles.text}>The Client agrees to pay the Developer as follows:</Text>
                    <View style={styles.list}>
                        <View style={styles.listItem}>
                            <Text style={styles.bullet}>1.</Text>
                            <Text style={styles.text}><Text style={styles.bold}>{advancePercent}% Advance Payment</Text> upon signing of this Agreement.</Text>
                        </View>
                        {milestonePercent !== '0' && (
                            <View style={styles.listItem}>
                                <Text style={styles.bullet}>2.</Text>
                                <Text style={styles.text}><Text style={styles.bold}>{milestonePercent}% Milestone Payment</Text> upon completion of agreed milestones.</Text>
                            </View>
                        )}
                        <View style={styles.listItem}>
                            <Text style={styles.bullet}>{milestonePercent !== '0' ? '3.' : '2.'}</Text>
                            <Text style={styles.text}><Text style={styles.bold}>{finalPercent}% Final Payment</Text> prior to final handover/deployment.</Text>
                        </View>
                    </View>
                </View>

                {/* 12. TAXATION (GST) */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>12. TAXATION (GST)</Text>
                    <Text style={styles.text}>
                        All fees quoted are exclusive of Goods and Services Tax (GST) unless explicitly stated otherwise. GST shall be charged at the applicable rate (currently 18%) on all invoices.
                    </Text>
                </View>

                {/* 13. INTELLECTUAL PROPERTY */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>13. INTELLECTUAL PROPERTY</Text>
                    <Text style={styles.text}>
                        Upon receipt of full payment, the Developer grants the Client ownership of the Deliverables. The Developer retains ownership of its pre-existing intellectual property, reusable code, tools, and methodologies used in creating the Deliverables.
                    </Text>
                </View>

                {/* 14. SUPPORT & MAINTENANCE (Conditional) */}
                {isClauseEnabled('support_clause') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>14. SUPPORT & MAINTENANCE</Text>
                        <Text style={styles.text}>{getClauseText('support_clause')}</Text>
                    </View>
                )}

                {/* 15. CONFIDENTIALITY (Conditional) */}
                {isClauseEnabled('confidentiality') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>15. CONFIDENTIALITY</Text>
                        <Text style={styles.text}>{getClauseText('confidentiality')}</Text>
                    </View>
                )}

                {/* 16. TERMINATION */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>16. TERMINATION</Text>
                    <Text style={styles.text}>
                        Either Party may terminate this Agreement for material breach by the other Party upon 30 days' written notice, provided the breach is not cured within the notice period. In the event of termination, the Client shall pay for all Services performed up to the termination date.
                    </Text>
                </View>

                {/* 17. FORCE MAJEURE (Conditional) */}
                {isClauseEnabled('force_majeure') && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.heading}>17. FORCE MAJEURE</Text>
                        <Text style={styles.text}>{getClauseText('force_majeure')}</Text>
                    </View>
                )}

                {/* 18. LIMITATION OF LIABILITY */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>18. LIMITATION OF LIABILITY</Text>
                    <Text style={styles.text}>
                        Except for confidentiality obligations, the Developer's total liability under this Agreement shall not exceed the total fees actually paid by the Client. Neither Party shall be liable for indirect, incidental, or consequential damages.
                    </Text>
                </View>

                {/* 19. GOVERNING LAW & JURISDICTION */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>19. GOVERNING LAW & JURISDICTION</Text>
                    <Text style={styles.text}>
                        This Agreement shall be governed by the laws of India. The courts of <Text style={styles.bold}>{formattedJurisdiction}</Text> shall have exclusive jurisdiction over any disputes arising out of this Agreement.
                    </Text>
                </View>

                {/* 20. ENTIRE AGREEMENT */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>20. ENTIRE AGREEMENT</Text>
                    <Text style={styles.text}>
                        This Agreement constitutes the entire agreement between the Parties and supersedes all prior agreements, understandings, or representations. No amendment shall be binding unless in writing and signed by both Parties.
                    </Text>
                </View>

                {/* 21. ACCEPTANCE & SIGNATURES */}
                <View style={styles.section} break={false} wrap={false}>
                    <Text style={styles.heading}>21. ACCEPTANCE & SIGNATURES</Text>
                    <Text style={styles.text}>
                        IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.
                    </Text>

                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.bold}>Signed for: {developerName}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={{ fontSize: 8 }}>Name & Designation</Text>
                        </View>

                        <View style={styles.signatureBox}>
                            <Text style={styles.bold}>Signed for: {clientName}</Text>
                            <View style={styles.signatureLine} />
                            <Text style={{ fontSize: 8 }}>Name & Designation</Text>
                        </View>
                    </View>
                </View>

                {/* Footer on each page */}
                <View style={styles.footer} fixed>
                    <Text style={{ width: '30%' }}>{version} | Confidential</Text>
                    <View style={{ width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Link src={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`} style={{ textDecoration: 'none', color: '#444' }}>{companyWebsite}</Link>
                        <Text> | </Text>
                        <Link src={`mailto:${companyEmail}`} style={{ textDecoration: 'none', color: '#444' }}>{companyEmail}</Link>
                    </View>
                    <Text style={{ width: '30%', textAlign: 'right' }} render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} />
                </View>

            </Page>
        </Document>
    );
};
