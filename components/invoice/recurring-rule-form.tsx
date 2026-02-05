'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface RecurringRuleFormProps {
    companyId: string
    parties: any[] // simplifed type
}

export default function RecurringRuleForm({ companyId, parties }: RecurringRuleFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [customerId, setCustomerId] = useState('')
    const [frequency, setFrequency] = useState('monthly')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [amount, setAmount] = useState('')

    // For MVP, we'll just take a simple "Description" and make it a single line item
    const [description, setDescription] = useState('Consulting Retainer')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient() as SupabaseClient<Database>

            // Construct items_snapshot
            const items = [{
                description,
                quantity: 1,
                unit_price: parseFloat(amount),
                total_amount: parseFloat(amount)
            }]

            // Calculate next_run_at (Start Date + Time)
            // We assume start date is the first run date.

            const { error } = await supabase
                .from('recurring_rules')
                .insert({
                    company_id: companyId,
                    customer_id: customerId,
                    cron_expression: frequency, // Storing frequency as the expression for our simple util
                    next_run_at: new Date(startDate).toISOString(),
                    amount: parseFloat(amount),
                    items_snapshot: items,
                    status: 'active',
                    tax_mode: 'exclusive' // Default
                } as any)

            if (error) throw error

            toast.success('Recurring rule created')
            router.push('/dashboard/invoices/recurring')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select onValueChange={setCustomerId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {parties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date (Next Run)</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Service Description</Label>
                        <Input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Monthly Retainer"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (₹)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Automation
                </Button>
            </div>
        </form>
    )
}
