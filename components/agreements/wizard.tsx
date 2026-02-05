'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createAgreementWithPhases } from '@/app/actions/agreements-v2'
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"

interface AgreementWizardProps {
    parties: any[]
}

export function AgreementWizard({ parties }: AgreementWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data State
    const [customerId, setCustomerId] = useState('')
    const [title, setTitle] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [grandTotal, setGrandTotal] = useState<number>(0)
    const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive'>('exclusive')
    const [gstRate, setGstRate] = useState<number>(18)
    const [tdsRate, setTdsRate] = useState<number>(0)

    // Phases
    const [phases, setPhases] = useState<any[]>([
        { name: 'Advance', percentage: 0, amount: 0 },
        { name: 'Completion', percentage: 0, amount: 0 }
    ])

    // Step 2 Logic: Sync Percentage <-> Amount
    const handleAmountChange = (index: number, val: number) => {
        const newPhases = [...phases]
        newPhases[index].amount = val
        if (grandTotal > 0) {
            newPhases[index].percentage = parseFloat(((val / grandTotal) * 100).toFixed(2))
        }
        setPhases(newPhases)
    }

    const handlePercentChange = (index: number, val: number) => {
        const newPhases = [...phases]
        newPhases[index].percentage = val
        if (grandTotal > 0) {
            newPhases[index].amount = parseFloat(((grandTotal * val) / 100).toFixed(2))
        }
        setPhases(newPhases)
    }

    const addPhase = () => {
        setPhases([...phases, { name: 'New Phase', percentage: 0, amount: 0 }])
    }

    const removePhase = (index: number) => {
        setPhases(phases.filter((_, i) => i !== index))
    }

    const totalPhaseAmount = phases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const totalPhasePercent = phases.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0)
    const isValidPhasing = Math.abs(totalPhaseAmount - grandTotal) < 1 // tolerance 1

    const handleSubmit = async () => {
        setLoading(true)
        const payload = {
            customerId,
            title,
            date,
            grandTotal,
            taxMode,
            gstRate,
            tdsRate,
            phases
        }

        const formData = new FormData()
        formData.append('data', JSON.stringify(payload))

        const res = await createAgreementWithPhases(null, formData)

        if (res.success) {
            router.push('/dashboard/agreements')
        } else {
            alert(res.message)
        }
        setLoading(false)
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Agreement</CardTitle>
                <Progress value={(step / 3) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="pt-6">

                {/* STEP 1: BASICS */}
                {step === 1 && (
                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parties.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Project Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Website Redesign" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Contract Value (Total)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-500">₹</span>
                                    <Input
                                        type="number"
                                        className="pl-8"
                                        value={grandTotal}
                                        onChange={e => setGrandTotal(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax Mode</Label>
                                <Select value={taxMode} onValueChange={(v: any) => setTaxMode(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exclusive">Tax Exclusive (Fees + GST)</SelectItem>
                                        <SelectItem value="inclusive">Tax Inclusive (GST inside)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: PHASES */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-slate-700">Phase Breakdown</h3>
                            <Button size="sm" variant="outline" onClick={addPhase}><Plus className="w-4 h-4 mr-2" /> Add Phase</Button>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Phase Name</th>
                                        <th className="px-4 py-3 w-32">Percentage %</th>
                                        <th className="px-4 py-3 w-40">Amount (₹)</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {phases.map((phase, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <Input value={phase.name} onChange={e => {
                                                    const newPhases = [...phases];
                                                    newPhases[idx].name = e.target.value;
                                                    setPhases(newPhases);
                                                }} />
                                            </td>
                                            <td className="p-2">
                                                <Input type="number" value={phase.percentage} onChange={e => handlePercentChange(idx, parseFloat(e.target.value))} />
                                            </td>
                                            <td className="p-2">
                                                <Input type="number" value={phase.amount} onChange={e => handleAmountChange(idx, parseFloat(e.target.value))} />
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removePhase(idx)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={`p-4 rounded-md flex justify-between items-center ${isValidPhasing ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                            <div className="flex items-center gap-2">
                                {isValidPhasing ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="font-medium">Total: {totalPhaseAmount.toLocaleString()} ({totalPhasePercent.toFixed(1)}%)</span>
                            </div>
                            <div className="text-sm">Target: {grandTotal.toLocaleString()}</div>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Client</span>
                                <span className="font-medium">{parties.find(p => p.id === customerId)?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Project</span>
                                <span className="font-medium">{title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Value</span>
                                <span className="font-medium">₹{grandTotal.toLocaleString()}</span>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                {phases.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{p.name}</span>
                                        <span>₹{p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                            By creating this agreement, you are establishing the source of truth for all future invoices.
                        </p>
                    </div>
                )}

            </CardContent>
            <CardFooter className="flex justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                ) : (
                    <div></div>
                )}

                {step < 3 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={step === 1 && (!customerId || !grandTotal) || step === 2 && !isValidPhasing}>
                        Next
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? 'Creating...' : 'Create Agreement'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
