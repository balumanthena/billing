"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, CreditCard, BarChart3, Menu } from "lucide-react"
import { SheetTrigger } from "@/components/ui/sheet"

const items = [
    {
        title: "Home",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Invoices",
        href: "/dashboard/invoices",
        icon: FileText,
    },
    {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: CreditCard,
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
    },
]

export function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t flex items-center justify-around md:hidden pb-1 px-1 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            {items.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </Link>
                )
            })}

            <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground">
                    <Menu className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </SheetTrigger>
        </div>
    )
}
