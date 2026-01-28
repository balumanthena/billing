'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, Edit, Trash2, CheckCircle, FileText } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteAgreement, updateAgreementStatus } from '@/app/actions/agreements'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AgreementActionsProps {
    agreementId: string
    currentStatus: string
}

export function AgreementActions({ agreementId, currentStatus }: AgreementActionsProps) {
    const router = useRouter()
    const [openDelete, setOpenDelete] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        const res = await updateAgreementStatus(agreementId, newStatus)
        if (!res.success) {
            alert("Error updating status: " + res.message)
        }
        setLoading(false)
        router.refresh()
    }

    const handleDelete = async () => {
        setLoading(true)
        const res = await deleteAgreement(agreementId)
        if (!res.success) {
            alert("Error deleting agreement: " + res.message)
            setLoading(false)
            setOpenDelete(false)
        } else {
            setOpenDelete(false)
            setLoading(false)
            router.refresh()
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/agreements/${agreementId}/edit`} className="flex items-center cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </DropdownMenuItem>
                    {currentStatus === 'draft' && (
                        <DropdownMenuItem onClick={() => handleStatusChange('active')} disabled={loading}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Active
                        </DropdownMenuItem>
                    )}
                    {currentStatus === 'active' && (
                        <DropdownMenuItem onClick={() => handleStatusChange('draft')} disabled={loading}>
                            <FileText className="mr-2 h-4 w-4" /> Mark as Draft
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpenDelete(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        disabled={loading}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the agreement from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
