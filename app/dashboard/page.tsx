import { getDashboardStats } from '@/app/actions/payments'
import { KPIStatsCards } from '@/components/dashboard/kpi-stats-cards'
import { RevenueExpenseChart } from '@/components/dashboard/charts/revenue-expense-chart'
import { ReceivablesAging } from '@/components/dashboard/receivables-aging'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>

            {/* Row 1: KPI Stats */}
            <KPIStatsCards stats={stats} />

            {/* Row 2: Charts & Insights */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 lg:col-span-4">
                    <RevenueExpenseChart data={stats.monthlyStats} />
                </div>
                <div className="col-span-1 lg:col-span-3">
                    <ReceivablesAging aging={stats.aging} totalOutstanding={stats.outstanding} />
                </div>
            </div>

            {/* Row 3: Recent Activity */}
            <RecentActivity
                invoices={stats.recentInvoices}
                expenses={stats.recentExpenses}
            />
        </div>
    )
}
