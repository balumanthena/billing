'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getItems() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: items } = await (supabase
        .from('items') as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    return items || []
}

export async function upsertItem(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company found' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const sac_code = formData.get('sac_code') as string
    const tax_rate = parseFloat(formData.get('tax_rate') as string)
    const unit_price = parseFloat(formData.get('unit_price') as string)
    const description = formData.get('description') as string

    const payload = {
        company_id: profile.company_id,
        name,
        sac_code,
        tax_rate,
        unit_price,
        description
    }

    let error = null

    if (id) {
        const { error: updateError } = await (supabase
            .from('items') as any)
            .update(payload)
            .eq('id', id)
        error = updateError
    } else {
        const { error: insertError } = await (supabase
            .from('items') as any)
            .insert(payload)
        error = insertError
    }

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/dashboard/services')
    return { message: 'success' }
}
