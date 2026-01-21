'use client'

import { useActionState, useEffect, useState } from 'react'
import { getCompany, updateCompany } from '@/app/actions/company'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const initialState = {
    message: '',
}

export default function CompanyPage() {
    const [state, formAction, isPending] = useActionState(updateCompany, initialState)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [logoUrl, setLogoUrl] = useState('')

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

    // Initialize logoUrl from company data
    useEffect(() => {
        if (company?.logo_url) {
            setLogoUrl(company.logo_url)
        }
    }, [company])

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
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
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

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={company?.address} placeholder="123 Business Park, Tech City" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" name="state" defaultValue={company?.state} required placeholder="Telangana" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state_code">State Code</Label>
                                <Input id="state_code" name="state_code" defaultValue={company?.state_code} required placeholder="36" maxLength={2} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Company Logo</Label>

                            {/* Preview */}
                            {logoUrl ? (
                                <div className="mb-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="Company Logo"
                                        className="h-20 object-contain border rounded p-1"
                                    />
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
