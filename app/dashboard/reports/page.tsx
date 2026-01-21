'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProfitAndLoss, getOutstanding, getSalesRegister, getGSTSummary } from "@/app/actions/reports"
import { useEffect, useState } from "react"
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, Download } from "lucide-react"
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('pnl')
    const [pnlData, setPnlData] = useState<any>(null)
    const [outstandingData, setOutstandingData] = useState<any[]>([])
    const [salesData, setSalesData] = useState<any[]>([])
    const [gstData, setGstData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Fetch logic
    const fetchers: Record<string, () => Promise<void>> = {
        pnl: async () => {
            const data = await getProfitAndLoss()
            setPnlData(data)
        },
        outstanding: async () => {
            const data = await getOutstanding()
            setOutstandingData(data)
        },
        sales: async () => {
            const data = await getSalesRegister()
            setSalesData(data)
        },
        gst: async () => {
            const data = await getGSTSummary()
            setGstData(data)
        }
    }

    useEffect(() => {
        async function load() {
            setLoading(true)
            await fetchers[activeTab]?.()
            setLoading(false)
        }
        load()
    }, [activeTab])

    const handleExport = (data: any[], filename: string) => {
        if (!data || data.length === 0) return

        // Flatten objects for CSV
        const header = Object.keys(data[0]).join(",")
        const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(","))
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `${filename}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Custom Export for GST Summary which isn't an array
    const handleExportGST = () => {
        if (!gstData) return
        const rows = [
            ["Type", "Taxable Value", "CGST", "SGST", "IGST", "Total Tax"],
            ["Output Supply (Sales)", gstData.output.taxable, gstData.output.cgst, gstData.output.sgst, gstData.output.igst, gstData.output.total],
            ["Input Credit (Purchases)", gstData.input.taxable, "-", "-", "-", gstData.input.total_gst],
            ["NET PAYABLE", "-", "-", "-", "-", gstData.net_payable]
        ]
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `GST_Summary.csv`)
        document.body.appendChild(link)
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            </div>

            <div className="md:hidden w-full">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Report" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pnl">Profit & Loss</SelectItem>
                        <SelectItem value="outstanding">Outstanding Receivables</SelectItem>
                        <SelectItem value="sales">Sales Register</SelectItem>
                        <SelectItem value="gst">GST Summary</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs value={activeTab} className="space-y-4" onValueChange={setActiveTab}>
                <TabsList className="hidden md:inline-flex">
                    <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="outstanding">Outstanding Receivables</TabsTrigger>
                    <TabsTrigger value="sales">Sales Register</TabsTrigger>
                    <TabsTrigger value="gst">GST Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="pnl" className="space-y-4">
                    {loading && !pnlData ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-32 mb-2" />
                                        <Skeleton className="h-3 w-40" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : pnlData ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">₹{pnlData.revenue.toLocaleString('en-IN')}</div>
                                        <p className="text-xs text-muted-foreground">{pnlData.invoice_count} Invoices</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">₹{pnlData.expenses.toLocaleString('en-IN')}</div>
                                        <p className="text-xs text-muted-foreground">{pnlData.expense_count} Transactions</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                        <RefreshCcw className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${pnlData.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            ₹{pnlData.net_profit.toLocaleString('en-IN')}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : null}
                </TabsContent>

                <TabsContent value="outstanding" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleExport(outstandingData, 'Outstanding')}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </div>
                    {loading && outstandingData.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Outstanding Invoices</CardTitle>
                                <CardDescription>List of invoices with pending payments, categorized by aging.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center space-x-4 py-2">
                                            <Skeleton className="h-4 w-[100px]" />
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-[100px]" />
                                            <Skeleton className="h-6 w-[80px] rounded-full" />
                                            <Skeleton className="h-4 w-[80px] ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Outstanding Invoices</CardTitle>
                                <CardDescription>List of invoices with pending payments, categorized by aging.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 md:p-6">
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice No</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Age</TableHead>
                                                <TableHead className="text-right">Pending Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {outstandingData.length === 0 && (
                                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No outstanding payments.</TableCell></TableRow>
                                            )}
                                            {outstandingData.map((inv) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                                    <TableCell>{inv.customer_name}</TableCell>
                                                    <TableCell>{new Date(inv.date).toLocaleDateString('en-IN')}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${inv.age_days > 60 ? 'bg-red-100 text-red-700' :
                                                            inv.age_days > 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {inv.age_days} Days
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">₹{inv.pending_amount.toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List View */}
                                <div className="md:hidden space-y-4 pt-2">
                                    {outstandingData.length === 0 && (
                                        <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-lg">No outstanding payments.</div>
                                    )}
                                    {outstandingData.map((inv) => (
                                        <div key={inv.id} className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-3 transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-lg text-slate-800">{inv.customer_name}</div>
                                                    <div className="text-xs text-slate-500 font-medium mt-0.5">#{inv.invoice_number} • {new Date(inv.date).toLocaleDateString('en-IN')}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg text-slate-900">₹{inv.pending_amount.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-start pt-2 border-t border-slate-50">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${inv.age_days > 60 ? 'bg-red-50 text-red-700 ring-red-100' :
                                                    inv.age_days > 30 ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                                    }`}>
                                                    Overdue by {inv.age_days} Days
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="sales" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleExport(salesData, 'Sales_Register')}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </div>
                    {loading ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Register (GSTR-1 Data)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="grid grid-cols-9 gap-4 py-2">
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Register (GSTR-1 Data)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 md:p-6">
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Inv No</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>GSTIN</TableHead>
                                                <TableHead className="text-right">Taxable</TableHead>
                                                <TableHead className="text-right">CGST</TableHead>
                                                <TableHead className="text-right">SGST</TableHead>
                                                <TableHead className="text-right">IGST</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesData.map((inv: any) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell>{new Date(inv.date).toLocaleDateString('en-IN')}</TableCell>
                                                    <TableCell>{inv.invoice_number}</TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{inv.customer_name}</TableCell>
                                                    <TableCell>{inv.gstin}</TableCell>
                                                    <TableCell className="text-right">₹{inv.taxable_amount?.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{inv.cgst?.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{inv.sgst?.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{inv.igst?.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{inv.grand_total?.toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List View */}
                                <div className="md:hidden space-y-4 pt-2">
                                    {salesData.map((inv: any) => (
                                        <div key={inv.id} className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-3 transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-base text-slate-800">{inv.customer_name}</div>
                                                    <div className="text-xs text-slate-500 font-medium mt-0.5">{new Date(inv.date).toLocaleDateString('en-IN')}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 font-medium">#{inv.invoice_number}</div>
                                                    <div className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded mt-1">{inv.gstin || 'No GSTIN'}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-2 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-medium">Taxable</span>
                                                    <span className="font-mono text-slate-700">₹{inv.taxable_amount?.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-medium">Tax</span>
                                                    <span className="font-mono text-slate-700">₹{((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                                                <span className="font-bold text-lg text-emerald-700">₹{inv.grand_total?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="gst" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleExportGST}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </div>
                    {loading || !gstData ? (
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader><CardTitle>GST Liability Summary</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <Card className="overflow-hidden">
                                <CardHeader><CardTitle>GST Liability Summary</CardTitle></CardHeader>
                                <CardContent className="p-0 md:p-6">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Taxable Value</TableHead>
                                                    <TableHead className="text-right">CGST</TableHead>
                                                    <TableHead className="text-right">SGST</TableHead>
                                                    <TableHead className="text-right">IGST</TableHead>
                                                    <TableHead className="text-right font-bold">Total Tax</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-medium">Output Supply (Sales)</TableCell>
                                                    <TableCell className="text-right">₹{gstData.output.taxable.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{gstData.output.cgst.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{gstData.output.sgst.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right">₹{gstData.output.igst.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">₹{gstData.output.total.toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell className="font-medium">Input Credit (Purchases)</TableCell>
                                                    <TableCell className="text-right">₹{gstData.input.taxable.toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="text-right" colSpan={3}>Combined (As per Expenses)</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">₹{gstData.input.total_gst.toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-muted/50">
                                                    <TableCell className="font-bold text-lg" colSpan={5}>NET PAYABLE</TableCell>
                                                    <TableCell className="text-right font-bold text-xl">₹{gstData.net_payable.toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden flex flex-col gap-4 pt-2">
                                        {/* Output Card */}
                                        <div className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-4">
                                            <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                                Output Supply (Sales)
                                            </h4>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Taxable Value</span>
                                                <span className="font-mono text-slate-900">₹{gstData.output.taxable.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                                <div>
                                                    <div className="text-slate-400 font-medium mb-1">CGST</div>
                                                    <div className="font-mono text-slate-700">₹{gstData.output.cgst.toLocaleString('en-IN')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-400 font-medium mb-1">SGST</div>
                                                    <div className="font-mono text-slate-700">₹{gstData.output.sgst.toLocaleString('en-IN')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-400 font-medium mb-1">IGST</div>
                                                    <div className="font-mono text-slate-700">₹{gstData.output.igst.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between font-bold pt-2 border-t border-slate-50">
                                                <span className="text-slate-600 text-sm">Total Tax Liability</span>
                                                <span className="text-red-600 text-lg">₹{gstData.output.total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Input Card */}
                                        <div className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-4">
                                            <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                                Input Credit (Purchases)
                                            </h4>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Taxable Value</span>
                                                <span className="font-mono text-slate-900">₹{gstData.input.taxable.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between font-bold pt-2 border-t border-slate-50">
                                                <span className="text-slate-600 text-sm">Total Input Credit</span>
                                                <span className="text-green-600 text-lg">₹{gstData.input.total_gst.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Net Card */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 flex justify-between items-center border border-blue-100 shadow-sm">
                                            <span className="font-bold text-blue-900 text-sm uppercase tracking-wide">NET PAYABLE</span>
                                            <span className="font-bold text-2xl text-blue-700">₹{gstData.net_payable.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
