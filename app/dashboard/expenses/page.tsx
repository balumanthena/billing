'use client'

import { useActionState, useEffect, useState } from 'react'
import { getExpenses, upsertExpense, deleteExpense } from '@/app/actions/expenses'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const initialState = {
    message: '',
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<any>(null)

    const [state, formAction, isPending] = useActionState(upsertExpense, initialState)

    async function loadExpenses() {
        setLoading(true)
        const data = await getExpenses()
        setExpenses(data)
        setLoading(false)
    }

    useEffect(() => {
        loadExpenses()
    }, [])

    useEffect(() => {
        if (state?.message === 'success') {
            setOpen(false)
            loadExpenses()
            setEditingExpense(null)
        }
    }, [state])

    const handleEdit = (expense: any) => {
        setEditingExpense(expense)
        setOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return
        await deleteExpense(id)
        loadExpenses()
    }

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
        if (!val) setEditingExpense(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {loading ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[120px] mb-2" />
                                        <Skeleton className="h-3 w-[80px]" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No expenses recorded.
                                    </TableCell>
                                </TableRow>
                            )}
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">{expense.category}</span>
                                        {expense.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.description}</div>}
                                    </TableCell>
                                    <TableCell>{expense.vendor_name || '-'}</TableCell>
                                    <TableCell className="capitalize">{expense.payment_mode}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        ₹{expense.amount.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="sm:max-w-[600px] w-full">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl">{editingExpense ? 'Edit Expense' : 'Record Expense'}</SheetTitle>
                        <SheetDescription>
                            Enter the details of the business expenditure. All fields marked with * are required.
                        </SheetDescription>
                    </SheetHeader>

                    <form action={formAction} className="space-y-8">
                        <input type="hidden" name="id" value={editingExpense?.id || ''} />

                        {/* Section 1: Transaction Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-l-4 border-primary pl-3 py-1 bg-slate-50">
                                Transaction Details
                            </h3>
                            <div className="space-y-4 pl-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Select name="category" defaultValue={editingExpense?.category || 'Office Supplies'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Rent">Rent</SelectItem>
                                                <SelectItem value="Salaries">Salaries</SelectItem>
                                                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                                <SelectItem value="Utilities">Utilities</SelectItem>
                                                <SelectItem value="Travel">Travel</SelectItem>
                                                <SelectItem value="Software">Software</SelectItem>
                                                <SelectItem value="Marketing">Marketing</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹) *</Label>
                                        <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} required placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gst_amount">GST Input Credit (Optional)</Label>
                                        <Input id="gst_amount" name="gst_amount" type="number" step="0.01" defaultValue={editingExpense?.gst_amount} placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-border my-6" />

                        {/* Section 2: Vendor & Payment */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-l-4 border-primary pl-3 py-1 bg-slate-50">
                                Payment Information
                            </h3>
                            <div className="space-y-4 pl-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor_name">Vendor / Payee</Label>
                                        <Input id="vendor_name" name="vendor_name" defaultValue={editingExpense?.vendor_name} placeholder="e.g. Amazon, Landlord" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_mode">Payment Mode</Label>
                                        <Select name="payment_mode" defaultValue={editingExpense?.payment_mode || 'Bank Transfer'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="Card">Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Notes / Description</Label>
                                    <Input id="description" name="description" defaultValue={editingExpense?.description} placeholder="Additional context about this expense..." />
                                </div>
                            </div>
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center">
                                {state.message}
                            </div>
                        )}

                        <SheetFooter className="mt-8 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="mr-2">Cancel</Button>
                            <Button type="submit" disabled={isPending} className="w-40">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Record
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
