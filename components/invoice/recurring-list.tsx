'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Play, Pause, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface RecurringRule {
    id: string
    customer_id: string
    cron_expression: string
    next_run_at: string
    amount: number
    status: 'active' | 'paused'
}

export default function RecurringRulesList({ rules }: { rules: RecurringRule[] }) {
    // Basic interaction handlers would go here (toggle status, run now)
    // For MVP, just display.

    return (
        <div className="space-y-4">
            {rules.map(rule => (
                <Card key={rule.id} className="flex flex-row items-center justify-between p-4 bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full border border-slate-100">
                            <RefreshCw className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-800">
                                {rule.cron_expression.toUpperCase()} Billing
                            </div>
                            <div className="text-sm text-slate-500">
                                Next run: {format(new Date(rule.next_run_at), 'PPP')} • ₹{rule.amount}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                            {rule.status}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menu</span>
                            ...
                        </Button>
                    </div>
                </Card>
            ))}

            {rules.length === 0 && (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
                    No recurring rules found. Create one to automate your billing.
                </div>
            )}
        </div>
    )
}
