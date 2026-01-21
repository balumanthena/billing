'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, Users, Package, FileText, CreditCard, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const items = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Company",
        href: "/dashboard/company",
        icon: Building2,
    },
    {
        title: "Parties",
        href: "/dashboard/parties",
        icon: Users,
    },
    {
        title: "Services",
        href: "/dashboard/services",
        icon: Package,
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

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    onLinkClick?: () => void
}

export function SidebarNav({ className, onLinkClick, ...props }: SidebarNavProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                >
                    <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start"
                    >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </Button>
                </Link>
            ))}
        </nav>
    )
}
