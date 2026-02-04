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
import { Plus, Loader2, Pencil } from 'lucide-react'
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Party
                </Button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/20">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-[140px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-6 rounded-md" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {parties.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/20 backdrop-blur-sm">
                            No parties found. Add one to get started.
                        </div>
                    )}
                    {parties.map((party) => (
                        <div
                            key={party.id}
                            onClick={() => router.push(`/dashboard/parties/${party.id}`)}
                            className="group flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-violet-500/5 hover:border-violet-500/20 transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <Avatar className="h-9 w-9 border border-border/40">
                                    <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground/70">
                                        {party.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-600 transition-colors">
                                        {party.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                        <span className="capitalize">{party.type}</span>
                                        {party.state && (
                                            <>
                                                <span className="text-border">•</span>
                                                <span className="">{party.state}</span>
                                            </>
                                        )}
                                        {party.gstin && (
                                            <>
                                                <span className="text-border">•</span>
                                                <span className="font-mono">{party.gstin}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-violet-600 hover:bg-violet-500/10"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(party)
                                    }}
                                >
                                    <Pencil size={14} />
                                </Button>
                                {/* Subtle chevron or just reliant on the row hover state. 
                                    Per user request: "Single subtle action (chevron or “View”) revealed on hover" 
                                    But since we have the edit button, maybe we just show that or a chevron.
                                    Let's adding a chevron for clarity if edit is not primary. 
                                    Actually, user layout said "Single subtle action". 
                                    The Edit pencil is good, but maybe a ChevronRight is better for "View" as primary action intent. 
                                    I'll keep the pencil since editing from list is useful, but make it very subtle.
                                */}
                            </div>
                        </div>
                    ))}
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
