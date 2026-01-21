'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RevenueExpenseChartProps {
    data: {
        name: string
        Sales: number
        Expenses: number
    }[]
}

export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
    // Determine max value for scaling
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.Sales, d.Expenses)),
        1000 // Minimum scale
    )

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Sales vs Expenses (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full flex items-end justify-between gap-2 pt-6">
                    {data.map((item, index) => {
                        const salesHeight = (item.Sales / maxValue) * 100
                        const expenseHeight = (item.Expenses / maxValue) * 100

                        return (
                            <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-10 whitespace-nowrap">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-emerald-400">Sales: ₹{item.Sales.toLocaleString()}</div>
                                    <div className="text-red-400">Exp: ₹{item.Expenses.toLocaleString()}</div>
                                </div>

                                <div className="w-full flex items-end justify-center gap-1 h-full px-1">
                                    {/* Sales Bar */}
                                    <div
                                        className="w-full max-w-[20px] bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-sm shadow-[0_4px_10px_rgba(16,185,129,0.2)] transition-all duration-300"
                                        style={{ height: `${Math.max(salesHeight, 2)}%` }}
                                    ></div>
                                    {/* Expense Bar */}
                                    <div
                                        className="w-full max-w-[20px] bg-gradient-to-t from-red-600 to-red-400 hover:from-red-500 hover:to-red-300 rounded-t-sm shadow-[0_4px_10px_rgba(239,68,68,0.2)] transition-all duration-300"
                                        style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 font-medium">{item.name}</div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
