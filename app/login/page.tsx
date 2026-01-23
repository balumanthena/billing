'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package2, Eye, EyeOff } from 'lucide-react'

// Initial state for useActionState
const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center mb-2">
                    <img src="/logo.png" alt="CitruX Health Solutions" className="h-60 w-auto" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Sign In</CardTitle>
                        <CardDescription>
                            Enter your email and password to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>

                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">
                                            {showPassword ? "Hide password" : "Show password"}
                                        </span>
                                    </Button>
                                </div>
                                <div className="items-center px-1">
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {state?.error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{state.error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter>
                        {/* Add disclaimer or help links intentionally left blank */}
                    </CardFooter>
                </Card>
            </div>
        </div >
    )
}
