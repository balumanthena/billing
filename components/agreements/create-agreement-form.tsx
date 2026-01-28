'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, FileText, UserIcon, ArrowLeft } from 'lucide-react'
import { createAgreement, updateAgreement } from '@/app/actions/agreements'
import Link from 'next/link'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface CreateAgreementFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    company: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parties: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any // For Edit Mode
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

interface ProjectParams {
    developerWebsite: string
    technologyStack: string
    totalPages: string
    monthlyTraffic: string
    blogLimit: string
    appointmentMode: string
    adminFeatures: string
    advancePercent: string
    milestonePercent: string
    finalPercent: string
    jurisdiction: string
    acceptancePeriod: string
    supportPeriod: string
    agreementVersion: string
    confidentiality?: boolean
    clauses: Clause[]
}

interface Clause {
    clause_key: string
    label: string
    enabled: boolean
    text: string
}

const DEFAULT_CLAUSES: Clause[] = [
    {
        clause_key: 'client_responsibilities',
        label: 'Client Responsibilities',
        enabled: true,
        text: "The Client shall provide necessary content, approvals, and access credentials in a timely manner. Delays caused by the Client regarding content or approvals shall extend the project timeline accordingly."
    },
    {
        clause_key: 'acceptance_period',
        label: 'Acceptance Period',
        enabled: true,
        text: "The Client shall have a period of 7 working days to review the deliverables. If no written objection is raised within this period, the deliverables shall be deemed accepted."
    },
    {
        clause_key: 'third_party_services',
        label: 'Third-Party Services',
        enabled: true,
        text: "The Services may rely on third-party platforms, APIs, or hosting providers. The Developer is not liable for any downtime, policy changes, or service failures caused by such third-party providers."
    },
    {
        clause_key: 'data_handling',
        label: 'Data & Compliance',
        enabled: true,
        text: "The Client is solely responsible for all content published or used. No sensitive personal data shall be stored unless explicitly agreed."
    },
    {
        clause_key: 'support_clause',
        label: 'Support & Maintenance',
        enabled: true,
        text: "The Developer provides a 30-day limited support period for bug fixes related to the original scope. No Annual Maintenance Contract (AMC) is included unless separately contracted."
    },
    {
        clause_key: 'confidentiality',
        label: 'Confidentiality',
        enabled: true,
        text: "Both Parties agree to maintain the confidentiality of proprietary information and shall not disclose it to any third party without prior written consent, except as required by law."
    },
    {
        clause_key: 'force_majeure',
        label: 'Force Majeure',
        enabled: true,
        text: "Neither Party shall be liable for any failure or delay in performance due to causes beyond their reasonable control (e.g., natural disasters, internet outages, acts of government)."
    }
]

export default function CreateAgreementForm({ company, parties, items, initialData }: CreateAgreementFormProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const isEditMode = !!initialData

    // 1. Client & Dates
    const [customerId, setCustomerId] = useState(initialData?.customer_id || '')
    const [agreementDate, setAgreementDate] = useState(initialData?.date || new Date().toISOString().split('T')[0])

    // 2. Services (Line Items)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineItems, setLineItems] = useState<any[]>(initialData?.services_snapshot || [])

    // 3. Project Parameters
    const defaultParams: ProjectParams = {
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
        acceptancePeriod: '7',
        supportPeriod: '30',
        agreementVersion: '1.0',
        clauses: DEFAULT_CLAUSES
    }

    const [params, setParams] = useState<ProjectParams>(initialData?.project_settings || defaultParams)

    // Tax Mode: 'exclusive' | 'inclusive'
    const [taxMode, setTaxMode] = useState(initialData?.tax_mode || 'exclusive')

    const selectedCustomer = parties.find(p => p.id === customerId)

    // Helpers
    const addItem = () => {
        setLineItems([...lineItems, {
            id: Math.random().toString(),
            item_id: '',
            description: '',
            sac_code: '',
            tax_rate: 18,
            unit_price: 0,
            quantity: 1,
            total_amount: 0
        }])
    }

    const removeItem = (index: number) => {
        const newItems = [...lineItems]
        newItems.splice(index, 1)
        setLineItems(newItems)
    }

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
        item.total_amount = (item.quantity || 1) * (item.unit_price || 0)
        setLineItems(newItems)
    }

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setParams(prev => ({ ...prev, [name]: value }))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateClause = (index: number, field: keyof Clause, value: any) => {
        const newClauses = [...params.clauses]
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newClauses[index][field] = value
        setParams(prev => ({ ...prev, clauses: newClauses }))
    }

    const calculateBreakdown = () => {
        let subtotal = 0
        let tax = 0
        let total = 0

        lineItems.forEach(item => {
            const qty = item.quantity || 1
            const price = item.unit_price || 0
            const taxRate = 18 // Fixed for now, or use item.tax_rate if dynamic

            const lineValue = qty * price

            if (taxMode === 'inclusive') {
                // lineValue is the Total. Back-calculate base.
                // Base + (Base * 0.18) = Total => Base * 1.18 = Total => Base = Total / 1.18
                const base = lineValue / 1.18
                const lineTax = lineValue - base

                subtotal += base
                tax += lineTax
                total += lineValue
            } else {
                // Exclusive: lineValue is Base.
                const lineTax = lineValue * (taxRate / 100)

                subtotal += lineValue
                tax += lineTax
                total += lineValue + lineTax
            }
        })

        return { subtotal, tax, total }
    }

    const { subtotal, tax, total } = calculateBreakdown()

    const isCustomTech = !TECH_STACKS.includes(params.technologyStack)
    const isCustomJurisdiction = !JURISDICTIONS.includes(params.jurisdiction)
    const isCustomPages = !PAGE_RANGES.includes(params.totalPages)
    const isCustomAdmin = !ADMIN_FEATURES.includes(params.adminFeatures)

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error'>('success')
    const [dialogMessage, setDialogMessage] = useState('')

    const handleSubmit = async () => {
        if (!customerId) {
            setDialogType('error')
            setDialogMessage('Please select a client.')
            setDialogOpen(true)
            return
        }
        if (lineItems.length === 0) {
            setDialogType('error')
            setDialogMessage('Please add at least one service.')
            setDialogOpen(true)
            return
        }

        setSubmitting(true)
        const formData = new FormData()
        formData.append('customer_id', customerId)
        formData.append('date', agreementDate)
        formData.append('grand_total', total.toString())
        formData.append('tax_mode', taxMode)
        formData.append('project_settings', JSON.stringify(params))
        formData.append('services_snapshot', JSON.stringify(lineItems))

        let res;
        if (isEditMode) {
            res = await updateAgreement(initialData.id, null, formData)
        } else {
            res = await createAgreement(null, formData)
        }

        if (res?.message && !res.success) {
            setDialogType('error')
            setDialogMessage(res.message)
            setDialogOpen(true)
            setSubmitting(false)
        } else {
            setDialogType('success')
            setDialogMessage(isEditMode ? 'Agreement updated successfully!' : 'Agreement created successfully!')
            setDialogOpen(true)
        }
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        if (dialogType === 'success') {
            router.push('/dashboard/agreements')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/agreements">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isEditMode ? 'Edit Agreement' : 'New Agreement'}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Box */}
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

                {/* Project Params Box */}
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
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TECH_STACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomTech && (
                                    <Input
                                        placeholder="Type custom tech stack..."
                                        value={params.technologyStack}
                                        onChange={(e) => setParams(prev => ({ ...prev, technologyStack: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
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
                                        <SelectValue placeholder="Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomJurisdiction && (
                                    <Input
                                        placeholder="Type jurisdiction..."
                                        value={params.jurisdiction}
                                        onChange={(e) => setParams(prev => ({ ...prev, jurisdiction: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Total Pages/Modules</Label>
                                <Select
                                    value={isCustomPages ? 'Other' : params.totalPages}
                                    onValueChange={(val) => {
                                        if (val === 'Other') setParams(prev => ({ ...prev, totalPages: '' }))
                                        else setParams(prev => ({ ...prev, totalPages: val }))
                                    }}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Pages..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_RANGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomPages && (
                                    <Input
                                        placeholder="Type quantity..."
                                        value={params.totalPages}
                                        onChange={(e) => setParams(prev => ({ ...prev, totalPages: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
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
                                        <SelectValue placeholder="Select Features..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ADMIN_FEATURES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCustomAdmin && (
                                    <Input
                                        placeholder="Type features..."
                                        value={params.adminFeatures}
                                        onChange={(e) => setParams(prev => ({ ...prev, adminFeatures: e.target.value }))}
                                        className="h-8 mt-1 border-blue-200"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Legal & Versioning */}
                        <div className="grid grid-cols-3 gap-4 pt-2 border-t mt-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Version</Label>
                                <Input
                                    name="agreementVersion"
                                    value={params.agreementVersion}
                                    onChange={handleParamChange}
                                    className="h-8"
                                    placeholder="1.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Acceptance (Days)</Label>
                                <Input
                                    name="acceptancePeriod"
                                    value={params.acceptancePeriod}
                                    onChange={handleParamChange}
                                    className="h-8"
                                    placeholder="7"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Support (Days)</Label>
                                <Input
                                    name="supportPeriod"
                                    value={params.supportPeriod}
                                    onChange={handleParamChange}
                                    className="h-8"
                                    placeholder="30"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2">
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

            {/* Clauses Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" /> Legal Clauses
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {params.clauses?.map((clause, index) => (
                        <div key={clause.clause_key} className="border p-4 rounded-md space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold">{clause.label}</Label>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500 mr-2">Enabled</label>
                                    <Input
                                        type="checkbox"
                                        checked={clause.enabled}
                                        onChange={(e) => updateClause(index, 'enabled', e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                </div>
                            </div>
                            {clause.enabled && (
                                <textarea
                                    className="w-full min-h-[60px] p-2 text-sm border rounded-md"
                                    value={clause.text}
                                    onChange={(e) => updateClause(index, 'text', e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>




            {/* Services */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-6">
                        <CardTitle className="text-base">Scope of Services</CardTitle>
                        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border">
                            <button
                                type="button"
                                onClick={() => setTaxMode('exclusive')}
                                className={`text-xs px-3 py-1 rounded-md transition-all ${taxMode === 'exclusive' ? 'bg-white shadow-sm font-medium text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Exclusive GST
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaxMode('inclusive')}
                                className={`text-xs px-3 py-1 rounded-md transition-all ${taxMode === 'inclusive' ? 'bg-white shadow-sm font-medium text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Inclusive GST
                            </button>
                        </div>
                    </div>
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
                                        No services added.
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

            {/* Footer Action */}
            <div className="flex justify-end gap-8 items-center py-6 border-t bg-slate-50/50 p-6 rounded-lg">
                <div className="space-y-1 text-right min-w-[200px]">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>GST (18%):</span>
                        <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-900 border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium pt-1">
                        {taxMode} of Taxes
                    </p>
                </div>
                <div className="h-12 w-px bg-slate-200 mx-4"></div>
                <Button size="lg" disabled={submitting || !customerId} onClick={handleSubmit} className="h-12 px-8 text-base">
                    <Save className="mr-2 h-5 w-5" />
                    {submitting ? 'Saving...' : isEditMode ? 'Update Agreement' : 'Save Agreement'}
                </Button>
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={dialogType === 'success' ? "text-green-600" : "text-red-600"}>
                            {dialogType === 'success' ? "Success" : "Error"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleDialogClose}>
                            {dialogType === 'success' ? "Done" : "Close"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
