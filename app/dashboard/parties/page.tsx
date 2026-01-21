'use client'

import { useActionState, useEffect, useState } from 'react'
import { getParties, upsertParty } from '@/app/actions/parties'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil } from 'lucide-react'
import { GST_STATES } from '@/lib/gst-states'
import { Skeleton } from '@/components/ui/skeleton'

const initialState = {
    message: '',
}

export default function PartiesPage() {
    const [parties, setParties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingParty, setEditingParty] = useState<any>(null)

    // Need key to reset form state when closing/opening
    const [state, formAction, isPending] = useActionState(upsertParty, initialState)

    // State for form management
    const [formData, setFormData] = useState({
        name: '',
        type: 'customer',
        gstin: '',
        stateCode: '',
        address: ''
    })

    const [gstError, setGstError] = useState('')

    async function loadParties() {
        setLoading(true)
        const data = await getParties()
        setParties(data)
        setLoading(false)
    }

    useEffect(() => {
        loadParties()
    }, [])

    useEffect(() => {
        if (state?.message === 'success') {
            setOpen(false)
            loadParties()
            setEditingParty(null)
            resetForm()
        }
    }, [state])

    useEffect(() => {
        if (editingParty) {
            setFormData({
                name: editingParty.name,
                type: editingParty.type,
                gstin: editingParty.gstin || '',
                stateCode: editingParty.state_code,
                address: editingParty.address || ''
            })
        } else {
            resetForm()
        }
    }, [editingParty])

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'customer',
            gstin: '',
            stateCode: '',
            address: ''
        })
        setGstError('')
    }

    const handleEdit = (party: any) => {
        setEditingParty(party)
        setOpen(true)
    }

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
        if (!val) {
            setEditingParty(null)
            resetForm()
        }
    }

    const handleStateChange = (code: string) => {
        setFormData(prev => ({ ...prev, stateCode: code }))
        validateGSTIN(formData.gstin, code)
    }

    const handleGSTINChange = (val: string) => {
        const upperVal = val.toUpperCase()
        setFormData(prev => ({ ...prev, gstin: upperVal }))
        validateGSTIN(upperVal, formData.stateCode)
    }

    const validateGSTIN = (gstin: string, stateCode: string) => {
        if (!gstin || gstin.length < 2) {
            setGstError('')
            return
        }
        if (stateCode && gstin.substring(0, 2) !== stateCode) {
            setGstError(`GSTIN must start with state code ${stateCode}`)
        } else {
            setGstError('')
        }
    }

    // Helper to get state name from code
    const getStateName = (code: string) => {
        return GST_STATES.find(s => s.code === code)?.name || ''
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Party
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
                                    <TableHead>Type</TableHead>
                                    <TableHead>GSTIN</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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
                                <Skeleton className="h-3 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
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
                                    <TableHead>Type</TableHead>
                                    <TableHead>GSTIN</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parties.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No parties found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {parties.map((party) => (
                                    <TableRow key={party.id}>
                                        <TableCell className="font-medium">{party.name}</TableCell>
                                        <TableCell className="capitalize">{party.type}</TableCell>
                                        <TableCell>{party.gstin || '-'}</TableCell>
                                        <TableCell>{party.state} <span className="text-muted-foreground text-xs">({party.state_code})</span></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(party)}>
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
                        {parties.length === 0 && (
                            <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-lg">
                                No parties found. Add one to get started.
                            </div>
                        )}
                        {parties.map((party) => (
                            <div key={party.id} className="bg-white rounded-xl border-none shadow-md ring-1 ring-slate-100 p-4 space-y-3 transition-all active:scale-[0.98]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg text-slate-800">{party.name}</div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${party.type === 'customer'
                                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                                                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                                            }`}>
                                            {party.type}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(party)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">GSTIN</span>
                                        <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded">{party.gstin || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">State</span>
                                        <span className="text-slate-700 font-medium">{party.state} <span className="text-slate-400 text-xs">({party.state_code})</span></span>
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
                        <DialogTitle>{editingParty ? 'Edit Party' : 'Add Party'}</DialogTitle>
                        <DialogDescription>
                            Add customer or vendor details. Ensure GSTIN matches the State Code.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Note: We rely on hidden inputs to pass data easily to the server action or we could construct FormData manually */}
                    <form action={formAction} className="grid gap-4 py-4">
                        <input type="hidden" name="id" value={editingParty?.id || ''} />

                        {/* Hidden inputs for state name and code because Select controls stateCode state */}
                        <input type="hidden" name="state" value={getStateName(formData.stateCode)} />
                        <input type="hidden" name="state_code" value={formData.stateCode} />

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="name" className="text-left md:text-right">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="md:col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="type" className="text-left md:text-right">Type</Label>
                            <div className="md:col-span-3">
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">Customer</SelectItem>
                                        <SelectItem value="vendor">Vendor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="state_code" className="text-left md:text-right">State</Label>
                            <div className="md:col-span-3">
                                <Select
                                    value={formData.stateCode}
                                    onValueChange={handleStateChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select GST State" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {GST_STATES.map((s) => (
                                            <SelectItem key={s.code} value={s.code}>
                                                {s.name} ({s.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="gstin" className="text-left md:text-right">GSTIN</Label>
                            <div className="md:col-span-3 space-y-1">
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={e => handleGSTINChange(e.target.value)}
                                    maxLength={15}
                                    placeholder="29AAAAA0000A1Z5"
                                />
                                {gstError && <p className="text-xs text-red-500">{gstError}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="address" className="text-left md:text-right">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="md:col-span-3"
                            />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm md:col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending || !!gstError || !formData.stateCode} className="w-full md:w-auto">
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
