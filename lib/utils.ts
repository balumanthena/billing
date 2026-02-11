import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatLabel(str: string | null | undefined): string {
    if (!str) return '-'
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export function formatCurrency(amount: any) {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(value) || value === null || value === undefined) return '₹0.00'

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(value)
}

export function formatDate(date: string | Date | null | undefined) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}
