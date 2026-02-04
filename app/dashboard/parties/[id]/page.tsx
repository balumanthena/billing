'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPartyDetails } from '@/app/actions/parties'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    ArrowLeft,
    Edit,
    FileText,
    CreditCard,
    Briefcase,
    TrendingUp,
    Calendar,
    CheckCircle,
    AlertCircle,
    Building2,
    MapPin,
    Phone,
    Mail
} from 'lucide-react'

export default function PartyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const result = await getPartyDetails(id)
            if (result) {
                setData(result)
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) {
        return <div className="p-8 flex items-center justify-center">Loading client details...</div>
    }

    if (!data) {
        return <div className="p-8 text-center text-muted-foreground">Client not found</div>
    }

    const { party, stats, invoices, payments, contracts, topServices } = data

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/dashboard/parties" className="hover:text-primary">Parties</Link>
                        <span>/</span>
                        <span>Client Profile</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {party.name}
                        <Badge variant={party.type === 'customer' ? 'default' : 'secondary'} className="uppercase text-xs">
                            {party.type}
                        </Badge>
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        {party.gstin && (
                            <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> GSTIN: {party.gstin}
                            </span>
                        )}
                        {party.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {party.city}, {party.state}
                            </span>
                        )}
                        {party.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {party.email}
                            </span>
                        )}
                        {party.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {party.phone}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/parties?edit=${party.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            </div>

            {/* KPI Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/50 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm">
                <div className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4" /> Total Billed
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight">₹{stats.totalBilled.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across {stats.invoiceCount} invoices</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" /> Total Received
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">₹{stats.totalReceived.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime collections</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-primary" /> Outstanding
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">₹{stats.outstanding.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending payment</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Briefcase className="h-4 w-4 text-primary" /> Active Contracts
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight text-primary">{stats.activeContracts}</div>
                        <p className="text-xs text-muted-foreground mt-1">Master agreements</p>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="invoices" className="space-y-6">
                <TabsList className="bg-secondary/20 p-1 rounded-full w-full sm:w-auto inline-flex justify-start h-auto">
                    <TabsTrigger value="invoices" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Invoices</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Payments</TabsTrigger>
                    <TabsTrigger value="services" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Services Usage</TabsTrigger>
                    <TabsTrigger value="contracts" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Contracts</TabsTrigger>
                </TabsList>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice History</CardTitle>
                            <CardDescription>
                                List of all invoices raised for this client.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No invoices found.</TableCell>
                                        </TableRow>
                                    )}
                                    {invoices.map((inv: any) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                            <TableCell>{new Date(inv.date).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'outline'}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{inv.grand_total.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/invoices/${inv.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>
                                Record of payments received from this client.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No payments recorded.</TableCell>
                                        </TableRow>
                                    )}
                                    {payments.map((pay: any) => (
                                        <TableRow key={pay.id}>
                                            <TableCell>{new Date(pay.payment_date).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>{pay.invoices?.invoice_number || 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{pay.mode}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">₹{pay.amount.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Services Snapshot</CardTitle>
                            <CardDescription>
                                Commonly purchased services and usage frequency.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Service / Item</TableHead>
                                        <TableHead className="text-right">Frequency</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topServices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No service data available.</TableCell>
                                        </TableRow>
                                    )}
                                    {topServices.map((svc: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{svc.name}</TableCell>
                                            <TableCell className="text-right">{svc.count}</TableCell>
                                            <TableCell className="text-right">₹{svc.total.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contracts Tab */}
                <TabsContent value="contracts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Master Contracts</CardTitle>
                            <CardDescription>
                                Long-term agreements and phased projects.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contract #</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contracts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No active contracts.</TableCell>
                                        </TableRow>
                                    )}
                                    {contracts.map((c: any) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.master_invoice_number}</TableCell>
                                            <TableCell>{c.title}</TableCell>
                                            <TableCell>{new Date(c.created_at).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{c.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{c.total_amount.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
