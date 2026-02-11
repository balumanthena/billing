import { getQuotation } from "@/app/actions/quotations"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, CheckCircle, XCircle, ArrowRight, Printer } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuotationStatusActions } from "@/components/quotation/status-actions" // Client Component for actions

export default async function QuotationDetailsPage({ params }: { params: { id: string } }) {
    const quotation = await getQuotation(params.id)
    if (!quotation) notFound()

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/quotations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{quotation.quotation_number}</h1>
                            <Badge variant="outline">{quotation.status.toUpperCase()}</Badge>
                        </div>
                        <p className="text-muted-foreground">{quotation.project_title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print / PDF
                    </Button>

                    {/* Actions: Approve/Reject/Convert */}
                    <QuotationStatusActions
                        id={quotation.id}
                        status={quotation.status}
                        convertedAgreementId={quotation.converted_agreement_id}
                        convertedInvoiceId={quotation.converted_invoice_id}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scope & Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Scope of Work</h3>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {quotation.scope_of_work || "No specific scope defined."}
                                </div>
                            </div>

                            <Separator />

                            {/* Line Items Table */}
                            <div className="rounded-md border">
                                <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-right">Rate</div>
                                    <div className="col-span-2 text-right">Qty</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                </div>
                                {quotation.quotation_items.map((item: any) => (
                                    <div key={item.id} className="grid grid-cols-12 p-3 text-sm border-t">
                                        <div className="col-span-6">{item.description}</div>
                                        <div className="col-span-2 text-right">{formatCurrency(item.unit_price)}</div>
                                        <div className="col-span-2 text-right">{item.quantity}</div>
                                        <div className="col-span-2 text-right">{formatCurrency(item.total_amount)}</div>
                                    </div>
                                ))}
                                <div className="p-3 border-t bg-muted/20">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium">Subtotal</span>
                                        <span>{formatCurrency(quotation.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="font-medium">Tax</span>
                                        <span>{formatCurrency(quotation.tax_total)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(quotation.grand_total)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {quotation.quotation_activity_log?.map((log: any) => (
                                    <div key={log.id} className="flex gap-4 text-sm">
                                        <div className="min-w-[150px] text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                        <div>
                                            <span className="font-medium capitalize">{log.action}: </span>
                                            <span className="text-muted-foreground">{log.note}</span>
                                        </div>
                                    </div>
                                ))}
                                {!quotation.quotation_activity_log?.length && (
                                    <div className="text-sm text-muted-foreground">No activity recorded.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Meta */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="font-semibold">{quotation.parties?.name}</div>
                                <div className="text-muted-foreground">{quotation.parties?.email}</div>
                                <div className="text-muted-foreground">{quotation.parties?.phone}</div>
                                <div className="mt-2 text-muted-foreground whitespace-pre-wrap">
                                    {quotation.parties?.address}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Valid Until</span>
                                <span>{formatDate(quotation.valid_until)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{formatDate(quotation.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version</span>
                                <span>v{quotation.version}</span>
                            </div>
                            {quotation.converted_invoice_id && (
                                <div className="pt-2 border-t">
                                    <div className="text-muted-foreground text-xs mb-1">Converted to Invoice</div>
                                    <Link href={`/dashboard/invoices/${quotation.converted_invoice_id}`} className="text-primary hover:underline">
                                        View Invoice &rarr;
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
