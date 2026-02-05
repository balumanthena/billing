import { getBoardMetrics } from '@/app/actions/board'
import { getDashboardStats } from '@/app/actions/payments'
import { BoardView } from '@/components/dashboard/board-view'
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
    const metrics = await getBoardMetrics()
    const stats = await getDashboardStats()

    if (!metrics || !stats) {
        return <div className="p-8 text-center text-slate-500">Board data unavailable. Ensure database is configured.</div>
    }

    // Calculate Runway: Cash In Hand / Burn Rate
    // If Burn Rate is 0, potential infinite runway (or div/0 error)
    const runway = metrics.burnRate > 0 ? (stats.cashInHand / metrics.burnRate) : (stats.cashInHand > 0 ? 99 : 0)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        Board Intelligence
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        High-level fiduciary view for investors and stakeholders.
                    </p>
                </div>
            </div>

            <BoardView metrics={metrics} runwayMonths={runway} />
        </div>
    )
}
