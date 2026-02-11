import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { SupabaseClient } from "@supabase/supabase-js"

export async function getCompanySettings(companyId: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const { data: company, error } = await (supabase.from('companies') as any)
        .select('*')
        .eq('id', companyId)
        .single()

    if (error) {
        console.error('Error fetching company settings:', error)
        return null
    }

    return company
}
