import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
// Helper to format snake_case to Title Case (e.g. "bank_transfer" -> "Bank Transfer")
export function formatLabel(str: string | null | undefined): string {
    if (!str) return '-'
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}
