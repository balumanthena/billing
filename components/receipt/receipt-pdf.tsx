/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { amountToWords } from '@/lib/number-to-words';

// Register Fonts
Font.register({
    family: 'Helvetica-Bold',
    src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf'
});
Font.register({
    family: 'Helvetica',
    src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf'
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        padding: 0,
    },

    // --- Header (Slim ERP Style) ---
    headerContainer: {
        width: '100%',
        height: 52, // Fixed height: 52px
        backgroundColor: '#0F172A', // Slate 900
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32, // px-8
    },
    headerLogo: {
        height: 32,  // Fits nicely in 52px header
        width: 'auto',
        objectFit: 'contain',
    },
    headerCompanyName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    headerWebsite: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 9,
        fontWeight: 'bold',
    },

    // --- Main Body ---
    main: {
        padding: 40,
        flex: 1,
    },

    // --- Top Section: Identity & Metadata ---
    topSection: {
        flexDirection: 'row',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9', // slate-100
        paddingBottom: 30, // pb-8
    },
    colLeft: {
        width: '55%',
        paddingRight: 20,
    },
    colRight: {
        width: '45%',
    },

    // Identity Typography
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#0F172A',
        marginBottom: 8,
    },
    companyDetail: {
        fontSize: 10,
        color: '#64748B', // slate-500
        marginBottom: 2,
    },
    labelBold: {
        fontWeight: 'bold',
        color: '#334155', // slate-700
    },

    // Metadata Typography
    receiptTitle: {
        fontSize: 18, // Reduced size to prevent wrapping
        fontWeight: 'light',
        color: '#94A3B8', // slate-400
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'right',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#F8FAFC',
        paddingBottom: 4,
        marginBottom: 8,
    },
    metaLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metaValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'right',
    },

    // --- Middle Section: Recipient & Context ---
    gridSection: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    gridColLeft: {
        width: '50%',
        paddingRight: 10,
    },
    gridColRight: {
        width: '50%',
        paddingLeft: 10,
        alignItems: 'flex-end',
    },

    sectionHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10,
    },

    recipientBox: {
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#F1F5F9',
    },
    recipientName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    recipientDetail: {
        fontSize: 10,
        color: '#475569',
        marginBottom: 2,
    },

    contextRow: {
        flexDirection: 'row',
        marginBottom: 6,
        justifyContent: 'flex-end',
    },
    contextLabel: {
        fontSize: 10,
        color: '#64748B',
        marginRight: 8,
    },
    contextValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A',
        textTransform: 'capitalize',
    },

    // --- Amount Section ---
    amountContainer: {
        marginTop: 20,
        backgroundColor: '#FFFFFF', // Pure White - Fixes blue patch issue
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        paddingVertical: 35,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    amountTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10,
    },
    amountValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
        // No margin, relying on spacer
    },
    amountWords: {
        fontSize: 12,
        fontFamily: 'Times-Roman',
        fontStyle: 'italic',
        color: '#475569',
        textTransform: 'capitalize',
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // --- Footer ---
    footer: {
        marginTop: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9', // slate-100
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    footerLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        // Removed background color for cleaner look
        paddingVertical: 2,
        paddingHorizontal: 0,
        marginBottom: 6,
    },
    verifiedText: {
        color: '#15803D', // green-700
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footerWebsite: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: 'bold',
        marginLeft: 0, // Aligned with badge text
    },
    legalText: {
        fontSize: 8,
        color: '#94A3B8', // slate-400
        textAlign: 'right',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // --- Watermark ---
    watermarkContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    watermarkImage: {
        width: 300,
        opacity: 0.06,
    }
});

interface ReceiptPDFProps {
    payment: any;
    invoice: any;
    company: any;
    customer: any;
}

export const ReceiptPDF = ({ payment, invoice, company, customer }: ReceiptPDFProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark */}
                {company?.logo_url && (
                    <View style={styles.watermarkContainer}>
                        <Image
                            src={company.logo_url}
                            style={styles.watermarkImage}
                        />
                    </View>
                )}

                {/* Header */}
                <View style={styles.headerContainer}>
                    {company?.logo_url ? (
                        <Image
                            src={company.logo_url}
                            style={styles.headerLogo}
                        />
                    ) : (
                        <Text style={styles.headerCompanyName}>{company?.name || 'Company Name'}</Text>
                    )}
                    <Text style={styles.headerWebsite}>{company?.website || 'www.citrux.in'}</Text>
                </View>

                {/* Main Content */}
                <View style={styles.main}>

                    {/* Top Section */}
                    <View style={styles.topSection}>
                        <View style={styles.colLeft}>
                            <Text style={styles.companyName}>{company?.name || 'Company Name'}</Text>
                            <Text style={styles.companyDetail}>{company?.address}</Text>
                            <Text style={styles.companyDetail}>{company?.state} {company?.state_code && `(${company.state_code})`}</Text>
                            <Text style={styles.companyDetail}>
                                <Text style={styles.labelBold}>GSTIN:</Text> {company?.gstin}
                            </Text>
                            {(company?.email || company?.phone) && (
                                <Text style={[styles.companyDetail, { fontStyle: 'italic', marginTop: 2, opacity: 0.9 }]}>
                                    {company?.email} • {company?.phone}
                                </Text>
                            )}
                        </View>

                        <View style={styles.colRight}>
                            <Text style={styles.receiptTitle}>Payment Receipt</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Receipt No</Text>
                                <Text style={styles.metaValue}>{payment.receipt_number || 'PENDING'}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Date</Text>
                                <Text style={styles.metaValue}>{format(new Date(payment.payment_date), 'dd MMM yyyy')}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Reference</Text>
                                <Text style={styles.metaValue}>{payment.reference_id || '-'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Middle Section */}
                    <View style={styles.gridSection}>
                        <View style={styles.gridColLeft}>
                            <Text style={styles.sectionHeader}>Received From</Text>
                            <View style={styles.recipientBox}>
                                <Text style={styles.recipientName}>{customer?.name}</Text>
                                <Text style={styles.recipientDetail}>{customer?.address}</Text>
                                <Text style={styles.recipientDetail}>
                                    <Text style={{ fontSize: 8, textTransform: 'uppercase', color: '#94A3B8' }}>GSTIN:</Text> {customer?.gstin || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.gridColRight}>
                            <Text style={styles.sectionHeader}>Payment Context</Text>
                            <View style={styles.contextRow}>
                                <Text style={styles.contextLabel}>Payment Mode:</Text>
                                <Text style={styles.contextValue}>{payment.mode}</Text>
                            </View>
                            <View style={styles.contextRow}>
                                <Text style={styles.contextLabel}>Against Invoice:</Text>
                                <Text style={styles.contextValue}>{invoice.invoice_number}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Amount Box */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountTitle}>Amount Received</Text>

                        <Text style={styles.amountValue}>
                            ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>

                        <View style={{ height: 20 }} />

                        <Text style={styles.amountWords}>
                            {amountToWords(payment.amount)}
                        </Text>

                        <Text style={{ marginTop: 8, fontSize: 8, fontStyle: 'italic', color: '#64748B' }}>
                            * Amount received excludes TDS deducted by the client as per Income Tax Act.
                        </Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>Payment Verified</Text>
                            </View>
                            <Text style={styles.footerWebsite}>{company?.website || 'www.citrux.in'}</Text>
                        </View>
                        <View>
                            <Text style={styles.legalText}>System Generated Receipt</Text>
                            <Text style={[styles.legalText, { marginTop: 2 }]}>No Signature Required</Text>
                        </View>
                    </View>

                </View>
            </Page>
        </Document >
    );
};
