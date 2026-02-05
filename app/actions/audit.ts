'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type AuditAction = 'create' | 'update' | 'delete' | 'finalize' | 'approve' | 'login'

export async function logAuditEvent(
    table: string,
    recordId: string,
    action: AuditAction,
    oldData: any | null,
    newData: any | null,
    description: string
) {
    try {
        const supabase = (await createClient()) as SupabaseClient<Database>
        const { data: { user } } = await supabase.auth.getUser()

        // We fire and forget, but in server action we await to ensure it writes
        await (supabase.from('audit_logs') as any).insert({
            table_name: table,
            record_id: recordId,
            action,
            old_data: oldData,
            new_data: newData,
            performed_by: user?.id,
            description
            // ip_address would require headers(), passing it might be complex here, skipping for MVP
        })
    } catch (e) {
        console.error('Audit Log Failed:', e)
        // Do not block main flow if audit fails, but log critical error
    }
}
