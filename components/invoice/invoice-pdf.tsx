/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { amountToWords } from '@/lib/number-to-words';

// Register Inter Font for Enterprise Look


const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica', // Reverting to standard safe font
        fontSize: 10,
        padding: 0,
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        color: '#111827', // Near Black for sharpness
    },
    // 1. Header Adjustment: Compact & Dominant Brand
    headerContainer: {
        flexDirection: 'row',
        backgroundColor: '#0F172A', // Deep Navy
        height: 44, // Reduced height
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30, // Reduced padding
    },
    headerLogo: {
        height: 32, // Increased dominance
        width: 100, // Explicit width to preserve aspect ratio container
        objectFit: 'contain',
        opacity: 1, // Full opacity
    },
    headerWebsite: {
        color: '#F8FAFC',
        fontSize: 8,
        letterSpacing: 2,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        opacity: 0.9
    },

    // 2. Main Layout & Spacing
    body: {
        paddingHorizontal: 40,
        paddingTop: 32, // Increased top spacing
        paddingBottom: 40,
        flex: 1,
    },

    // Title Section
    titleSection: {
        marginBottom: 28, // 24-28px gap
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 16,
    },
    invoiceTitle: {
        fontSize: 20, // Clean, not overwhelming
        fontWeight: 'bold', // Semi-bold
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    invoiceMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    invoiceMetaText: {
        fontSize: 10,
        color: '#64748B', // Muted
        fontWeight: 400,
    },
    invoiceMetaValue: {
        color: '#0F172A', // Dark
        fontWeight: 'bold',
        marginLeft: 4,
    },

    // Address Block
    addressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32, // Consistent rhythm
        gap: 20,
    },
    addressBox: {
        width: '48%', // Prevent collision
    },
    addressLabel: {
        fontSize: 8,
        color: '#64748B',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    companyName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    addressLine: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.4,
    },

    // 3. Premium Table Styling
    table: {
        width: '100%',
        marginBottom: 24,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC', // Very light gray
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0', // Thin neutral gray
    },
    // Standardized Font Styles
    th: {
        fontSize: 9,
        fontWeight: 'bold', // Changed from 600
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    // ... other replacements ...
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9', // Subtle divider
        paddingVertical: 12, // Comfortable height
        paddingHorizontal: 8,
    },
    td: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.3,
    },

    // Column Widths (Optimized for no overlap)
    colDesc: { width: '38%' },
    colSac: { width: '10%', textAlign: 'right' },
    colQty: { width: '8%', textAlign: 'right' },
    colRate: { width: '16%', textAlign: 'right' },
    colTax: { width: '10%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },

    // 4. Totals Block (Right Aligned Zone)
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    summaryBox: {
        width: '45%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 10,
        color: '#1E293B',
        fontWeight: 'bold', // Medium/Semi-bold totals
        textAlign: 'right',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 12,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
    },

    // Amount In Words
    wordsSection: {
        marginTop: 32,
        marginBottom: 20,
    },
    wordsLabel: {
        fontSize: 9, // Increased from 8px
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    wordsValue: {
        fontFamily: 'Helvetica', // Safest standard font
        fontStyle: 'italic',
        fontSize: 12, // Increased from 11px
        color: '#1E293B',
    },

    // Watermark (Safe)
    watermark: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -200, // Centered manually
        marginTop: -150,
        width: 400,
        height: 300,
        opacity: 0.03, // Very subtle
        zIndex: -1,
        objectFit: 'contain'
    },

    // 5. Minimal Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerDecl: {
        fontSize: 10, // Increased from 8px
        color: '#64748B', // Slightly darker for readability
        marginBottom: 4,
    },
    footerBrand: {
        fontSize: 10, // Kept at 10px
        fontWeight: 'bold',
        color: '#0F172A',
    }
});

interface InvoicePDFProps {
    invoice: any
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
    const company = invoice.company_snapshot
    const customer = invoice.customer_snapshot
    const items = invoice.invoice_items

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Safe Watermark */}
                <Image
                    src="/logo.png"
                    style={styles.watermark}
                />

                {/* 1. Header */}
                <View style={styles.headerContainer}>
                    <Image src="/logo.png" style={styles.headerLogo} />
                    <Text style={styles.headerWebsite}>WWW.CITRUX.IN</Text>
                </View>

                {/* 2. Body */}
                <View style={styles.body}>
                    {/* Title & Meta */}
                    <View style={styles.titleSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
                                <Text style={{ fontSize: 9, color: '#64748B' }}>Original for Recipient</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={styles.invoiceMetaRow}>
                                    <Text style={styles.invoiceMetaText}>Invoice #:</Text>
                                    <Text style={styles.invoiceMetaValue}>{invoice.invoice_number}</Text>
                                </View>
                                <View style={styles.invoiceMetaRow}>
                                    <Text style={styles.invoiceMetaText}>Date:</Text>
                                    <Text style={styles.invoiceMetaValue}>{format(new Date(invoice.date), 'dd MMM yyyy')}</Text>
                                </View>
                                {invoice.due_date && (
                                    <View style={styles.invoiceMetaRow}>
                                        <Text style={styles.invoiceMetaText}>Due Date:</Text>
                                        <Text style={styles.invoiceMetaValue}>{format(new Date(invoice.due_date), 'dd MMM yyyy')}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Addresses */}
                    <View style={styles.addressSection}>
                        <View style={styles.addressBox}>
                            <Text style={styles.addressLabel}>Billed By</Text>
                            <Text style={styles.companyName}>{company?.name || 'Company Name'}</Text>
                            <Text style={styles.addressLine}>{company?.address}</Text>
                            <Text style={styles.addressLine}>{company?.city}, {company?.state} - {company?.pincode}</Text>
                            <Text style={[styles.addressLine, { marginTop: 4, fontWeight: 600, color: '#0F172A' }]}>GSTIN: {company?.gstin}</Text>
                            <Text style={styles.addressLine}>Email: {company?.email}</Text>
                        </View>
                        <View style={styles.addressBox}>
                            <Text style={styles.addressLabel}>Billed To</Text>
                            <Text style={styles.companyName}>{customer?.name || 'Customer Name'}</Text>
                            <Text style={styles.addressLine}>{customer?.address}</Text>
                            <Text style={styles.addressLine}>{customer?.city}, {customer?.state} - {customer?.pincode}</Text>
                            <Text style={[styles.addressLine, { marginTop: 4, fontWeight: 600, color: '#0F172A' }]}>GSTIN: {customer?.gstin || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={styles.colDesc}><Text style={styles.th}>Description</Text></View>
                            <View style={styles.colSac}><Text style={styles.th}>SAC</Text></View>
                            <View style={styles.colQty}><Text style={styles.th}>Qty</Text></View>
                            <View style={styles.colRate}><Text style={styles.th}>Rate</Text></View>
                            <View style={styles.colTax}><Text style={styles.th}>Tax</Text></View>
                            <View style={styles.colTotal}><Text style={styles.th}>Amount</Text></View>
                        </View>

                        {items?.map((item: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.colDesc}><Text style={styles.td}>{item.description}</Text></View>
                                <View style={styles.colSac}><Text style={styles.td}>{item.sac_code || '-'}</Text></View>
                                <View style={styles.colQty}><Text style={styles.td}>{item.quantity}</Text></View>
                                <View style={styles.colRate}><Text style={styles.td}>{formatCurrency(item.unit_price)}</Text></View>
                                <View style={styles.colTax}><Text style={styles.td}>{item.tax_rate}%</Text></View>
                                <View style={styles.colTotal}><Text style={[styles.td, { fontWeight: 600 }]}>{formatCurrency(item.total_amount)}</Text></View>
                            </View>
                        ))}
                    </View>

                    {/* Totals & Words - Grid Layout */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* Left: Words */}
                        <View style={{ width: '50%' }}>
                            <View style={styles.wordsSection}>
                                <Text style={styles.wordsLabel}>Amount in Words</Text>
                                <Text style={styles.wordsValue}>{amountToWords(invoice.grand_total)}</Text>
                            </View>
                        </View>

                        {/* Right: Totals */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Taxable Value</Text>
                                <Text style={styles.summaryValue}>Rs. {formatCurrency(invoice.subtotal)}</Text>
                            </View>

                            {/* GST Logic */}
                            {(invoice.invoice_items.some((item: any) => item.igst_amount > 0)) ? (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>IGST 18%</Text>
                                    <Text style={styles.summaryValue}>
                                        Rs. {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.igst_amount), 0))}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>CGST 9%</Text>
                                        <Text style={styles.summaryValue}>
                                            Rs. {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.cgst_amount), 0))}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>SGST 9%</Text>
                                        <Text style={styles.summaryValue}>
                                            Rs. {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.sgst_amount), 0))}
                                        </Text>
                                    </View>
                                </>
                            )}

                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>Rs. {formatCurrency(invoice.grand_total)}</Text>
                            </View>

                            {invoice.tds_amount > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    <View style={[styles.summaryRow, { paddingVertical: 2 }]}>
                                        <Text style={{ fontSize: 9, color: '#DC2626' }}>Less: TDS ({invoice.tds_rate}%)</Text>
                                        <Text style={{ fontSize: 9, color: '#DC2626', fontWeight: 600 }}>- Rs. {formatCurrency(invoice.tds_amount)}</Text>
                                    </View>
                                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#F1F5F9', marginTop: 4, paddingTop: 4 }]}>
                                        <Text style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>Net Payable</Text>
                                        <Text style={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>Rs. {formatCurrency(invoice.net_receivable)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                </View>

                {/* 5. Minimal Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerDecl}>This is a system-generated invoice and does not require a physical signature.</Text>
                    <Text style={styles.footerBrand}>
                        {company?.name} • www.citrux.in
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

