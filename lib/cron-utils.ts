import { addDays, addMonths, addWeeks, addYears, startOfDay, isBefore } from 'date-fns'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/**
 * Calculates the next run date based on a frequency string.
 * This is a simplified replacement for a full cron parser.
 * 
 * @param expression - 'daily', 'weekly', 'monthly', etc.
 * @param lastRun - The reference date (defaults to now)
 */
export function calculateNextRun(expression: string, lastRun: Date = new Date()): Date {
    const base = startOfDay(lastRun)

    // Simple frequency handling
    switch (expression.toLowerCase()) {
        case 'daily':
            return addDays(base, 1)
        case 'weekly':
            return addWeeks(base, 1)
        case 'monthly':
            return addMonths(base, 1)
        case 'quarterly':
            return addMonths(base, 3)
        case 'yearly':
            return addYears(base, 1)
        default:
            // Fallback: If it looks like a day number "15", treat as "monthly on 15th" logic? 
            // For MVP, default to monthly if unknown, or throw.
            // Let's safe-fail to tomorrow to retry logic or manual adjustment
            console.warn(`Unknown frequency '${expression}', defaulting to daily check.`)
            return addDays(base, 1)
    }
}

/**
 * Checks if a rule is due for execution.
 * @param nextRunAt - The scheduled execution time from DB
 */
export function isDue(nextRunAt: string | Date): boolean {
    if (!nextRunAt) return false
    const now = new Date()
    return isBefore(new Date(nextRunAt), now) || new Date(nextRunAt).getTime() <= now.getTime()
}
