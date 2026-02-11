import { getQuotations } from "@/app/actions/quotations"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

export default async function QuotationsPage() {
    const quotations = await getQuotations()

    // Metrics
    const totalQuotations = quotations.length
    const activeQuotations = quotations.filter((q: any) => ['draft', 'sent', 'viewed'].includes(q.status)).length
    const approvedQuotations = quotations.filter((q: any) => q.status === 'approved').length
    const convertedQuotations = quotations.filter((q: any) => q.status === 'converted').length

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
                    <p className="text-muted-foreground">Manage your project proposals and estimates.</p>
                </div>
                <Link href="/dashboard/quotations/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Quotation
                    </Button>
                </Link>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQuotations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeQuotations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedQuotations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Converted</CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{convertedQuotations}</div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Quotations</CardTitle>
                    <CardDescription>A list of all your quotations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Quotation No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No quotations found. Create your first one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                quotations.map((q: any) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-medium">{q.quotation_number}</TableCell>
                                        <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{q.parties?.name || 'Unknown'}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={q.project_title}>
                                            {q.project_title}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                q.status === 'approved' ? 'default' :
                                                    q.status === 'converted' ? 'secondary' : // Using secondary as 'success' is not standard in shadcn usually, or map to custom
                                                        q.status === 'rejected' ? 'destructive' :
                                                            q.status === 'sent' ? 'secondary' :
                                                                'outline'
                                            }>
                                                {q.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(q.grand_total)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/quotations/${q.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
