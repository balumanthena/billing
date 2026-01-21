'use client'

import { useActionState, useEffect, useState } from 'react'
import { getItems, upsertItem } from '@/app/actions/items'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil } from 'lucide-react'

const initialState = {
    message: '',
}

export default function ServicesPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    const [state, formAction, isPending] = useActionState(upsertItem, initialState)

    async function loadItems() {
        setLoading(true)
        const data = await getItems()
        setItems(data)
        setLoading(false)
    }

    useEffect(() => {
        loadItems()
    }, [])

    useEffect(() => {
        if (state?.message === 'success') {
            setOpen(false)
            loadItems()
            setEditingItem(null)
        }
    }, [state])

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setOpen(true)
    }

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
        if (!val) setEditingItem(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Services / Items</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>SAC/HSN</TableHead>
                                <TableHead>Tax Rate</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No items found. Add services or products.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div>{item.name}</div>
                                        {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                                    </TableCell>
                                    <TableCell>{item.sac_code}</TableCell>
                                    <TableCell>{item.tax_rate}%</TableCell>
                                    <TableCell>₹{item.unit_price}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
                        <DialogDescription>
                            Add service or product details for invoicing.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="grid gap-4 py-4">
                        <input type="hidden" name="id" value={editingItem?.id || ''} />
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={editingItem?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Desc</Label>
                            <Input id="description" name="description" defaultValue={editingItem?.description} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sac_code" className="text-right">SAC/HSN</Label>
                            <Input id="sac_code" name="sac_code" defaultValue={editingItem?.sac_code} className="col-span-3" required placeholder="SAC Code" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tax_rate" className="text-right">Tax (%)</Label>
                            <div className="col-span-3">
                                <Select name="tax_rate" defaultValue={editingItem?.tax_rate?.toString() || '18'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Tax Rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0% (Exempt)</SelectItem>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="12">12%</SelectItem>
                                        <SelectItem value="18">18%</SelectItem>
                                        <SelectItem value="28">28%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unit_price" className="text-right">Price</Label>
                            <Input id="unit_price" name="unit_price" type="number" step="0.01" defaultValue={editingItem?.unit_price} className="col-span-3" placeholder="0.00" />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
