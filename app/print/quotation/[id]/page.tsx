import { getQuotation } from "@/app/actions/quotations"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PrintPageActions } from "@/components/quotation/print-page-actions"

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const quotation = await getQuotation(id)
    if (!quotation) notFound()

    return (
        <div className="print-layout bg-white min-h-screen">
            <style dangerouslySetInnerHTML={{
                __html: `
                @page {
                    size: A4;
                    margin: 0;
                }
                @media print {
                    body {
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                }
                .print-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 20px auto;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    position: relative;
                }
            `}} />

            <PrintPageActions />

            {/* A4 Page Content */}
            <div className="print-container text-sm text-gray-900 leading-snug">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6 mb-8">
                    <div className="w-1/2">
                        {/* Logo Placeholder */}
                        <div className="text-2xl font-bold text-blue-900 mb-2">CitruX Health</div>
                        <div className="text-gray-500">
                            Tech Park, Hitech City<br />
                            Hyderabad, Telangana<br />
                            GSTIN: 36ABCDE1234F1Z5
                        </div>
                    </div>
                    <div className="text-right w-1/2">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">QUOTATION</h1>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-gray-600">
                            <span className="font-semibold">Quotation #:</span>
                            <span className="font-mono text-gray-900">{quotation.quotation_number}</span>

                            <span className="font-semibold">Date:</span>
                            <span>{formatDate(quotation.created_at)}</span>

                            <span className="font-semibold">Valid Until:</span>
                            <span>{formatDate(quotation.valid_until)}</span>
                        </div>
                    </div>
                </div>

                {/* Client & Project Info */}
                <div className="flex justify-between gap-8 mb-8">
                    <div className="w-1/2">
                        <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Bill To</h3>
                        <div className="font-bold text-lg">{quotation.parties?.name}</div>
                        <div className="text-gray-600 whitespace-pre-line mt-1">
                            {quotation.parties?.address}
                        </div>
                        {quotation.parties?.email && (
                            <div className="text-gray-600 mt-1">{quotation.parties.email}</div>
                        )}
                        {quotation.parties?.phone && (
                            <div className="text-gray-600">{quotation.parties.phone}</div>
                        )}
                    </div>
                    <div className="w-1/2">
                        <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Project</h3>
                        <div className="font-bold text-lg">{quotation.project_title}</div>
                        <div className="text-gray-600 mt-2 bg-gray-50 p-3 rounded border border-gray-100 text-xs">
                            <span className="font-semibold block mb-1">Scope Summary:</span>
                            {quotation.scope_of_work || "As per discussed requirements."}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold">Description</th>
                                <th className="text-right py-3 px-4 font-semibold w-24">Rate</th>
                                <th className="text-center py-3 px-4 font-semibold w-16">Qty</th>
                                <th className="text-right py-3 px-4 font-semibold w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {quotation.quotation_items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-3 px-4 align-top">
                                        <div className="font-medium">{item.description}</div>
                                    </td>
                                    <td className="py-3 px-4 text-right align-top">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-3 px-4 text-center align-top">{item.quantity}</td>
                                    <td className="py-3 px-4 text-right align-top font-medium">{formatCurrency(item.total_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 max-w-xs">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                        </div>
                        {quotation.discount_amount > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-100 text-green-600">
                                <span>Discount</span>
                                <span>- {formatCurrency(quotation.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium">{formatCurrency(quotation.tax_total)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b-2 border-gray-900 text-xl font-bold mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(quotation.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Terms */}
                <div className="border-t pt-6 mt-auto">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Terms & Conditions</h4>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                <li>Valid for 30 days from date of issue.</li>
                                <li>50% advance payment required to commence work.</li>
                                <li>Subject to CitruX Health standard service agreement.</li>
                            </ul>
                        </div>
                        <div className="text-right flex flex-col items-end justify-end">
                            <div className="h-16 mb-2"></div> {/* Space for signature */}
                            <div className="border-t border-gray-400 w-48"></div>
                            <div className="text-xs font-bold mt-1 uppercase">Authorized Signature</div>
                            <div className="text-xs text-gray-500">For CitruX Health Solutions</div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 mt-12 pt-4 border-t border-dashed">
                    This is a computer-generated quotation and does not require a physical stamp.
                </div>
            </div>

            {/* Auto-print script */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // Optional: window.print(); 
                // Better to let user click the button to avoid popups on load
            `}} />
        </div>
    )
}
