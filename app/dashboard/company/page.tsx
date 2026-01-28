'use client'

import { useActionState, useEffect, useState } from 'react'
import { getCompany, updateCompany } from '@/app/actions/company'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { GST_STATES } from '@/lib/gst-states'
import { CITIES_BY_STATE } from '@/lib/cities'

const initialState = {
    message: '',
}

export default function CompanyPage() {
    const [state, formAction, isPending] = useActionState(updateCompany, initialState)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [logoUrl, setLogoUrl] = useState('')

    // Controlled state for form inter-dependencies
    const [selectedStateCode, setSelectedStateCode] = useState('')
    const [selectedStateName, setSelectedStateName] = useState('')
    const [selectedCity, setSelectedCity] = useState('')

    // Fetch company data on mount
    useEffect(() => {
        async function loadCompany() {
            try {
                const data = await getCompany()
                if (data) {
                    setCompany(data)
                }
            } catch (error) {
                console.error('Failed to load company:', error)
            } finally {
                setLoading(false)
            }
        }
        loadCompany()
    }, [])

    // Initialize state from company data
    useEffect(() => {
        if (company) {
            if (company.logo_url) setLogoUrl(company.logo_url)
            if (company.state_code) setSelectedStateCode(company.state_code)
            if (company.state) setSelectedStateName(company.state)
            if (company.city) setSelectedCity(company.city)
        }
    }, [company])

    const handleStateChange = (code: string) => {
        setSelectedStateCode(code)
        const stateObj = GST_STATES.find(s => s.code === code)
        if (stateObj) {
            setSelectedStateName(stateObj.name)
            // Reset city if state changes, as the old city might not be in new state
            setSelectedCity('')
        }
    }

    // Get cities for selected state
    const availableCities = selectedStateName ? (CITIES_BY_STATE[selectedStateName] || []) : []

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            // 1. Upload to Supabase Storage
            // Use client-side client for storage
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('company_assets')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company_assets')
                .getPublicUrl(filePath)

            setLogoUrl(publicUrl)
        } catch (error) {
            alert('Error uploading avatar!')
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-20 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>
                        Manage your company details and GST configuration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="id" value={company?.id || ''} />
                        {/* Hidden input to submit the logo URL */}
                        <input type="hidden" name="logo_url" value={logoUrl} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input id="name" name="name" defaultValue={company?.name} required placeholder="Acme Inc" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gstin">GSTIN</Label>
                                <Input id="gstin" name="gstin" defaultValue={company?.gstin} required placeholder="29ABCDE1234F1Z5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" defaultValue={company?.address} placeholder="123 Business Park, Tech City" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <input type="hidden" name="city" value={selectedCity} />
                                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedStateName}>
                                    <SelectTrigger id="city">
                                        <SelectValue placeholder={selectedStateName ? "Select City" : "Select State First"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {availableCities.length > 0 ? (
                                            availableCities.map((city) => (
                                                <SelectItem key={city} value={city}>{city}</SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                No cities found
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={company?.email} placeholder="contact@company.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={company?.phone} placeholder="+91 98765 43210" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pan">PAN</Label>
                                <Input id="pan" name="pan" defaultValue={company?.pan} placeholder="ABCDE1234F" maxLength={10} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state_code">State</Label>
                                {/* Hidden inputs to submit standard names */}
                                <input type="hidden" name="state" value={selectedStateName} />
                                <input type="hidden" name="state_code" value={selectedStateCode} />

                                <Select value={selectedStateCode} onValueChange={handleStateChange}>
                                    <SelectTrigger id="state">
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {GST_STATES.map((s) => (
                                            <SelectItem key={s.code} value={s.code}>
                                                {s.name} ({s.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state_code_display">State Code</Label>
                                <Input id="state_code_display" value={selectedStateCode} disabled placeholder="Auto-filled" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Company Logo</Label>

                            {/* Preview */}
                            {logoUrl ? (
                                <div className="mb-4 flex items-center gap-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="Company Logo"
                                        className="h-20 object-contain border rounded p-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setLogoUrl('')}
                                    >
                                        Remove Logo
                                    </Button>
                                </div>
                            ) : null}

                            <div className="flex items-center gap-4">
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="max-w-sm"
                                />
                                {uploading && <Loader2 className="animate-spin h-4 w-4" />}
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Upload your company logo (PNG/JPG). It will appear on invoices.
                            </p>
                        </div>

                        {state?.message && (
                            <Alert>
                                <AlertDescription>{state.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending || uploading}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
