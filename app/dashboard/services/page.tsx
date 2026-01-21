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
import { Skeleton } from '@/components/ui/skeleton'

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Services / Items</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>

            {loading ? (
                <>
                    {/* Desktop Skeleton */}
                    <div className="hidden md:block border rounded-md">
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
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-4 w-[150px] mb-2" />
                                            <Skeleton className="h-3 w-[100px]" />
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile Skeleton */}
                    <div className="md:hidden space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-4 space-y-3">
                                <Skeleton className="h-5 w-[150px]" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-[80px]" />
                                    <Skeleton className="h-4 w-[60px]" />
                                </div>
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block border rounded-md">
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

                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-4">
                        {items.length === 0 && (
                            <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-lg">
                                No items found. Add services or products.
                            </div>
                        )}
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-3 transition-all active:scale-[0.98]">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="font-bold text-lg text-slate-800 leading-tight">{item.name}</div>
                                        {item.description && <div className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</div>}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="font-bold text-lg text-slate-900">₹{item.unit_price}</div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 -mr-2 -mt-2" onClick={() => handleEdit(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">SAC Code</span>
                                        <span className="text-sm font-mono font-medium text-slate-700">{item.sac_code}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Rate</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                                            {item.tax_rate}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
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
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="name" className="text-left md:text-right">Name</Label>
                            <Input id="name" name="name" defaultValue={editingItem?.name} className="md:col-span-3" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="description" className="text-left md:text-right">Desc</Label>
                            <Input id="description" name="description" defaultValue={editingItem?.description} className="md:col-span-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="sac_code" className="text-left md:text-right">SAC/HSN</Label>
                            <Input id="sac_code" name="sac_code" defaultValue={editingItem?.sac_code} className="md:col-span-3" required placeholder="SAC Code" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="tax_rate" className="text-left md:text-right">Tax (%)</Label>
                            <div className="md:col-span-3">
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
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="unit_price" className="text-left md:text-right">Price</Label>
                            <Input id="unit_price" name="unit_price" type="number" step="0.01" defaultValue={editingItem?.unit_price} className="md:col-span-3" placeholder="0.00" />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm md:col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
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
