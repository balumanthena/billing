'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Define a separate type for the state to satisfy TypeScript
type FormState = {
    message?: string
    error?: string
}

const initialState: FormState = {
    message: '',
    error: '',
}

export default function ForgotPasswordPage() {
    // @ts-ignore - useActionState types can be finicky with server actions
    const [state, formAction, isPending] = useActionState(forgotPassword, initialState)

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
                    <CardDescription>
                        Enter your email address and we will send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
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
                            Send Reset Link
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
