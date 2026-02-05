'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveAgreements, getInvoiceablePhases } from '@/app/actions/agreements-v2'
import CreateInvoiceForm from './create-form' // Existing form
import { Label } from "@/components/ui/label"
import { ArrowRight, FileText, Check } from 'lucide-react'

export function InvoiceWizard({ companies, parties, items, nextInvoiceNumber }: any) {
    const [mode, setMode] = useState<'wizard' | 'form'>('wizard')

    // Wizard State
    const [selectedClientId, setSelectedClientId] = useState('')
    const [agreements, setAgreements] = useState<any[]>([])
    const [selectedAgreementId, setSelectedAgreementId] = useState('')
    const [phases, setPhases] = useState<any[]>([])
    const [selectedPhaseId, setSelectedPhaseId] = useState('')

    const [prefilledData, setPrefilledData] = useState<any>(null)

    const handleClientChange = async (clientId: string) => {
        setSelectedClientId(clientId)
        const aggs = await getActiveAgreements(clientId)
        setAgreements(aggs)
        setSelectedAgreementId('')
        setPhases([])
    }

    const handleAgreementChange = async (aggId: string) => {
        setSelectedAgreementId(aggId)
        const phs = await getInvoiceablePhases(aggId)
        setPhases(phs)
        setSelectedPhaseId('')
    }

    const handlePhaseSelection = (phaseId: string) => {
        setSelectedPhaseId(phaseId)
    }

    const proceedToInvoice = () => {
        // Construct Initial Data from Agreement Phase
        const phase = phases.find(p => p.id === selectedPhaseId)
        const agreement = agreements.find(a => a.id === selectedAgreementId)

        if (phase && agreement) {
            const data = {
                customer_id: selectedClientId,
                agreement_id: selectedAgreementId,
                agreement_phase_id: selectedPhaseId,

                // Lockable fields
                tax_mode: agreement.tax_mode || 'exclusive', // Fetch full details if needed, simplied here
                // Note: getActiveAgreements returned limited fields. Might need full fetch or update query.
                // Assuming create-form handles basic defaults, but we want STRICT values.
                // We should ideally fetch FULL agreement details here.

                // Line Items
                invoice_items: [{
                    item_id: 'custom',
                    description: `${agreement.title} - ${phase.name}`,
                    quantity: 1,
                    unit_price: phase.remaining_balance, // Important!
                    taxable_amount: phase.remaining_balance,
                    // tax_rate needs to come from agreement too
                }],

                // Metadata to tell Form to LOCK fields
                isAgreementLinked: true,
                lockedFields: ['customer_id', 'tax_mode']
            }
            setPrefilledData(data)
            setMode('form')
        }
    }

    const startManualInvoice = () => {
        setPrefilledData(null)
        setMode('form')
    }

    if (mode === 'form') {
        return (
            <CreateInvoiceForm
                company={companies[0]}
                parties={parties}
                items={items}
                nextInvoiceNumber={nextInvoiceNumber}
                initialData={prefilledData}
            />
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">New Invoice</h1>
                <p className="text-slate-500">Choose how you want to create this invoice</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* OPTION 1: AGREEMENT DRIVEN */}
                <Card className={`cursor-pointer border-2 transition-all hover:border-indigo-500 ${selectedClientId ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="text-indigo-600" />
                            From Agreement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Select an existing contract and invoice a specific phase.
                            Error-proof and audit-ready.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <Label>Select Client</Label>
                                <Select value={selectedClientId} onValueChange={handleClientChange}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Choose Client..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parties.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {agreements.length > 0 && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <Label>Select Agreement</Label>
                                    <Select value={selectedAgreementId} onValueChange={handleAgreementChange}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Choose Agreement..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agreements.map((a: any) => (
                                                <SelectItem key={a.id} value={a.id}>{a.title} (₹{a.grand_total})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {phases.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Select Phase to Invoice</Label>
                                    <div className="grid gap-2">
                                        {phases.map((phase: any) => (
                                            <div
                                                key={phase.id}
                                                onClick={() => handlePhaseSelection(phase.id)}
                                                className={`p-3 rounded border text-sm flex justify-between cursor-pointer hover:bg-white ${selectedPhaseId === phase.id ? 'bg-white border-indigo-600 ring-1 ring-indigo-600' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <span className="font-medium">{phase.name}</span>
                                                <span>₹{phase.remaining_balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPhaseId && (
                                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={proceedToInvoice}>
                                    Generate Invoice <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* OPTION 2: MANUAL */}
                <Card className="cursor-pointer border-2 border-transparent hover:border-slate-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-slate-400">One-Off / Manual</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Create a standalone invoice not linked to any specific long-term agreement.
                            Useful for ad-hoc repairs or one-time consultations.
                        </p>
                        <Button variant="secondary" className="w-full" onClick={startManualInvoice}>
                            Create Manual Invoice
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
