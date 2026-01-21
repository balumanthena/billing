import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { FileText, ShoppingBag, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Link from 'next/link'

interface RecentActivityProps {
    invoices: any[]
    expenses: any[]
}

export function RecentActivity({ invoices, expenses }: RecentActivityProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Invoices */}
            <Card className="border-none shadow-md ring-1 ring-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                    <CardTitle className="text-base font-bold text-slate-800">Recent Invoices</CardTitle>
                    <Link href="/dashboard/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</Link>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                    <div className="space-y-0">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-sm text-slate-400 text-center font-medium">No recent invoices</div>
                        ) : (
                            invoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-all duration-200 cursor-default group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{inv.customer_snapshot?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500 font-medium mt-0.5">{inv.invoice_number}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-emerald-700">₹{inv.grand_total?.toLocaleString()}</div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{inv.status}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="border-none shadow-md ring-1 ring-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                    <CardTitle className="text-base font-bold text-slate-800">Recent Expenses</CardTitle>
                    <Link href="/dashboard/expenses" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</Link>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                    <div className="space-y-0">
                        {expenses.length === 0 ? (
                            <div className="p-8 text-sm text-slate-400 text-center font-medium">No recent expenses</div>
                        ) : (
                            expenses.map((exp) => (
                                <div key={exp.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-all duration-200 cursor-default group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <ArrowUpRight className="h-5 w-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{exp.category}</div>
                                            <div className="text-xs text-slate-500 font-medium mt-0.5">{exp.vendor_name || 'Vendor'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-rose-700">₹{exp.amount?.toLocaleString()}</div>
                                        <div className="text-[10px] font-semibold text-slate-400">
                                            {format(new Date(exp.date), 'MMM d')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
