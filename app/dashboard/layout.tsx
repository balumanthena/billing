import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Package2 } from "lucide-react"

import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <Sheet>
            <div className="flex min-h-screen flex-col pb-16 md:pb-0">
                <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
                    <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
                        <Package2 className="h-6 w-6" />
                        <span className="">Billing Citrux</span>
                    </div>
                    {/* Desktop Sidebar Trigger (Hidden on Desktop usually, but here just hidden completely as we have sidebar) */}

                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav email={user?.email} name={user?.user_metadata?.full_name} image={user?.user_metadata?.avatar_url} />
                    </div>
                </header>
                <div className="flex flex-1">
                    <aside className="hidden w-[200px] flex-col border-r md:flex">
                        <div className="flex-1 py-4">
                            <SidebarNav className="flex-col space-x-0 space-y-1 px-2" />
                        </div>
                    </aside>
                    <main className="flex flex-1 flex-col p-4 md:p-6 overflow-y-auto">
                        {children}
                    </main>
                </div>
                <MobileBottomNav />
            </div>

            <SheetContent side="left" className="flex flex-col">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Main navigation menu for mobile devices
                </SheetDescription>
                <nav className="grid gap-2 text-lg font-medium">
                    <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <Package2 className="h-6 w-6" />
                        <span className="sr-only">Acme Inc</span>
                    </div>
                    {/* Reusing SidebarNav but tailored for sheet if needed, or just insert links directly */}
                    {/* For simplicity, let's render SidebarNav here too */}
                    <SidebarNav className="flex-col space-x-0 space-y-1" />
                </nav>
            </SheetContent>
        </Sheet>
    )
}
