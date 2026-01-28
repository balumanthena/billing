'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Download, FileText, UserIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ServiceAgreementPDF } from '@/components/invoice/service-agreement-pdf'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button disabled>Loading Generator...</Button>,
    }
)

interface GeneratorFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    company: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parties: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
}

const TECH_STACKS = [
    "Next.js, Supabase, Tailwind",
    "MERN Stack (Mongo, Express, React, Node)",
    "WordPress / PHP",
    "Shopify / Liquid",
    "Python / Django",
    "Flutter / Firebase",
    "React Native"
]

const JURISDICTIONS = [
    "Hyderabad, Telangana",
    "Bangalore, Karnataka",
    "Mumbai, Maharashtra",
    "Delhi, NCR",
    "Chennai, Tamil Nadu",
    "Kolkata, West Bengal",
    "Pune, Maharashtra"
]

const PAGE_RANGES = [
    "1-5 Pages",
    "5-10 Pages",
    "10-20 Pages",
    "20-50 Pages",
    "50-60 Pages",
    "60-70 Pages",
    "70-80 Pages",
    "80-90 Pages",
    "90-100 Pages",
    "100+ Pages"
]

const ADMIN_FEATURES = [
    "Standard Dashboard",
    "CMS (Content Management)",
    "E-commerce Admin Panel",
    "User Role Management",
    "Analytics & Reporting"
]

export default function GeneratorForm({ company, parties, items }: GeneratorFormProps) {
    // 1. Client & Dates
    const [customerId, setCustomerId] = useState('')
    const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0])

    // 2. Services (Line Items)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineItems, setLineItems] = useState<any[]>([])

    // 3. Project Parameters (from Dialog)
    const [params, setParams] = useState({
        developerWebsite: '',
        technologyStack: 'Next.js, Supabase, Tailwind CSS',
        totalPages: '5-10 Pages',
        monthlyTraffic: '10,000',
        blogLimit: 'Unlimited',
        appointmentMode: 'WhatsApp / Calendly',
        adminFeatures: 'CMS (Content Management)',
        advancePercent: '50',
        milestonePercent: '30',
        finalPercent: '20',
        jurisdiction: company?.state ? `${company.city || 'Hyderabad'}, ${company.state}` : 'Hyderabad, Telangana',
    })

    // Tax Mode: 'exclusive' | 'inclusive'
    const [taxMode, setTaxMode] = useState('exclusive')

    const selectedCustomer = parties.find(p => p.id === customerId)

    // Helper: Add Service
    const addItem = () => {
        setLineItems([...lineItems, {
            id: Math.random().toString(),
            item_id: '',
            description: '',
            sac_code: '',
            tax_rate: 18,
            unit_price: 0,
            quantity: 1, // Only used for calculation if needed, agreement usually lists services
            total_amount: 0 // Placeholder
        }])
    }

    // Helper: Remove Service
    const removeItem = (index: number) => {
        const newItems = [...lineItems]
        newItems.splice(index, 1)
        setLineItems(newItems)
    }

    // Helper: Update Service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...lineItems]
        const item = newItems[index]

        if (field === 'item_id') {
            const masterItem = items.find(i => i.id === value)
            if (masterItem) {
                item.item_id = masterItem.id
                item.description = masterItem.name
                item.sac_code = masterItem.sac_code
                item.unit_price = masterItem.unit_price
                item.tax_rate = masterItem.tax_rate
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            item[field] = value
        }

        // Simple recalc of total for display (Qty * Price)
        item.total_amount = (item.quantity || 1) * (item.unit_price || 0)

        setLineItems(newItems)
    }

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setParams(prev => ({ ...prev, [name]: value }))
    }

    // Calculate Grand Total for Commercials
    const calculateGrandTotal = () => {
        return lineItems.reduce((acc, item) => {
            const qty = item.quantity || 1
            const price = item.unit_price || 0
            const taxRate = item.tax_rate || 0

            if (taxMode === 'inclusive') {
                // If price includes tax, then the entered price IS the total for that item
                return acc + (qty * price)
            } else {
                // If price is exclusive, add tax on top
                const base = qty * price
                const tax = base * (taxRate / 100)
                return acc + base + tax
            }
        }, 0)
    }

    // Measure "Other" states
    const isCustomTech = !TECH_STACKS.includes(params.technologyStack)
    const isCustomJurisdiction = !JURISDICTIONS.includes(params.jurisdiction)
    const isCustomPages = !PAGE_RANGES.includes(params.totalPages)
    const isCustomAdmin = !ADMIN_FEATURES.includes(params.adminFeatures)


    // Construct "Mock Invoice" object for the PDF Generator
    const mockInvoice = {
        invoice_number: 'AGREEMENT-DRAFT',
        date: agreementDate,
        grand_total: calculateGrandTotal(),
        company_snapshot: company,
        customer_snapshot: selectedCustomer || {},
        invoice_items: lineItems
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Client Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-blue-600" /> Client Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Client</Label>
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {parties.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedCustomer && (
                            <div className="text-xs bg-muted p-3 rounded-md space-y-1">
                                <div className="font-semibold">{selectedCustomer.name}</div>
                                <div>{selectedCustomer.address}</div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Agreement Date</Label>
                            <Input type="date" value={agreementDate} onChange={e => setAgreementDate(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Project Params (Condensed) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" /> Project Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Tech Stack</Label>
                                <Select
                                    value={isCustomTech ? 'Other' : params.technologyStack}
                                    onValueChange={(val) => {
                                        if (val === 'Other') setParams(prev => ({ ...prev, technologyStack: '' }))
                                        else setParams(prev => ({ ...prev, technologyStack: val }))
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select or type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TECH_STACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        <SelectItem value="Other">Other (Custom)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomTech && (
                                    <Input
                                        placeholder="Type custom tech stack..."
                                        value={params.technologyStack}
                                        onChange={(e) => setParams(prev => ({ ...prev, technologyStack: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Jurisdiction</Label>
                                <Select
                                    value={isCustomJurisdiction ? 'Other' : params.jurisdiction}
                                    onValueChange={(val) => {
                                        if (val === 'Other') setParams(prev => ({ ...prev, jurisdiction: '' }))
                                        else setParams(prev => ({ ...prev, jurisdiction: val }))
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                        <SelectItem value="Other">Other (Custom)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomJurisdiction && (
                                    <Input
                                        placeholder="Type jurisdiction..."
                                        value={params.jurisdiction}
                                        onChange={(e) => setParams(prev => ({ ...prev, jurisdiction: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Total Pages</Label>
                                <Select
                                    value={isCustomPages ? 'Other' : params.totalPages}
                                    onValueChange={(val) => {
                                        if (val === 'Other') setParams(prev => ({ ...prev, totalPages: '' }))
                                        else setParams(prev => ({ ...prev, totalPages: val }))
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_RANGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        <SelectItem value="Other">Other (Custom)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomPages && (
                                    <Input
                                        placeholder="Type page content..."
                                        value={params.totalPages}
                                        onChange={(e) => setParams(prev => ({ ...prev, totalPages: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Admin Features</Label>
                                <Select
                                    value={isCustomAdmin ? 'Other' : params.adminFeatures}
                                    onValueChange={(val) => {
                                        if (val === 'Other') setParams(prev => ({ ...prev, adminFeatures: '' }))
                                        else setParams(prev => ({ ...prev, adminFeatures: val }))
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Features" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADMIN_FEATURES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                        <SelectItem value="Other">Other (Custom)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomAdmin && (
                                    <Input
                                        placeholder="Type features..."
                                        value={params.adminFeatures}
                                        onChange={(e) => setParams(prev => ({ ...prev, adminFeatures: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        {/* Advanced & Tax Settings */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Tax Preference</Label>
                                <Select value={taxMode} onValueChange={setTaxMode}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exclusive">Fees Exclude GST</SelectItem>
                                        <SelectItem value="inclusive">Fees Include GST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t pt-2 mt-2">
                            <div className="space-y-1">
                                <Label className="text-[10px]">Adv %</Label>
                                <Input name="advancePercent" value={params.advancePercent} onChange={handleParamChange} className="h-8" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px]">Milestone %</Label>
                                <Input name="milestonePercent" value={params.milestonePercent} onChange={handleParamChange} className="h-8" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px]">Final %</Label>
                                <Input name="finalPercent" value={params.finalPercent} onChange={handleParamChange} className="h-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Service Selection */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">Scope of Services (Included in Agreement)</CardTitle>
                    <Button size="sm" onClick={addItem} variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Add Service
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Service Name</TableHead>
                                <TableHead className="w-[15%]">SAC Code</TableHead>
                                <TableHead className="w-[20%]">Description</TableHead>
                                <TableHead className="w-[15%] text-right">Fee (₹)</TableHead>
                                <TableHead className="w-[10%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No services added. Add services to populate the agreement scope.
                                    </TableCell>
                                </TableRow>
                            )}
                            {lineItems.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Select
                                            value={item.item_id}
                                            onValueChange={(val) => updateItem(index, 'item_id', val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select Service" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {items.map(i => (
                                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.sac_code}
                                            onChange={(e) => updateItem(index, 'sac_code', e.target.value)}
                                            className="h-8"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            className="h-8"
                                            placeholder="Custom Description"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                            className="h-8 text-right"
                                        />
                                        {/* Helper text showing tax status */}
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            {taxMode === 'inclusive' ? '(Inc. Tax)' : `+ ${item.tax_rate}% Tax`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t">
                <div>
                    <div className="text-sm font-medium text-muted-foreground">Estimated Total Value</div>
                    <div className="text-2xl font-bold">₹{calculateGrandTotal().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-muted-foreground">
                        {taxMode === 'inclusive' ? 'Inclusive of GST' : 'Inclusive of GST (Calculated)'}
                    </div>
                </div>

                <PDFDownloadLink
                    document={<ServiceAgreementPDF invoice={mockInvoice} projectParams={params} />}
                    fileName={`Service_Agreement_${selectedCustomer?.name || 'Draft'}.pdf`}
                >
                    {({ loading }) =>
                        <Button size="lg" disabled={loading || !selectedCustomer || lineItems.length === 0} className="w-64">
                            <Download className="mr-2 h-4 w-4" />
                            {loading ? 'Preparing...' : 'Download PDF'}
                        </Button>
                    }
                </PDFDownloadLink>
            </div>
        </div>
    )
}
