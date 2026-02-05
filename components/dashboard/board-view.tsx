'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Lock } from 'lucide-react'

// Types for props (matching getBoardMetrics return)
interface BoardMetrics {
    tcv: number
    revenueMix: {
        retainer: number
        project: number
        amc: number
        milestone: number
    }
    dso: number
    burnRate: number
    topClients: { name: string, amount: number, percentage: string }[]
    totalRevenue: number
}

export function BoardView({ metrics, runwayMonths }: { metrics: BoardMetrics, runwayMonths: number }) {
    if (!metrics) return <div>No data available</div>

    // Healthy thresholds
    const isHealthyDSO = metrics.dso < 45
    const isHealthyRunway = runwayMonths > 6
    const recurringRevenue = metrics.revenueMix.retainer + metrics.revenueMix.amc
    const recurringPercent = metrics.totalRevenue > 0 ? (recurringRevenue / metrics.totalRevenue) * 100 : 0

    // Overall Health Score (Arbitrary for demo)
    const healthScore = (isHealthyDSO ? 40 : 10) + (isHealthyRunway ? 30 : 10) + (recurringPercent > 30 ? 30 : 10)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. The 30-Second Answer */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Board Summary</h2>
                        <h1 className="text-3xl font-bold mt-1">
                            Business Health: <span className={healthScore > 80 ? "text-emerald-400" : "text-amber-400"}>
                                {healthScore > 80 ? 'Excellent' : 'Stable'}
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-2 max-w-xl">
                            Runway is <strong>{runwayMonths.toFixed(1)} months</strong>. Collections take <strong>{metrics.dso} days</strong> on average.
                            <strong> {recurringPercent.toFixed(0)}%</strong> of revenue is recurring.
                        </p>
                    </div>
                    <div className="text-right">
                        <Badge variant="outline" className="text-white border-white/20 text-lg px-4 py-1">
                            Score: {healthScore}/100
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-700/50">
                    <div>
                        <div className="text-slate-400 text-xs mb-1">Total Contract Value (TCV)</div>
                        <div className="text-2xl font-mono font-bold">₹{metrics.tcv.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs mb-1">Avg Collection Speed (DSO)</div>
                        <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${isHealthyDSO ? 'text-emerald-400' : 'text-red-400'}`}>
                            {metrics.dso} Days
                            {!isHealthyDSO && <AlertTriangle className="h-4 w-4" />}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs mb-1">Monthly Burn Rate</div>
                        <div className="text-2xl font-mono font-bold">₹{Math.round(metrics.burnRate).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs mb-1">Runway (Conservative)</div>
                        <div className={`text-2xl font-mono font-bold ${isHealthyRunway ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {runwayMonths.toFixed(1)} Months
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Revenue Quality & Governance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Revenue Mix */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Revenue Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-purple-700">Retainers & AMC (Recurring)</span>
                                <span>₹{recurringRevenue.toLocaleString()}</span>
                            </div>
                            <Progress value={recurringPercent} className="h-2 bg-slate-100" indicatorClassName="bg-purple-600" />
                            <p className="text-xs text-muted-foreground">{recurringPercent.toFixed(1)}% predictability</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-blue-700">Projects & One-time</span>
                                <span>₹{(metrics.revenueMix.project + metrics.revenueMix.milestone).toLocaleString()}</span>
                            </div>
                            <Progress value={100 - recurringPercent} className="h-2 bg-slate-100" indicatorClassName="bg-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Concentration Risk */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase text-slate-500">Client Concentration Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.topClients.map((client, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium">{client.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">₹{client.amount.toLocaleString('en-IN')}</div>
                                        <div className={`text-xs ${parseFloat(client.percentage) > 40 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                            {client.percentage}% {parseFloat(client.percentage) > 40 && '⚠️ Risk'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Governance Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-slate-200 p-2 rounded-full">
                    <Lock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Governance Active</h3>
                    <p className="text-sm text-slate-600">
                        System enforces immutable invoices, audit trails for all payments, and strict TDS/GST compliance.
                        <span className="text-emerald-700 font-medium ml-1">Board-Ready.</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
