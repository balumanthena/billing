/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

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
        padding: 40,
        lineHeight: 1.5,
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        color: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    companySection: {
        width: '55%',
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#111827',
        marginBottom: 8,
    },
    companyText: {
        fontSize: 9,
        color: '#4B5563',
        marginBottom: 2,
    },
    invoiceSection: {
        width: '40%',
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB', // Corporate Blue
        letterSpacing: 2,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    kvContainer: {
        flexDirection: 'row',
        marginBottom: 4,
        justifyContent: 'flex-end',
        width: '100%',
    },
    kvLabel: {
        fontSize: 9,
        color: '#6B7280',
        width: '40%',
        textAlign: 'right',
        marginRight: 8,
    },
    kvValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
        width: '60%',
        textAlign: 'right',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 20,
    },
    billToSection: {
        backgroundColor: '#F9FAFB',
        padding: 15,
        borderRadius: 6,
        marginBottom: 30,
        width: '100%',
    },
    billToLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    billToName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1E293B', // Dark Grey Header
        padding: 8,
        alignItems: 'center',
    },
    th: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 8,
        alignItems: 'center', // Align vertically center
    },
    td: {
        fontSize: 9,
        color: '#374151',
    },
    // Column Widths
    col1: { width: '40%' },
    col2: { width: '10%', textAlign: 'center' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '15%', textAlign: 'right' },
    col5: { width: '10%', textAlign: 'center' },
    col6: { width: '15%', textAlign: 'right' },

    totalsContainer: {
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
    },
    totalLabel: {
        fontSize: 9,
        color: '#6B7280',
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'right',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 2,
        borderTopColor: '#2563EB',
        marginTop: 8,
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111827',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    },
    brandName: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },
});

interface InvoicePDFProps {
    invoice: any
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
    const company = invoice.company_snapshot
    const customer = invoice.customer_snapshot
    const items = invoice.invoice_items

    // Helper for formatting currency
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.companySection}>
                        {/* Logo removed as per request */}
                        {/* {company?.logo_url && (
                            <Image
                                src={company.logo_url}
                                style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 10 }}
                            />
                        )} */}
                        <Text style={styles.companyName}>{company?.name || 'Company Name'}</Text>
                        <Text style={styles.companyText}>{company?.address}</Text>
                        <Text style={styles.companyText}>{company?.state} ({company?.state_code})</Text>
                        <Text style={styles.companyText}>GSTIN: {company?.gstin}</Text>
                        {company?.email && <Text style={styles.companyText}>Email: {company?.email}</Text>}
                        {company?.phone && <Text style={styles.companyText}>Phone: {company?.phone}</Text>}
                    </View>

                    <View style={styles.invoiceSection}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>

                        <View style={styles.kvContainer}>
                            <Text style={styles.kvLabel}>Invoice No:</Text>
                            <Text style={styles.kvValue}>{invoice.invoice_number}</Text>
                        </View>

                        <View style={styles.kvContainer}>
                            <Text style={styles.kvLabel}>Date:</Text>
                            <Text style={styles.kvValue}>{format(new Date(invoice.date), 'dd MMM yyyy')}</Text>
                        </View>

                        {invoice.due_date && (
                            <View style={styles.kvContainer}>
                                <Text style={styles.kvLabel}>Due Date:</Text>
                                <Text style={styles.kvValue}>{format(new Date(invoice.due_date), 'dd MMM yyyy')}</Text>
                            </View>
                        )}

                        <View style={styles.kvContainer}>
                            <Text style={styles.kvLabel}>Status:</Text>
                            <Text style={[styles.kvValue, { color: invoice.status === 'finalized' ? '#16A34A' : '#CA8A04' }]}>
                                {invoice.status.toUpperCase()}
                            </Text>
                        </View>

                        {/* QR Code */}
                        {invoice.barcodeUrl && (
                            <View style={{ marginTop: 10, alignItems: 'flex-end', width: '100%' }}>
                                <Image src={invoice.barcodeUrl} style={{ width: 60, height: 60 }} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bill To Section */}
                <View style={styles.billToSection}>
                    <Text style={styles.billToLabel}>Bill To</Text>
                    <Text style={styles.billToName}>{customer?.name}</Text>
                    <Text style={[styles.companyText, { color: '#374151' }]}>{customer?.address}</Text>
                    <Text style={[styles.companyText, { color: '#374151' }]}>
                        {customer?.state} ({customer?.state_code})
                    </Text>
                    <Text style={[styles.companyText, { color: '#374151', marginTop: 2 }]}>
                        GSTIN: {customer?.gstin || 'N/A'}
                    </Text>
                </View>

                {/* Line Items Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <View style={styles.col1}><Text style={styles.th}>Item Description</Text></View>
                        <View style={styles.col2}><Text style={styles.th}>SAC</Text></View>
                        <View style={styles.col3}><Text style={styles.th}>Qty</Text></View>
                        <View style={styles.col4}><Text style={styles.th}>Rate</Text></View>
                        <View style={styles.col5}><Text style={styles.th}>Tax</Text></View>
                        <View style={styles.col6}><Text style={styles.th}>Amount</Text></View>
                    </View>

                    {/* Rows */}
                    {items.map((item: any, i: number) => (
                        <View style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }]} key={i}>
                            <View style={styles.col1}><Text style={styles.td}>{item.description}</Text></View>
                            <View style={styles.col2}><Text style={styles.td}>{item.sac_code}</Text></View>
                            <View style={styles.col3}><Text style={styles.td}>{item.quantity}</Text></View>
                            <View style={styles.col4}><Text style={styles.td}>{formatCurrency(item.unit_price)}</Text></View>
                            <View style={styles.col5}><Text style={styles.td}>{item.tax_rate}%</Text></View>
                            <View style={styles.col6}><Text style={[styles.td, { fontWeight: 'bold' }]}>{formatCurrency(item.total_amount)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Totals Section */}
                <View style={styles.totalsContainer}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
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

                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Grand Total</Text>
                            <Text style={styles.grandTotalValue}>Rs. {formatCurrency(invoice.grand_total)}</Text>
                        </View>
                    </View>
                </View>



                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for your business</Text>
                    <Text style={styles.brandName}>Powered by Citrux Billing</Text>
                </View>
            </Page>
        </Document>
    );
};
