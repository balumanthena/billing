import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, TrendingDown, TrendingUp, Activity, AlertCircle } from 'lucide-react'

interface KPIStatsCardsProps {
    stats: {
        cashInHand: number
        netReceivable: number
        lockedTDS: number
        gstLiability: number
        accountingProfit: number
        invoiceCount: number
    }
}

export function KPIStatsCards({ stats }: KPIStatsCardsProps) {

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Cash In Hand (Green - Safe Money) */}
            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">Cash In Hand</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-700 tracking-tight">
                        ₹{stats.cashInHand.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Real Operating Cash (Col - Exp)
                    </p>
                </CardContent>
            </Card>

            {/* 2. Net Receivable (Blue - Future Cash) */}
            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-700 transition-colors">Net Receivable</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700 tracking-tight">
                        ₹{stats.netReceivable.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Actual collectible (Excl TDS)
                    </p>
                </CardContent>
            </Card>

            {/* 3. Locked TDS (Purple - Govt Asset) */}
            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-700 transition-colors">Locked TDS</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600 tracking-tight">
                        ₹{stats.lockedTDS.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Asset with Income Tax Dept
                    </p>
                </CardContent>
            </Card>

            {/* 4. GST Liability (Red/Orange - Immediate Risk) */}
            <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm ring-1 ring-slate-100 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-orange-700 transition-colors">GST Liability</CardTitle>
                    <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600 tracking-tight">
                        ₹{stats.gstLiability.toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Est. Net Payable (Output - Input)
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
