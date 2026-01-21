'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProfitAndLoss, getOutstanding, getSalesRegister, getGSTSummary } from "@/app/actions/reports"
import { useEffect, useState } from "react"
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            </div>

            <Tabs defaultValue="pnl" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="outstanding">Outstanding Receivables</TabsTrigger>
                    <TabsTrigger value="sales">Sales Register</TabsTrigger>
                    <TabsTrigger value="gst">GST Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="pnl" className="space-y-4">
                    {loading && !pnlData ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
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
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Outstanding Invoices</CardTitle>
                                <CardDescription>List of invoices with pending payments, categorized by aging.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Register (GSTR-1 Data)</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader><CardTitle>GST Liability Summary</CardTitle></CardHeader>
                                <CardContent>
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
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
