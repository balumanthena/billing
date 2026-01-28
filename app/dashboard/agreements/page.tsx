import Link from 'next/link'
import { Plus, FileText, Download, FilePlus2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getAgreements } from '@/app/actions/agreements'
import { format } from 'date-fns'
import { PdfDownloadBtn } from '@/components/agreements/pdf-download-btn'
import { AgreementActions } from '@/components/agreements/agreement-actions'

export default async function AgreementsPage() {
    const agreements = await getAgreements()

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1600px] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Service Agreements</h1>
                    <p className="text-muted-foreground">Manage and track your client service agreements and contracts.</p>
                </div>
                <Link href="/dashboard/agreements/new">
                    <Button size="lg" className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Agreement
                    </Button>
                </Link>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="px-6 py-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium">Agreement History</CardTitle>
                        <div className="text-xs text-muted-foreground font-normal">
                            Showing {agreements.length} records
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[30%] pl-6 h-12">Client Details</TableHead>
                                <TableHead className="w-[20%] h-12">Agreement Date</TableHead>
                                <TableHead className="w-[20%] h-12">Project Value</TableHead>
                                <TableHead className="w-[15%] h-12">Status</TableHead>
                                <TableHead className="w-[15%] text-right pr-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agreements.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                <FilePlus2 className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-foreground">No agreements found</p>
                                                <p className="text-sm">Create your first service agreement to get started.</p>
                                            </div>
                                            <Link href="/dashboard/agreements/new" className="pt-2">
                                                <Button variant="outline">
                                                    Create Agreement
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {agreements.map((agreement: any) => (
                                <TableRow key={agreement.id} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{agreement.parties?.name || 'Unknown Client'}</span>
                                            <span className="text-xs text-muted-foreground">{agreement.parties?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{format(new Date(agreement.date), 'MMM dd, yyyy')}</span>
                                            <span className="text-xs text-muted-foreground">Created {format(new Date(agreement.created_at), 'p')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="font-semibold text-foreground">
                                            ₹{agreement.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {agreement.tax_mode} Tax
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant={agreement.status === 'draft' ? 'secondary' : 'default'} className="uppercase text-[10px] font-bold tracking-wider">
                                            {agreement.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <PdfDownloadBtn agreement={agreement} />
                                            <AgreementActions agreementId={agreement.id} currentStatus={agreement.status} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

