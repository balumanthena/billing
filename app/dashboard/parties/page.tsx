'use client'

import { useActionState, useEffect, useState } from 'react'
import { getParties, upsertParty } from '@/app/actions/parties'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil, Search } from 'lucide-react'
import { GST_STATES } from '@/lib/gst-states'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const initialState = {
    message: '',
}

export default function PartiesPage() {
    const [parties, setParties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingParty, setEditingParty] = useState<any>(null)
    const searchParams = useSearchParams()
    const router = useRouter()

    // Need key to reset form state when closing/opening
    const [state, formAction, isPending] = useActionState(upsertParty, initialState)

    // State for form management
    const [formData, setFormData] = useState({
        name: '',
        type: 'customer',
        gstin: '',
        stateCode: '',
        address: '',
        email: '',
        phone: '',
        pan: '',
        city: ''
    })

    const [gstError, setGstError] = useState('')

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'customer',
            gstin: '',
            stateCode: '',
            address: '',
            email: '',
            phone: '',
            pan: '',
            city: ''
        })
        setGstError('')
    }

    async function loadParties() {
        setLoading(true)
        const data = await getParties()
        setParties(data)
        setLoading(false)
    }

    useEffect(() => {
        loadParties()
    }, [])

    // Check for edit param
    useEffect(() => {
        const editId = searchParams.get('edit')
        if (editId && parties.length > 0) {
            const partyToEdit = parties.find(p => p.id === editId)
            if (partyToEdit) {
                setEditingParty(partyToEdit)
                setOpen(true)
                // Clean up URL
                router.replace('/dashboard/parties')
            }
        }
    }, [parties, searchParams, router])

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
                address: editingParty.address || '',
                email: editingParty.email || '',
                phone: editingParty.phone || '',
                pan: editingParty.pan || '',
                city: editingParty.city || ''
            })
        } else {
            resetForm()
        }
    }, [editingParty])

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
        <div className="w-full px-6 py-6 space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parties</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your customers and vendors
                    </p>
                </div>
                <Button onClick={() => setOpen(true)} className="bg-[#7C5CFC] hover:bg-[#6b4ce6] text-white shadow-sm rounded-md">
                    <Plus className="mr-2 h-4 w-4" /> Add Party
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search parties..."
                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                </div>
            </div>

            {/* Main Table Content */}
            {loading ? (
                <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[300px] h-12">Name</TableHead>
                                <TableHead className="h-12">Type</TableHead>
                                <TableHead className="h-12">Location</TableHead>
                                <TableHead className="h-12">GSTIN</TableHead>
                                <TableHead className="h-12 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-[140px]" /><Skeleton className="h-3 w-[100px]" /></div></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[350px] font-semibold text-slate-500 uppercase text-[11px] tracking-wider py-4 pl-6">Party Name</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Type</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Location</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">GSTIN</TableHead>
                                <TableHead className="text-right font-semibold text-slate-500 uppercase text-[11px] tracking-wider pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parties.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-32 text-slate-400">
                                        No parties found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                            {parties.map((party) => (
                                <TableRow
                                    key={party.id}
                                    onClick={() => router.push(`/dashboard/parties/${party.id}`)}
                                    className="group hover:bg-[#7C5CFC]/5 hover:border-violet-200 cursor-pointer text-sm transition-all border-b border-slate-50 last:border-0"
                                >
                                    <TableCell className="py-3 pl-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-slate-200">
                                                <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-600">
                                                    {party.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-700 group-hover:text-violet-700 transition-colors">
                                                    {party.name}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {party.email || party.phone || 'No contact info'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium capitalize border ${party.type === 'customer'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {party.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {party.city ? `${party.city}, ` : ''}{party.state || '-'}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-600">
                                        {party.gstin || '-'}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-violet-600 hover:bg-violet-50"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(party)
                                            }}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
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
                            <Label htmlFor="email" className="text-left md:text-right">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="md:col-span-3"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="phone" className="text-left md:text-right">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="md:col-span-3"
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="pan" className="text-left md:text-right">PAN</Label>
                            <Input
                                id="pan"
                                name="pan"
                                value={formData.pan}
                                onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                className="md:col-span-3"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
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

                        <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                            <Label htmlFor="city" className="text-left md:text-right">City</Label>
                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="md:col-span-3"
                            />
                        </div>

                        {state?.message && state.message !== 'success' && (
                            <div className="text-red-500 text-sm md:col-span-4 text-center">{state.message}</div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isPending || !!gstError || !formData.stateCode} className="w-full md:w-auto bg-[#7C5CFC] hover:bg-[#6b4ce6]">
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
