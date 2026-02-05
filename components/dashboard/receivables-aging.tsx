import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface ReceivablesAgingProps {
    aging: {
        "0-15": number
        "16-30": number
        "31-45": number
        "45+": number
    }
    totalOutstanding: number
}

export function ReceivablesAging({ aging, totalOutstanding }: ReceivablesAgingProps) {
    // If total is 0, avoid division by zero
    const safeTotal = totalOutstanding || 1

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Outstanding Receivables Aging</CardTitle>
                <div className="text-xs text-muted-foreground">Breakdown of unpaid amounts by overdue days</div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                {/* Founder Signal: Red Flag */}
                {(aging["45+"] / safeTotal) > 0.3 && totalOutstanding > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-red-100 p-1.5 rounded-full shrink-0">
                            <span className="text-red-600 font-bold text-xs">⚠️</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-800">Founder Alert: High Risk</h4>
                            <p className="text-[11px] text-red-600 mt-1 leading-tight">
                                Over 30% of your receivables are stuck in 45+ days. Follow up immediately to prevent cash crunch.
                            </p>
                        </div>
                    </div>
                )}

                <AgingRow
                    label="0-15 Days"
                    amount={aging["0-15"]}
                    total={safeTotal}
                    colorClass="bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
                />

                <AgingRow
                    label="16-30 Days"
                    amount={aging["16-30"]}
                    total={safeTotal}
                    colorClass="bg-gradient-to-r from-yellow-500 to-amber-400 shadow-[0_2px_10px_rgba(245,158,11,0.3)]"
                />

                <AgingRow
                    label="31-45 Days"
                    amount={aging["31-45"]}
                    total={safeTotal}
                    colorClass="bg-gradient-to-r from-orange-500 to-orange-400 shadow-[0_2px_10px_rgba(249,115,22,0.3)]"
                />

                <AgingRow
                    label="45+ Days"
                    amount={aging["45+"]}
                    total={safeTotal}
                    colorClass="bg-gradient-to-r from-red-500 to-red-400 shadow-[0_2px_10px_rgba(239,68,68,0.3)]"
                />

                <div className="pt-4 border-t flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">Total Outstanding</span>
                    <span className="font-bold text-lg font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</span>
                </div>
            </CardContent>
        </Card>
    )
}

function AgingRow({ label, amount, total, colorClass }: { label: string, amount: number, total: number, colorClass: string }) {
    const percentage = Math.round((amount / total) * 100)

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-600">{label}</span>
                <span className="font-bold text-slate-800">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-100">
                <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(percentage, amount > 0 ? 2 : 0)}%` }}
                />
            </div>
        </div>
    )
}
