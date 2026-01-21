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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Party
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <div className="col-span-3">
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state_code" className="text-right">State</Label>
                            <div className="col-span-3">
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gstin" className="text-right">GSTIN</Label>
                            <div className="col-span-3 space-y-1">
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending || !!gstError || !formData.stateCode}>
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
