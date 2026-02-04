'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice, updateInvoice } from '@/app/actions/invoices'
import { updateMasterInvoice } from '@/app/actions/master-invoices'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, Loader2, CalendarIcon, UserIcon, FileText, Lock, Info, CircleHelp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { amountToWords } from '@/lib/number-to-words'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { calculateInvoice, InvoiceItem } from '@/lib/invoice-calculator'
import { useActionState } from 'react'
import { Badge } from "@/components/ui/badge"

// ... (existing imports)

// ... (existing imports)

// Define types for props

// Define types for props
interface CreateInvoiceFormProps {
    company: any
    parties: any[]
    items: any[]
    nextInvoiceNumber: string
    initialData?: any // For Edit Mode
    invoiceId?: string // For Edit Mode
}

const initialState = {
    message: ''
}

export default function CreateInvoiceForm({ company, parties, items, nextInvoiceNumber, initialData, invoiceId }: CreateInvoiceFormProps) {
    const router = useRouter()
    const isEditMode = !!initialData

    // State Initialization
    const [customerId, setCustomerId] = useState(initialData?.customer_id || '')
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || initialData?.master_invoice_number || nextInvoiceNumber)

    // Dates - Initialize empty to prevent hydration mismatch (server vs client time)
    const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : '')
    const [dueDate, setDueDate] = useState(initialData?.due_date ? initialData.due_date.split('T')[0] : '')

    // Line items state (For Standard Invoice)
    const [lineItems, setLineItems] = useState<any[]>(
        initialData?.invoice_items?.map((item: any) => ({
            ...item,
            taxable: item.taxable_amount,
            cgst: item.cgst_amount,
            sgst: item.sgst_amount,
            igst: item.igst_amount,
            total: item.total_amount
        })) || []
    )

    // Calculated totals for Standard Invoice
    const [totals, setTotals] = useState({
        subtotal: initialData?.subtotal || 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        grandTotal: initialData?.grand_total || 0
    })

    // MASTER INVOICE STATE
    const [isMaster, setIsMaster] = useState(initialData?.master_invoice_number ? true : false)
    const [contractTitle, setContractTitle] = useState(initialData?.title || '')
    const [contractTotal, setContractTotal] = useState<number>(initialData?.total_amount || 0)

    // Initialize empty for hydration safety
    const [startDate, setStartDate] = useState(initialData?.start_date ? initialData.start_date.split('T')[0] : '')
    const [endDate, setEndDate] = useState(initialData?.end_date ? initialData.end_date.split('T')[0] : '')

    // Hydration safe default dates
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        if (!date && !initialData) setDate(today)
        if (!startDate && !initialData) setStartDate(today)
    }, [])

    // Tax Logic
    const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive'>('exclusive')

    // Derived Tax Values
    const taxableBase = taxMode === 'exclusive'
        ? contractTotal
        : (contractTotal ? parseFloat((contractTotal / 1.18).toFixed(2)) : 0)

    const gstTotalAmount = parseFloat((taxableBase * 0.18).toFixed(2))
    const finalContractTotal = parseFloat((taxableBase + gstTotalAmount).toFixed(2))

    // Parse Initial Phases if Master
    const initialPhases = initialData?.phases ? initialData.phases.map((p: any) => ({
        number: p.phase_number,
        label: p.phase_label,
        percentage: 0, // We can calculate this if needed
        amount: p.subtotal || p.grand_total, // Use subtotal as base amount logic
        dueDate: p.due_date ? p.due_date.split('T')[0] : '',
        status: p.status,
        id: p.id
    })) : [
        { number: 1, label: 'Phase 1', percentage: 40, amount: 0, dueDate: '' },
        { number: 2, label: 'Phase 2', percentage: 60, amount: 0, dueDate: '' }
    ]

    const [phases, setPhases] = useState<any[]>(initialPhases)

    // Helper to distribute total to phases based on percentage (of Taxable Base)
    useEffect(() => {
        // Only auto-distribute if NOT editing an existing valid set, OR if we want live updates.
        // If editing, we trust the loaded amounts unless logic triggers.
        // Here we trigger only if user changes percentage manually or total changes significantly and it's not a reload.
        if (!isEditMode && taxableBase > 0) {
            const updatedPhases = phases.map(p => ({
                ...p,
                amount: parseFloat(((taxableBase * p.percentage) / 100).toFixed(2))
            }))

            const currentTotal = phases.reduce((sum, p) => sum + (p.amount || 0), 0)
            const newTotal = updatedPhases.reduce((sum, p) => sum + (p.amount || 0), 0)

            // Only update if difference is meaningful to separate manual amount edits from auto percentage
            // This is a bit tricky. For now, simple rule:
            if (Math.abs(currentTotal - newTotal) > 0.01) {
                // But wait, if I edit amount, this effect might revert it if I don't update percentage.
                // So we need to be careful. The dependency array is key.
                setPhases(updatedPhases)
            }
        }
    }, [taxableBase, isEditMode]) // Removed phases from dependency to avoid loop

    // Derived state for selected customer
    const selectedCustomer = parties.find(p => p.id === customerId)

    // Select Action based on Mode
    let action = createInvoice
    if (isEditMode && invoiceId) {
        if (isMaster) {
            action = updateMasterInvoice.bind(null, invoiceId)
        } else {
            action = updateInvoice.bind(null, invoiceId)
        }
    }

    const [state, formAction, isPending] = useActionState(action, initialState)

    // Handle Success Redirect
    useEffect(() => {
        if (state.message === 'success') {
            router.push('/dashboard/invoices')
        }
    }, [state.message, router])

    // Calculate Totals for Standard Invoices
    useEffect(() => {
        if (!company || !selectedCustomer) return

        const calc = calculateInvoice(
            lineItems,
            company.state_code,
            selectedCustomer.state_code
        )

        setTotals({
            subtotal: calc.subtotal,
            totalCGST: calc.totalCGST,
            totalSGST: calc.totalSGST,
            totalIGST: calc.totalIGST,
            grandTotal: calc.grandTotal
        })

    }, [lineItems, customerId, company, selectedCustomer])

    const addItem = () => {
        setLineItems([...lineItems, {
            id: Math.random().toString(),
            item_id: '',
            description: '',
            sac_code: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 18,
            taxable: 0
        }])
    }

    const removeItem = (index: number) => {
        const newItems = [...lineItems]
        newItems.splice(index, 1)
        setLineItems(newItems)
    }

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
            // @ts-ignore
            item[field] = value
        }
        setLineItems(newItems)
    }

    // Default Due Date Logic
    useEffect(() => {
        if (date && !dueDate && !isEditMode) {
            const d = new Date(date)
            d.setDate(d.getDate() + 15) // Default 15 days
            setDueDate(d.toISOString().split('T')[0])
        }
    }, [date, dueDate, isEditMode])

    // Phase Management
    const updatePhase = (index: number, field: string, value: any) => {
        // Prevent editing the last phase directly (it's the balancer)
        if (index === phases.length - 1 && (field === 'percentage' || field === 'amount')) return

        let newPhases = [...phases]
        const phase = newPhases[index]

        // LOCK CHECK
        if (phase.status && phase.status !== 'draft') return;

        if (field === 'percentage') {
            // 1. Calculate sum of all OTHER phases (excluding current and last)
            // If we are editing the last phase, we shouldn't be here due to check above.

            const lastIndex = newPhases.length - 1;
            let sumOthersExcludingCurrent = 0;

            newPhases.forEach((p, i) => {
                if (i !== index && i !== lastIndex) {
                    sumOthersExcludingCurrent += (p.percentage || 0);
                }
            });

            // 2. Validate and Clamp Input
            // The max this phase can be is 100 - sumOthersExcludingCurrent.
            // This leaves 0 for the last phase, which is the minimum allowed.
            let maxAllowed = 100 - sumOthersExcludingCurrent;
            let newPercentage = value;

            if (newPercentage > maxAllowed) {
                newPercentage = parseFloat(maxAllowed.toFixed(2));
            }
            if (newPercentage < 0) newPercentage = 0;

            // 3. Update current phase
            newPhases[index] = {
                ...phase,
                percentage: newPercentage,
                amount: parseFloat(((taxableBase * newPercentage) / 100).toFixed(2))
            };

            // 4. Force Update Last Phase (Balancer)
            const sumNonLast = newPhases.reduce((sum, p, i) => {
                if (i === lastIndex) return sum;
                return sum + (p.percentage || 0);
            }, 0);

            const remaining = parseFloat(Math.max(0, 100 - sumNonLast).toFixed(2));

            newPhases[lastIndex] = {
                ...newPhases[lastIndex],
                percentage: remaining,
                amount: parseFloat(((taxableBase * remaining) / 100).toFixed(2))
            };

        } else if (field === 'amount') {
            // Calculate percentage of Taxable Base
            // Clamp amount? 
            // If user inputs amount > available text, we clamp percentage.

            let impliedPercentage = 0;
            if (taxableBase > 0) {
                impliedPercentage = parseFloat(((value / taxableBase) * 100).toFixed(2));
            }

            // Now delegate to the percentage logic by calling recursively?
            // Or just repeat logic. Safer to repeat logic to avoid state async issues if we were setting state.
            // But here we are just calculating locally.

            const lastIndex = newPhases.length - 1;

            let sumOthersExcludingCurrent = 0;
            newPhases.forEach((p, i) => {
                if (i !== index && i !== lastIndex) {
                    sumOthersExcludingCurrent += (p.percentage || 0);
                }
            });

            let maxAllowed = 100 - sumOthersExcludingCurrent;
            let newPercentage = impliedPercentage;

            if (newPercentage > maxAllowed) {
                newPercentage = parseFloat(maxAllowed.toFixed(2));
                // Also clamp the amount to match the clamped percentage
                value = parseFloat(((taxableBase * newPercentage) / 100).toFixed(2));
            }

            newPhases[index] = {
                ...phase,
                amount: value,
                percentage: newPercentage
            };

            // Update Last Phase
            const sumNonLast = newPhases.reduce((sum, p, i) => {
                if (i === lastIndex) return sum;
                return sum + (p.percentage || 0);
            }, 0);

            const remaining = parseFloat(Math.max(0, 100 - sumNonLast).toFixed(2));

            newPhases[lastIndex] = {
                ...newPhases[lastIndex],
                percentage: remaining,
                amount: parseFloat(((taxableBase * remaining) / 100).toFixed(2))
            };

        } else {
            newPhases[index] = { ...newPhases[index], [field]: value }
        }

        setPhases(newPhases)
    }

    const addPhase = () => {
        setPhases([...phases, {
            number: phases.length + 1,
            label: '',
            percentage: 0,
            amount: 0,
            dueDate: '',
            status: 'draft'
        }])
    }

    const removePhase = (index: number) => {
        const phase = phases[index]
        if (phase.status && phase.status !== 'draft') {
            alert('Cannot remove a finalized phase')
            return;
        }

        const newPhases = phases.filter((_, i) => i !== index).map((p, i) => ({
            ...p,
            number: i + 1
        }))
        setPhases(newPhases)
    }

    //         totalSGST: calc.totalSGST, // Fixed: changed from calc.sgst
    //         totalIGST: calc.totalIGST,
    //         grandTotal: calc.grandTotal
    //     })

    // }, [lineItems, customerId, company, selectedCustomer])

    // const addItem = () => {
    //     setLineItems([...lineItems, {
    //         id: Math.random().toString(), // temp id
    //         item_id: '',
    //         description: '',
    //         sac_code: '',
    //         quantity: 1,
    //         unit_price: 0,
    //         tax_rate: 18,
    //         taxable: 0 // placeholder
    //     }])
    // }

    // const removeItem = (index: number) => {
    //     const newItems = [...lineItems]
    //     newItems.splice(index, 1)
    //     setLineItems(newItems)
    // }

    // const updateItem = (index: number, field: string, value: any) => {
    //     const newItems = [...lineItems]
    //     const item = newItems[index]

    //     if (field === 'item_id') {
    //         const masterItem = items.find(i => i.id === value)
    //         if (masterItem) {
    //             item.item_id = masterItem.id
    //             item.description = masterItem.name
    //             item.sac_code = masterItem.sac_code
    //             item.unit_price = masterItem.unit_price
    //             item.tax_rate = masterItem.tax_rate
    //         }
    //     } else {
    //         // @ts-ignore
    //         item[field] = value
    //     }

    //     setLineItems(newItems)
    // }

    // // Default Due Date Logic
    // useEffect(() => {
    //     if (date && !dueDate && !isEditMode) {
    //         const d = new Date(date)
    //         d.setDate(d.getDate() + 15) // Default 15 days
    //         setDueDate(d.toISOString().split('T')[0])
    //     }
    // }, [date, dueDate, isEditMode])


    // const updatePhase = (index: number, field: string, value: any) => {
    //     const newPhases = [...phases]
    //     const phase = newPhases[index]

    //     // LOCK CHECK
    //     if (phase.status && phase.status !== 'draft') {
    //         return; // Prevent edits
    //     }

    //     // @ts-ignore
    //     phase[field] = value

    //     // Auto-recalc amount if percentage changed
    //     if (field === 'percentage' && contractTotal > 0) {
    //         phase.amount = parseFloat(((contractTotal * value) / 100).toFixed(2))
    //     }

    //     // Auto-recalc percentage if amount changed
    //     if (field === 'amount' && contractTotal > 0) {
    //         phase.percentage = parseFloat(((value / contractTotal) * 100).toFixed(2))
    //     }

    //     setPhases(newPhases)
    // }

    // const addPhase = () => {
    //     setPhases([...phases, {
    //         number: phases.length + 1,
    //         label: '', // Empty default so user selects from dropdown
    //         percentage: 0,
    //         amount: 0,
    //         dueDate: '',
    //         status: 'draft'
    //     }])
    // }

    // const removePhase = (index: number) => {
    //     const phase = phases[index]
    //     if (phase.status && phase.status !== 'draft') {
    //         alert('Cannot remove a finalized phase')
    //         return;
    //     }

    //     const newPhases = phases.filter((_, i) => i !== index).map((p, i) => ({
    //         ...p,
    //         number: i + 1
    //     }))
    //     setPhases(newPhases)
    // }

    const phasesTotal = phases.reduce((acc, p) => acc + (p.amount || 0), 0)
    const isPhasesValid = Math.abs(phasesTotal - taxableBase) < 1 // Tolerance

    return (
        <form action={formAction} className="space-y-6">
            {/* Hidden input to pass all data as JSON */}
            <input type="hidden" name="data" value={JSON.stringify({
                companyId: company?.id,
                customerId,
                invoiceNumber, // Master Number if isMaster
                date,
                dueDate,
                lineItems: calculateInvoice(lineItems, company?.state_code || '', selectedCustomer?.state_code || '').lineItems,
                totals,
                // Master Invoice Data
                isMaster,
                masterNumber: invoiceNumber, // Using same field for now
                title: contractTitle,
                startDate,
                endDate,
                totalAmount: finalContractTotal, // Always send Grand Total as the Contract Value
                phases: phases.map(p => {
                    const subtotal = p.amount;
                    const tax = parseFloat((subtotal * 0.18).toFixed(2));
                    const total = parseFloat((subtotal + tax).toFixed(2));
                    return {
                        ...p,
                        invoiceNumber: `${invoiceNumber}-P${p.number}`,
                        subtotal: subtotal,
                        tax_total: tax,
                        grand_total: total
                    }
                })
            })} />

            {!isEditMode && (
                <div className="flex justify-center mb-8">
                    <Tabs defaultValue={isMaster ? "master" : "standard"} onValueChange={v => setIsMaster(v === 'master')} className="w-auto">
                        <TabsList className="bg-secondary/20 p-1 rounded-full h-auto">
                            <TabsTrigger value="standard" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Standard Invoice</TabsTrigger>
                            <TabsTrigger value="master" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Proprietary Master Invoice</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {isEditMode && (
                <div className="flex justify-center mb-6">
                    <Badge variant="outline" className="text-lg px-4 py-1">
                        {isMaster ? 'Editing Master Contract' : 'Editing Invoice'}
                    </Badge>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invoice Details Card */}
                {isMaster ? (
                    <Card className="md:col-span-2 border-primary/20 bg-card/40 backdrop-blur-md shadow-lg">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-primary/10 rounded-t-xl">
                            <CardTitle className="text-base flex items-center gap-2 text-foreground font-semibold">
                                <FileText className="h-4 w-4 text-primary" /> Master Contract Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-muted-foreground">Contract Title / Description</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Website Development Project"
                                        value={contractTitle}
                                        onChange={e => setContractTitle(e.target.value)}
                                        className="bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-inner h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-muted-foreground">Master ID</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Lock className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Unique contract identifier. Cannot be changed once created.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Input
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                        className="font-mono bg-secondary/30 border-0 shadow-inner h-11"
                                        readOnly={isEditMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Total Value (₹) {taxMode === 'inclusive' ? '(Incl. GST)' : '(Excl. GST)'}</Label>
                                    <Input
                                        type="number"
                                        value={contractTotal || ''}
                                        onChange={e => setContractTotal(parseFloat(e.target.value))}
                                        className="font-bold text-lg bg-secondary/30 border-0 shadow-inner h-11 md:h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-muted-foreground">Tax Mode</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Exclusive: GST is added on top. Inclusive: GST is extracted from total.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Select value={taxMode} onValueChange={(v: any) => setTaxMode(v)}>
                                        <SelectTrigger className="bg-secondary/30 border-0 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="exclusive">Exclusive (Add GST)</SelectItem>
                                            <SelectItem value="inclusive">Inclusive (Extract GST)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 bg-card/40 p-4 rounded-xl border border-primary/10 grid grid-cols-3 gap-6 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-1">Taxable Value</span>
                                        <span className="font-mono font-medium text-lg">₹{taxableBase.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs mb-1">GST (18%)</span>
                                        <span className="font-mono font-medium text-primary text-lg">₹{gstTotalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-muted-foreground block text-xs mb-1">Total Contract Value</span>
                                        <span className="font-mono font-bold text-xl text-foreground">₹{finalContractTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Start Date</Label>
                                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-secondary/30 border-0 text-sm h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">End Date</Label>
                                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-secondary/30 border-0 text-sm h-10" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" /> Invoice Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Invoice Number</Label>
                                    <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required readOnly={isEditMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Customer Details Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-primary" /> Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Select value={customerId} onValueChange={setCustomerId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Customer" />
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
                                <div>GSTIN: {selectedCustomer.gstin}</div>
                                <div>State: {selectedCustomer.state} ({selectedCustomer.state_code})</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Line Items Card OR Phase Builder */}
            {isMaster ? (
                <Card className="min-h-[400px] flex flex-col border-primary/20 shadow-lg bg-card/40 backdrop-blur-md">
                    <CardHeader className="p-6 bg-primary/5 border-b border-primary/10 flex flex-row justify-between items-center rounded-t-xl">
                        <div>
                            <CardTitle className="text-base text-foreground font-semibold">Phase Configuration</CardTitle>
                            <CardDescription className="text-muted-foreground flex items-center gap-2 mt-1">
                                Split percentages automatically balance to maintain 100% allocation.
                            </CardDescription>
                        </div>
                        <Button type="button" size="sm" onClick={addPhase} variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                            <Plus className="h-4 w-4 mr-2" /> Add Phase
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <Table className="border-separate border-spacing-y-2">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] text-center border-none">#</TableHead>
                                    <TableHead className="w-[100px] border-none">Phase Name</TableHead>
                                    <TableHead className="border-none">Milestone / Description</TableHead>
                                    <TableHead className="w-[100px] border-none">Split %</TableHead>
                                    <TableHead className="w-[120px] text-right border-none">Taxable (₹)</TableHead>
                                    <TableHead className="w-[100px] text-right text-xs text-muted-foreground border-none">GST (18%)</TableHead>
                                    <TableHead className="w-[120px] text-right font-bold border-none">Total (₹)</TableHead>
                                    <TableHead className="w-[150px] border-none">Due Date</TableHead>
                                    <TableHead className="w-[50px] border-none"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {phases.map((phase, index) => {
                                    const isLocked = phase.status && phase.status !== 'draft';
                                    const isBalancer = index === phases.length - 1;
                                    const gstVal = parseFloat((phase.amount * 0.18).toFixed(2));
                                    const totalVal = parseFloat((phase.amount + gstVal).toFixed(2));

                                    return (
                                        <TableRow key={index} className={`hover:bg-card/60 transition-colors rounded-lg overflow-hidden ${isLocked ? 'bg-muted/40' : (isBalancer ? 'bg-primary/5' : 'bg-secondary/20 shadow-sm border border-border/50')}`}>
                                            <TableCell className="text-center font-bold text-muted-foreground rounded-l-lg border-y border-l border-border/20">
                                                {isLocked && <Lock className="h-3 w-3 inline text-primary mr-1" />}
                                                {phase.number}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-primary border-y border-border/20">Phase {phase.number}</TableCell>
                                            <TableCell className="border-y border-border/20">
                                                <Select
                                                    value={phase.label}
                                                    onValueChange={(val) => updatePhase(index, 'label', val)}
                                                    disabled={isLocked}
                                                >
                                                    <SelectTrigger className="h-9 bg-transparent border-0 ring-1 ring-border/30 focus:ring-primary/50">
                                                        <SelectValue placeholder="Select Milestone" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Milestones</SelectLabel>
                                                            <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                                                            <SelectItem value="Project Completion">Project Completion</SelectItem>
                                                        </SelectGroup>
                                                        <SelectSeparator />
                                                        <SelectGroup>
                                                            <SelectLabel>Development Stages</SelectLabel>
                                                            <SelectItem value="Beta Release">Beta Release</SelectItem>
                                                            <SelectItem value="UAT Sign-off">UAT Sign-off</SelectItem>
                                                            <SelectItem value="Implementation Milestone">Implementation Milestone</SelectItem>
                                                        </SelectGroup>
                                                        <SelectSeparator />
                                                        <SelectGroup>
                                                            <SelectLabel>Services</SelectLabel>
                                                            <SelectItem value="Consulting Fee">Consulting Fee</SelectItem>
                                                            <SelectItem value="Training & Handover">Training & Handover</SelectItem>
                                                            <SelectItem value="Retention Release">Retention Release</SelectItem>
                                                        </SelectGroup>
                                                        <SelectSeparator />
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="border-y border-border/20">
                                                <div className="relative flex items-center">
                                                    <Input
                                                        type="number"
                                                        value={phase.percentage || ''}
                                                        onChange={e => updatePhase(index, 'percentage', parseFloat(e.target.value))}
                                                        className={`h-9 pr-6 bg-transparent border-0 ring-1 ring-border/30 focus-visible:ring-primary/50 ${isBalancer ? 'text-primary font-bold' : ''}`}
                                                        placeholder="0"
                                                        disabled={isLocked || isBalancer}
                                                    />
                                                    <span className="absolute right-2 text-xs text-muted-foreground">%</span>
                                                    {isBalancer && (
                                                        <div className="absolute -right-6">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Lock className="h-3 w-3 text-primary/60 cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>This phase automatically adjusts to balance the contract.</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-y border-border/20">
                                                <Input
                                                    type="number"
                                                    value={phase.amount || ''}
                                                    onChange={e => updatePhase(index, 'amount', parseFloat(e.target.value))}
                                                    className="h-9 text-right font-mono bg-transparent border-0 ring-1 ring-border/30 focus-visible:ring-primary/50"
                                                    placeholder="0.00"
                                                    disabled={isLocked || isBalancer}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground font-mono text-xs border-y border-border/20">
                                                {gstVal.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground font-mono border-y border-border/20">
                                                {totalVal.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="border-y border-border/20">
                                                <Input
                                                    type="date"
                                                    value={phase.dueDate}
                                                    onChange={e => updatePhase(index, 'dueDate', e.target.value)}
                                                    className="h-9 bg-transparent border-0 ring-1 ring-border/30 focus-visible:ring-primary/50"
                                                    disabled={isLocked}
                                                />
                                            </TableCell>
                                            <TableCell className="rounded-r-lg border-y border-r border-border/20 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removePhase(index)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                    disabled={isLocked}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="bg-primary/5 border-t border-primary/10 p-0 flex flex-col rounded-b-xl">
                        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 w-full">
                            <div className="flex flex-col gap-1 w-full md:w-auto">
                                <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
                                    <div>
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold block mb-1">Taxable Allocated</span>
                                        <span className="font-mono font-bold text-foreground text-lg">
                                            ₹{phasesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="h-10 w-px bg-border/50 hidden md:block"></div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold block mb-1">GST (18%)</span>
                                        <span className="font-mono font-bold text-primary text-lg">
                                            ₹{(phasesTotal * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="h-10 w-px bg-border/50 hidden md:block"></div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold block mb-1">Net Total Amount</span>
                                        <span className="font-mono font-bold text-foreground text-2xl tracking-tight">
                                            ₹{(phasesTotal * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-medium bg-card/50 border-border/50 px-3 py-1 shadow-sm gap-2">
                                    <Lock className="h-3 w-3 text-primary" /> Auto-balanced
                                </Badge>
                            </div>
                        </div>

                        {/* Amount in Words - Legal Confirmation */}
                        <div className="w-full bg-card/20 border-t border-dashed border-border/40 px-6 py-4 flex flex-col items-end gap-1">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground select-none">Total Amount (In Words):</span>
                            <span className="font-serif italic text-foreground/80 text-base leading-relaxed">
                                {amountToWords(parseFloat((phasesTotal * 1.18).toFixed(2)))}
                            </span>
                        </div>
                    </CardFooter>
                </Card>
            ) : (
                /* Line Items Card */
                <Card className="min-h-[400px] flex flex-col">
                    <CardHeader className="p-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-base">Line Items</CardTitle>
                            <CardDescription>Add products or services to this invoice.</CardDescription>
                        </div>
                        <Button type="button" size="sm" onClick={addItem} className="hidden md:flex">
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Table className="table-fixed">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="w-[30%]">Item / Service</TableHead>
                                        <TableHead className="w-[12%]">SAC</TableHead>
                                        <TableHead className="w-[10%]">Qty</TableHead>
                                        <TableHead className="w-[15%]">Price (₹)</TableHead>
                                        <TableHead className="w-[10%]">Tax %</TableHead>
                                        <TableHead className="w-[15%] text-right">Total (₹)</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                                No items added. Click "Add Item" to start.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {lineItems.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="align-top pt-3">
                                                <Select
                                                    value={item.item_id}
                                                    onValueChange={(val) => updateItem(index, 'item_id', val)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select Item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {items.map(i => (
                                                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="h-8 mt-2 text-xs"
                                                    placeholder="Description (Optional)"
                                                />
                                            </TableCell>
                                            <TableCell className="align-top pt-3">
                                                <Input
                                                    value={item.sac_code}
                                                    onChange={(e) => updateItem(index, 'sac_code', e.target.value)}
                                                    className="h-9"
                                                />
                                            </TableCell>
                                            <TableCell className="align-top pt-3">
                                                <Input
                                                    type="number"
                                                    value={isNaN(item.quantity) ? '' : item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                    className="h-9 text-center"
                                                    min={1}
                                                />
                                            </TableCell>
                                            <TableCell className="align-top pt-3">
                                                <Input
                                                    type="number"
                                                    value={isNaN(item.unit_price) ? '' : item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                    className="h-9 text-right"
                                                />
                                            </TableCell>
                                            <TableCell className="align-top pt-3">
                                                <div className="flex items-center h-9 px-3 border rounded-md bg-muted text-sm justify-center">
                                                    {item.tax_rate}%
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium align-top pt-4">
                                                ₹{(item.quantity * item.unit_price).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="align-top pt-3">
                                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600" onClick={() => removeItem(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-4 p-4">
                            {lineItems.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    No items added. Tap "Add Item".
                                </div>
                            )}
                            {lineItems.map((item, index) => (
                                <Card key={item.id} className="overflow-hidden border-2">
                                    <CardContent className="p-4 space-y-4">
                                        {/* Header: Item & Delete */}
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 space-y-2">
                                                <Select
                                                    value={item.item_id}
                                                    onValueChange={(val) => updateItem(index, 'item_id', val)}
                                                >
                                                    <SelectTrigger className="h-10 font-medium">
                                                        <SelectValue placeholder="Select Item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {items.map(i => (
                                                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="h-8 text-xs"
                                                    placeholder="Description (Optional)"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-red-600"
                                                onClick={() => removeItem(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* SAC & Tax */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground mb-1 block">SAC Code</Label>
                                                <Input
                                                    value={item.sac_code}
                                                    onChange={(e) => updateItem(index, 'sac_code', e.target.value)}
                                                    className="h-8"
                                                    placeholder="SAC"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label className="text-xs text-muted-foreground mb-1 block">Tax %</Label>
                                                <div className="flex items-center h-8 px-3 border rounded-md bg-muted text-sm justify-center font-medium">
                                                    {item.tax_rate}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity, Price, Total */}
                                        <div className="grid grid-cols-2 gap-4 items-end">
                                            <div className="col-span-1">
                                                <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>
                                                <div className="flex items-center border rounded-md h-10">
                                                    <button
                                                        type="button"
                                                        className="w-10 h-full flex items-center justify-center bg-muted/50 hover:bg-muted border-r disabled:opacity-50"
                                                        onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="w-full h-full text-center border-none focus:ring-0 p-0 text-sm"
                                                        value={isNaN(item.quantity) ? '' : item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                        min={1}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="w-10 h-full flex items-center justify-center bg-muted/50 hover:bg-muted border-l"
                                                        onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="col-span-1">
                                                <Label className="text-xs text-muted-foreground mb-1 block">Price</Label>
                                                <Input
                                                    type="number"
                                                    value={isNaN(item.unit_price) ? '' : item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                    className="h-10 text-right pr-2"
                                                />
                                            </div>

                                            <div className="col-span-2 pt-3 border-t mt-2 flex justify-between items-center bg-slate-50/50 -mx-4 px-4 pb-1">
                                                <span className="text-sm font-medium text-muted-foreground">Total</span>
                                                <span className="text-lg font-bold">
                                                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>

                    {/* Totals Section */}
                    {/* Totals Section */}
                    <div className="bg-slate-50 border-t p-6">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            {/* Mobile: Full Width Add Item */}
                            <div className="w-full md:hidden">
                                <Button type="button" size="lg" variant="outline" className="w-full border-dashed border-2" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Another Item
                                </Button>
                            </div>

                            <div className="w-full md:w-1/3 space-y-3">
                                {/* Mobile Header for Totals */}
                                <h4 className="font-semibold md:hidden pb-2 mb-2 border-b">Summary</h4>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>

                                {totals.totalIGST > 0 ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IGST</span>
                                        <span>₹{totals.totalIGST.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">CGST</span>
                                            <span>₹{totals.totalCGST.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">SGST</span>
                                            <span>₹{totals.totalSGST.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <span className="font-bold text-lg">Grand Total</span>
                                    <span className="font-bold text-2xl text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {state?.message && state.message !== 'success' && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-600 font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                    {state.message}
                </div>
            )}

            <div className="flex justify-end gap-4 pb-8">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" size="lg" disabled={isPending || !customerId || (!isMaster && lineItems.length === 0)} className="w-48">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isMaster ? 'Create Contract' : 'Save Invoice'}
                </Button>
            </div>
        </form>
    )
}
