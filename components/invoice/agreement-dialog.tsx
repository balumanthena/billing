'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download } from "lucide-react"
import dynamic from 'next/dynamic'
import { ServiceAgreementPDF } from './service-agreement-pdf'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button size="sm" disabled>Preparing Document...</Button>,
    }
)

interface AgreementDialogProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice: any
}

export function AgreementDialog({ invoice }: AgreementDialogProps) {
    const [open, setOpen] = useState(false)

    // Form State
    const [params, setParams] = useState({
        developerWebsite: '',
        technologyStack: 'Next.js, Supabase, Tailwind CSS',
        totalPages: '5-10',
        monthlyTraffic: '10,000',
        blogLimit: 'Unlimited',
        appointmentMode: 'WhatsApp / Calendly',
        adminFeatures: 'Dashboard, Content Management',
        advancePercent: '50',
        milestonePercent: '30',
        finalPercent: '20',
        jurisdiction: invoice.company_snapshot?.state || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setParams(prev => ({ ...prev, [name]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Agreement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Generate Service Agreement</DialogTitle>
                    <DialogDescription>
                        Fill in the project details to generate a customized legal agreement.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="developerWebsite">Developer Website</Label>
                            <Input id="developerWebsite" name="developerWebsite" value={params.developerWebsite} onChange={handleChange} placeholder="www.example.com" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="jurisdiction">Jurisdiction (City/State)</Label>
                                <Input id="jurisdiction" name="jurisdiction" value={params.jurisdiction} onChange={handleChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="totalPages">Total Pages</Label>
                                <Input id="totalPages" name="totalPages" value={params.totalPages} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="technologyStack">Technology Stack</Label>
                            <Input id="technologyStack" name="technologyStack" value={params.technologyStack} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="appointmentMode">Appointment Mode</Label>
                                <Input id="appointmentMode" name="appointmentMode" value={params.appointmentMode} onChange={handleChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="blogLimit">Blog/Content Limit</Label>
                                <Input id="blogLimit" name="blogLimit" value={params.blogLimit} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="adminFeatures">Admin Features</Label>
                            <Input id="adminFeatures" name="adminFeatures" value={params.adminFeatures} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="advancePercent">Advance %</Label>
                                <Input id="advancePercent" name="advancePercent" value={params.advancePercent} onChange={handleChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="milestonePercent">Milestone %</Label>
                                <Input id="milestonePercent" name="milestonePercent" value={params.milestonePercent} onChange={handleChange} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="finalPercent">Final %</Label>
                                <Input id="finalPercent" name="finalPercent" value={params.finalPercent} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <PDFDownloadLink
                        document={<ServiceAgreementPDF invoice={{ ...invoice, project_settings: params }} />}
                        fileName={`Agreement-${invoice.invoice_number}.pdf`}
                    >
                        {({ loading }) =>
                            <Button disabled={loading} className="w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4" />
                                {loading ? 'Generating...' : 'Download Agreement'}
                            </Button>
                        }
                    </PDFDownloadLink>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
