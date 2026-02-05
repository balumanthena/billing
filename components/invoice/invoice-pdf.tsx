/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

import { amountToWords } from '@/lib/number-to-words';

// Register nice font if needed, using default for now
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 }
    ]
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 0, // Reset padding for full-width header
        lineHeight: 1.5,
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        color: '#111',
    },
    // Top Navy Header
    topHeader: {
        backgroundColor: '#0F172A',
        height: 8, // Slim border as requested
        width: '100%',
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 30, // Padding moved here
    },
    headerLogo: {
        width: 140, // Increased size
        height: 60, // Adjusted aspect ratio
        objectFit: 'contain',
        marginLeft: -10 // Reduced left padding visual
    },
    headerWebsite: {
        color: '#64748B',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },

    // Main Content
    container: {
        padding: 40,
        paddingTop: 40,
    },

    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // Info on right
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 20,
    },
    invoiceTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    invoiceMeta: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'right',
    },

    // Addresses
    addresses: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    addressBlock: {
        width: '45%',
    },
    addressTitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 4,
    },
    addressText: {
        fontSize: 10,
        color: '#334155',
        marginBottom: 2,
    },
    addressName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 2,
    },

    // Table
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 2,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    th: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    td: {
        fontSize: 10,
        color: '#334155',
    },

    // Columns
    colDesc: { width: '40%' },
    colSac: { width: '10%', textAlign: 'right' },
    colQty: { width: '10%', textAlign: 'right' },
    colRate: { width: '15%', textAlign: 'right' },
    colTax: { width: '10%', textAlign: 'right' },
    colAmount: { width: '15%', textAlign: 'right' },

    // Totals
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalsBox: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    totalLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'right',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 2,
        borderTopColor: '#0F172A',
        marginTop: 8,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A', // Navy
    },

    wordsRow: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },
    wordsLabel: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    wordsText: {
        fontFamily: 'Helvetica',
        fontStyle: 'italic', // Times New Roman not standard in basic fonts, using italic
        fontSize: 12,
        color: '#0F172A',
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 15,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#9CA3AF',
        textAlign: 'center',
    },

    logoWatermark: {
        position: 'absolute',
        width: 300,
        height: 300,
        top: '50%',
        left: '50%',
        marginLeft: -150,
        marginTop: -150,
        opacity: 0.03,
        zIndex: -1,
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

    // Determine GST Type logic for Label
    const isIntraState = (company?.state_code && customer?.state_code && company.state_code == customer.state_code) ||
        (company?.state?.toLowerCase() === customer?.state?.toLowerCase());

    const logoUrl = 'https://dashboard.citrux.in/logo.png'; // Using absolute URL for safety in PDF

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Strip */}
                <View style={styles.topHeader} />

                {/* Actual Header Content */}
                <View style={styles.headerSection}>
                    <Image src="/logo.png" style={styles.headerLogo} />
                    <Text style={styles.headerWebsite}>WWW.CITRUX.IN</Text>
                </View>

                {/* Main Body */}
                <View style={styles.container}>

                    {/* Header Info (Title + Details) */}
                    <View style={styles.headerInfo}>
                        <View>
                            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
                            <Text style={styles.invoiceMeta}>#{invoice.invoice_number}</Text>
                            <Text style={styles.invoiceMeta}>Date: {format(new Date(invoice.date), 'dd MMM yyyy')}</Text>
                            {invoice.due_date && (
                                <Text style={styles.invoiceMeta}>Due: {format(new Date(invoice.due_date), 'dd MMM yyyy')}</Text>
                            )}
                        </View>
                    </View>

                    {/* Addresses */}
                    <View style={styles.addresses}>
                        <View style={styles.addressBlock}>
                            <Text style={styles.addressTitle}>Billed By (Supplier)</Text>
                            <Text style={styles.addressName}>{company?.name}</Text>
                            <Text style={styles.addressText}>{company?.address}</Text>
                            <Text style={styles.addressText}>{company?.city}, {company?.state} - {company?.pincode}</Text>
                            <Text style={styles.addressText}>GSTIN: {company?.gstin}</Text>
                            <Text style={styles.addressText}>Email: {company?.email || 'support@citrux.in'}</Text>
                        </View>
                        <View style={styles.addressBlock}>
                            <Text style={styles.addressTitle}>Billed To (Recipient)</Text>
                            <Text style={styles.addressName}>{customer?.name}</Text>
                            <Text style={styles.addressText}>{customer?.address}</Text>
                            <Text style={styles.addressText}>{customer?.city}, {customer?.state} - {customer?.pincode}</Text>
                            <Text style={styles.addressText}>GSTIN: {customer?.gstin || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={styles.colDesc}><Text style={styles.th}>Description</Text></View>
                            <View style={styles.colSac}><Text style={styles.th}>HSN/SAC</Text></View>
                            <View style={styles.colQty}><Text style={styles.th}>Qty</Text></View>
                            <View style={styles.colRate}><Text style={styles.th}>Rate</Text></View>
                            <View style={styles.colTax}><Text style={styles.th}>Tax</Text></View>
                            <View style={styles.colAmount}><Text style={styles.th}>Amount</Text></View>
                        </View>
                        {items?.map((item: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={styles.colDesc}><Text style={styles.td}>{item.description}</Text></View>
                                <View style={styles.colSac}><Text style={styles.td}>{item.sac_code}</Text></View>
                                <View style={styles.colQty}><Text style={styles.td}>{item.quantity}</Text></View>
                                <View style={styles.colRate}><Text style={styles.td}>{formatCurrency(item.unit_price)}</Text></View>
                                <View style={styles.colTax}><Text style={styles.td}>{item.tax_rate}%</Text></View>
                                <View style={styles.colAmount}><Text style={[styles.td, { fontWeight: 'bold' }]}>{formatCurrency(item.total_amount)}</Text></View>
                            </View>
                        ))}
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsSection}>
                        <View style={styles.totalsBox}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Taxable Value</Text>
                                <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                            </View>
                            {(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.igst_amount), 0) > 0) ? (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>IGST</Text>
                                    <Text style={styles.totalValue}>
                                        {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.igst_amount), 0))}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>CGST</Text>
                                        <Text style={styles.totalValue}>
                                            {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.cgst_amount), 0))}
                                        </Text>
                                    </View>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>SGST</Text>
                                        <Text style={styles.totalValue}>
                                            {formatCurrency(invoice.invoice_items.reduce((acc: number, item: any) => acc + (item.sgst_amount), 0))}
                                        </Text>
                                    </View>
                                </>
                            )}
                            <View style={styles.wordsRow}>
                                <Text style={styles.wordsLabel}>Amount in Words</Text>
                                <Text style={styles.wordsText}>{amountToWords(invoice.grand_total)}</Text>
                            </View>

                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                                <Text style={styles.grandTotalValue}>Rs. {formatCurrency(invoice.grand_total)}</Text>
                            </View>
                            {invoice.tds_amount > 0 && (
                                <>
                                    <View style={styles.totalRow}>
                                        <Text style={{ ...styles.totalLabel, color: '#ef4444' }}>
                                            Less: TDS @ {invoice.tds_rate}% on Rs. {formatCurrency(invoice.subtotal)}
                                        </Text>
                                        <Text style={{ ...styles.totalValue, color: '#ef4444' }}>- {formatCurrency(invoice.tds_amount)}</Text>
                                    </View>
                                    <View style={{ ...styles.grandTotalRow, marginTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4 }}>
                                        <Text style={styles.grandTotalLabel}>Net Receivable</Text>
                                        <Text style={styles.grandTotalValue}>Rs. {formatCurrency(invoice.net_receivable)}</Text>
                                    </View>
                                    <Text style={{ fontSize: 8, color: '#64748B', marginTop: 8, fontStyle: 'italic', textAlign: 'right' }}>
                                        * As per Income Tax Act, TDS is to be deposited by the recipient. GST payable remains unchanged.
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>This is a computer generated invoice.</Text>
                        <Text style={styles.footerText}>Powered by Citrux Billing • www.citrux.in</Text>
                    </View>
                </View>

            </Page>
        </Document >
    );
};
