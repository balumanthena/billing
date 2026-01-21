'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

type FormState = {
    message?: string
    error?: string
}

const initialState: FormState = {
    message: '',
    error: '',
}

export default function UpdatePasswordPage() {
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(updatePassword, initialState) as [FormState, any, boolean]

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                    <CardDescription>
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                            />
                        </div>
                        {state?.error && (
                            <div className="text-sm text-red-500 font-medium">{state.error}</div>
                        )}
                        {state?.message && (
                            <div className="text-sm text-green-600 font-medium">{state.message}</div>
                        )}
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
