'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice } from '@/app/actions/invoices'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Save, Loader2, CalendarIcon, UserIcon, FileText } from 'lucide-react'
import { calculateInvoice, InvoiceItem } from '@/lib/invoice-calculator'
import { useActionState } from 'react'

// Define types for props
interface CreateInvoiceFormProps {
    company: any
    parties: any[]
    items: any[]
    nextInvoiceNumber: string
}

const initialState = {
    message: ''
}

export default function CreateInvoiceForm({ company, parties, items, nextInvoiceNumber }: CreateInvoiceFormProps) {
    const router = useRouter()
    const [customerId, setCustomerId] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')

    // Line items state
    const [lineItems, setLineItems] = useState<any[]>([])

    // Calculated totals
    const [totals, setTotals] = useState({
        subtotal: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        grandTotal: 0
    })

    const [state, formAction, isPending] = useActionState(createInvoice, initialState)

    // Derived state for selected customer
    const selectedCustomer = parties.find(p => p.id === customerId)

    useEffect(() => {
        if (!company || !selectedCustomer) return

        // Calculate totals whenever line items or customer changes (because of state code)
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
            id: Math.random().toString(), // temp id
            item_id: '',
            description: '',
            sac_code: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 18,
            taxable: 0 // placeholder
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
        if (date && !dueDate) {
            const d = new Date(date)
            d.setDate(d.getDate() + 15) // Default 15 days
            setDueDate(d.toISOString().split('T')[0])
        }
    }, [date])


    return (
        <form action={formAction} className="space-y-6">
            {/* Hidden input to pass all data as JSON */}
            <input type="hidden" name="data" value={JSON.stringify({
                customerId,
                invoiceNumber,
                date,
                dueDate,
                lineItems: calculateInvoice(lineItems, company?.state_code || '', selectedCustomer?.state_code || '').lineItems,
                totals
            })} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invoice Details Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" /> Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                            <Input
                                value={invoiceNumber}
                                onChange={e => setInvoiceNumber(e.target.value)}
                                required
                                className="font-mono font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                            <div className="relative">
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Due Date</Label>
                            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Details Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-blue-600" /> Customer
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

            {/* Line Items Card */}
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
                                    <div className="grid grid-cols-12 gap-3 items-end">
                                        <div className="col-span-4">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>
                                            <div className="flex items-center border rounded-md h-10">
                                                <button
                                                    type="button"
                                                    className="w-8 h-full flex items-center justify-center bg-muted/50 hover:bg-muted border-r disabled:opacity-50"
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
                                                    className="w-8 h-full flex items-center justify-center bg-muted/50 hover:bg-muted border-l"
                                                    onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-span-4">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Price</Label>
                                            <Input
                                                type="number"
                                                value={isNaN(item.unit_price) ? '' : item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                                className="h-10 text-right pr-2"
                                            />
                                        </div>

                                        <div className="col-span-4 text-right">
                                            <Label className="text-xs text-muted-foreground mb-1 block">Total</Label>
                                            <div className="h-10 flex items-center justify-end font-bold text-base">
                                                ₹{(item.quantity * item.unit_price).toFixed(0)}
                                            </div>
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
                                <span className="font-bold text-2xl text-blue-600">₹{totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {state?.message && state.message !== 'success' && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-600 font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                    {state.message}
                </div>
            )}

            <div className="flex justify-end gap-4 pb-8">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" size="lg" disabled={isPending || !customerId || lineItems.length === 0} className="w-48">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Invoice
                </Button>
            </div>
        </form>
    )
}
