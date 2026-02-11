'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createQuotation } from "@/app/actions/quotations"
import { getParties } from "@/app/actions/parties"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function NewQuotationPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<any[]>([])

    // Form State
    const [clientId, setClientId] = useState("")
    const [projectTitle, setProjectTitle] = useState("")
    const [scopeOfWork, setScopeOfWork] = useState("")
    const [validUntil, setValidUntil] = useState("")

    // Line Items
    const [items, setItems] = useState([
        { id: 1, description: "", quantity: 1, unitPrice: 0, taxRate: 18, taxAmount: 0, total: 0 }
    ])

    useEffect(() => {
        // Load clients
        getParties().then(data => {
            const customers = data.filter((p: any) => p.type === 'customer')
            setClients(customers)
        })

        // Default valid until = +15 days
        const d = new Date()
        d.setDate(d.getDate() + 15)
        setValidUntil(d.toISOString().split('T')[0])
    }, [])

    // Calculations
    const calculateTotals = () => {
        let subtotal = 0
        let taxTotal = 0
        let grandTotal = 0

        items.forEach(item => {
            const taxable = item.quantity * item.unitPrice
            const tax = taxable * (item.taxRate / 100)
            subtotal += taxable
            taxTotal += tax
            grandTotal += (taxable + tax)
        })

        return { subtotal, taxTotal, grandTotal }
    }

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value }
                // Recalc row total
                const taxable = updated.quantity * updated.unitPrice
                updated.taxAmount = taxable * (updated.taxRate / 100)
                updated.total = taxable + updated.taxAmount
                return updated
            }
            return item
        }))
    }

    const addItem = () => {
        setItems([...items, {
            id: Date.now(),
            description: "",
            quantity: 1,
            unitPrice: 0,
            taxRate: 18,
            taxAmount: 0,
            total: 0
        }])
    }

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!clientId || !projectTitle) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
            setLoading(false)
            return
        }

        const totals = calculateTotals()

        const payload = {
            clientId,
            projectTitle,
            scopeOfWork,
            validUntil,
            lineItems: items,
            totals: {
                subtotal: totals.subtotal,
                taxTotal: totals.taxTotal,
                discount: 0, // MVP: No discount per item yet
                grandTotal: totals.grandTotal
            }
        }

        const formData = new FormData()
        formData.append('data', JSON.stringify(payload))

        const res = await createQuotation(null, formData)

        if (res?.success) {
            toast({ title: "Success", description: "Quotation created successfully" })
            router.push(`/dashboard/quotations/${res.id}`)
        } else {
            toast({ title: "Error", description: res?.message || "Failed to create", variant: "destructive" })
        }
        setLoading(false)
    }

    const totals = calculateTotals()

    return (
        <div className="space-y-6 pb-20 md:pb-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Quotation</h1>
                    <p className="text-muted-foreground">Create a new project proposal.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Client</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valid Until</Label>
                            <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Project Title</Label>
                            <Input placeholder="e.g. Website Redesign Phase 1" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Scope of Work (Optional)</Label>
                            <Textarea placeholder="Brief description of the scope..." value={scopeOfWork} onChange={e => setScopeOfWork(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Line Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid gap-4 md:grid-cols-12 items-end border-b pb-4">
                                <div className="md:col-span-5 space-y-2">
                                    <Label className={index > 0 ? "hidden md:hidden" : ""}>Description</Label>
                                    <Input
                                        placeholder="Service description"
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label className={index > 0 ? "hidden md:hidden" : ""}>Qty</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className={index > 0 ? "hidden md:hidden" : ""}>Price</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label className={index > 0 ? "hidden md:hidden" : ""}>Tax (%)</Label>
                                    <Input
                                        type="number"
                                        value={item.taxRate}
                                        onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2 text-right">
                                    <Label className={`block ${index > 0 ? "hidden md:hidden" : ""}`}>Total</Label>
                                    <div className="h-10 flex items-center justify-end font-medium">
                                        ₹{item.total.toFixed(2)}
                                    </div>
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addItem}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Card className="w-full md:w-1/3">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Total:</span>
                                <span>₹{totals.taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Grand Total:</span>
                                <span>₹{totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Quotation
                    </Button>
                </div>
            </form>
        </div>
    )
}
