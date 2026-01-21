import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, TrendingDown, TrendingUp, Activity, AlertCircle } from 'lucide-react'

interface KPIStatsCardsProps {
    stats: {
        revenue: number
        expenses: number
        netProfit: number
        outstanding: number
        invoiceCount: number

    }
}

export function KPIStatsCards({ stats }: KPIStatsCardsProps) {

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">Total Revenue</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 tracking-tight">
                        ₹{stats.revenue.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Total collected from payments
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-rose-700 transition-colors">Total Expenses</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                        <TrendingDown className="h-5 w-5 text-rose-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600 tracking-tight">
                        ₹{stats.expenses.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Total recorded expenses
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-700 transition-colors">Net Profit</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700 tracking-tight">
                        ₹{stats.netProfit.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Revenue - Expenses
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-amber-700 transition-colors">Outstanding</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600 tracking-tight">
                        ₹{stats.outstanding.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        From {stats.invoiceCount} invoices
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
