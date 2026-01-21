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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {loading ? (
                <>
                    {/* Desktop Skeleton */}
                    <div className="hidden md:block border rounded-md">
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
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-[120px]" />
                                    <Skeleton className="h-4 w-[60px]" />
                                </div>
                                <Skeleton className="h-4 w-[80px]" />
                                <div className="flex justify-between pt-2">
                                    <Skeleton className="h-3 w-[100px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-md">
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

                    {/* Mobile Card List View */}
                    <div className="md:hidden space-y-4">
                        {expenses.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/10">
                                No expenses recorded.
                            </div>
                        )}
                        {expenses.map((expense) => (
                            <div key={expense.id} className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-base">{expense.category}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(expense.date), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                    <div className="font-bold text-lg">₹{expense.amount.toLocaleString('en-IN')}</div>
                                </div>

                                {expense.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                                        {expense.description}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Vendor</span>
                                        <span>{expense.vendor_name || '-'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground">Mode</span>
                                        <span className="capitalize">{expense.payment_mode}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                                        <Pencil className="mr-2 h-3 w-3" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingExpense ? 'Edit Expense' : 'Record Expense'}</SheetTitle>
                        <SheetDescription>
                            Enter details of the business expense.
                        </SheetDescription>
                    </SheetHeader>
                    <form action={formAction} className="space-y-4 md:space-y-6 mt-4 md:mt-6 pb-20 md:pb-0 px-4">
                        <input type="hidden" name="id" value={editingExpense?.id || ''} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={editingExpense ? format(new Date(editingExpense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select name="category" defaultValue={editingExpense?.category}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Rent">Rent</SelectItem>
                                        <SelectItem value="Utilities">Utilities</SelectItem>
                                        <SelectItem value="Salaries">Salaries</SelectItem>
                                        <SelectItem value="Travel">Travel</SelectItem>
                                        <SelectItem value="Equipment">Equipment</SelectItem>
                                        <SelectItem value="Software">Software</SelectItem>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    defaultValue={editingExpense?.amount}
                                    required
                                    className="text-lg font-semibold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gst_amount">GST Amount (Optional)</Label>
                                <Input
                                    id="gst_amount"
                                    name="gst_amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    defaultValue={editingExpense?.gst_amount || ''}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="vendor_name">Vendor / Payee</Label>
                                <Input
                                    id="vendor_name"
                                    name="vendor_name"
                                    placeholder="e.g. Amazon, Landlord"
                                    defaultValue={editingExpense?.vendor_name || ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment_mode">Payment Mode</Label>
                                <Select name="payment_mode" defaultValue={editingExpense?.payment_mode || 'upi'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="neft">NEFT/IMPS</SelectItem>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                        <SelectItem value="debit_card">Debit Card</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description / Notes</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Additional details..."
                                defaultValue={editingExpense?.description || ''}
                            />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center">
                                {state.message}
                            </div>
                        )}

                        <SheetFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
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
