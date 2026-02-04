import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Printer, Download, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { amountToWords } from '@/lib/number-to-words'
import { format } from 'date-fns'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

import { ReceiptActions } from "@/components/receipt/receipt-actions"

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = (await createClient()) as SupabaseClient<Database>

    // Fetch Payment with related Invoice and Company/Customer details
    const { data: payment } = await (supabase
        .from('payments') as any)
        .select(`
            *,
            invoices (
                invoice_number,
                customer_snapshot,
                company_snapshot
            )
        `)
        .eq('id', id)
        .single()

    if (!payment) {
        notFound()
    }

    const { invoices: invoice } = payment
    const company = invoice.company_snapshot
    const customer = invoice.customer_snapshot

    return (
        <div className="container mx-auto py-8 flex flex-col items-center">
            <div className="w-full max-w-[210mm] mb-6 flex items-center justify-between print:hidden">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/invoices/${payment.invoice_id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoice
                    </Link>
                </Button>
                <ReceiptActions
                    payment={payment}
                    invoice={invoice}
                    company={company}
                    customer={customer}
                />
            </div>

            {/* A4 Paper Simulation on Screen - Fixed Width */}
            <div className="w-full max-w-[210mm] bg-white shadow-xl print:shadow-none overflow-hidden text-slate-900 border border-slate-200">

                {/* 1. Header (Slim ERP Style) */}
                <div className="bg-slate-900 h-[52px] w-full flex items-center justify-between px-8 print:px-8">
                    {/* Logo Area */}
                    <div className="h-full flex items-center">
                        {company?.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="h-9 w-auto object-contain brightness-0 invert" />
                        ) : (
                            <span className="text-white font-bold text-xl uppercase tracking-wider">{company?.name}</span>
                        )}
                    </div>
                    {/* Website Area */}
                    <div className="text-white/90 text-sm font-medium tracking-wide">
                        {company?.website || 'www.citrux.in'}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative p-10 min-h-[500px]">

                    {/* Watermark (Behind Content) */}
                    {company?.logo_url && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <img
                                src={company.logo_url}
                                alt=""
                                className="w-[50%] opacity-[0.06] grayscale object-contain"
                            />
                        </div>
                    )}

                    {/* Content Layer (z-10) */}
                    <div className="relative z-10 space-y-10">

                        {/* 2. Top Section: Identity & Metadata */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                            {/* Left: Company Identity */}
                            <div className="w-[55%]">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-2">
                                    {company?.name || 'Company Name'}
                                </h2>
                                <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                                    <p>{company?.address}</p>
                                    <p>{company?.state} {company?.state_code && `(${company.state_code})`}</p>
                                    <p><span className="font-semibold text-slate-700">GSTIN:</span> {company?.gstin}</p>
                                    {(company?.email || company?.phone) && (
                                        <p className="pt-1 opacity-90 italic">
                                            {company?.email} • {company?.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Receipt Metadata */}
                            <div className="w-[45%] text-right">
                                <h1 className="text-xl font-light text-slate-400 uppercase tracking-widest mb-6">Payment Receipt</h1>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Receipt No</span>
                                        <span className="text-sm font-bold text-slate-900">{payment.receipt_number || 'PENDING'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</span>
                                        <span className="text-xs font-medium text-slate-900">{format(new Date(payment.payment_date), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reference</span>
                                        <span className="text-xs font-medium text-slate-900 font-mono">{payment.reference_id || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Middle Section: Recipient & Payment Details */}
                        <div className="grid grid-cols-2 gap-10">
                            {/* Received From */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Received From</p>
                                <div className="pl-4 border-l-2 border-slate-100">
                                    <div className="font-bold text-sm text-slate-900">{customer?.name}</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        <p>{customer?.address}</p>
                                        <p className="mt-1"><span className="text-[10px] text-slate-400 uppercase">GSTIN:</span> {customer?.gstin || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Context */}
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Context</p>
                                <div className="space-y-2">
                                    <div className="flex justify-end gap-3">
                                        <span className="text-xs text-slate-500">Payment Mode:</span>
                                        <span className="text-xs font-bold text-slate-900 capitalize">{payment.mode}</span>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <span className="text-xs text-slate-500">Against Invoice:</span>
                                        <span className="text-xs font-bold text-slate-900">{invoice.invoice_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Amount Section (Bank Style) */}
                        <div className="mt-8 bg-white border border-slate-200 rounded-lg p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Amount Received</p>
                            <div className="text-4xl font-bold text-slate-900 mb-6">
                                ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-sm text-slate-600 font-serif italic capitalize px-8">
                                {amountToWords(payment.amount)} Only
                            </p>
                        </div>

                        {/* 5. Footer (Legal) */}
                        <div className="pt-12 mt-4 flex justify-between items-end">
                            <div>
                                <div className="inline-flex items-center gap-2 px-0 py-0 mb-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-700" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-green-700">Payment Verified</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 pl-0">
                                    {company?.website || 'www.citrux.in'}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">System Generated Receipt</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">No Signature Required</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
