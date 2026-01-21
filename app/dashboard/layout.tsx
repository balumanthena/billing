import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Package2 } from "lucide-react"

import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="md:hidden shrink-0">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col">
                        <nav className="grid gap-2 text-lg font-medium">
                            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                                <Package2 className="h-6 w-6" />
                                <span className="sr-only">Acme Inc</span>
                            </div>
                            {/* Reusing SidebarNav but tailored for sheet if needed, or just insert links directly */}
                            {/* For simplicity, let's render SidebarNav here too */}
                            <SidebarNav />
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2 text-lg font-semibold md:text-base hidden md:flex">
                    <Package2 className="h-6 w-6" />
                    <span className="">Billing Citrux</span>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <UserNav email={user?.email} name={user?.user_metadata?.full_name} image={user?.user_metadata?.avatar_url} />
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="hidden w-[200px] flex-col border-r md:flex">
                    <div className="flex-1 py-4">
                        <SidebarNav className="px-2" />
                    </div>
                </aside>
                <main className="flex flex-1 flex-col p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
