'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getParties() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: parties } = await (supabase
        .from('parties') as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return parties || []
}

export async function upsertParty(prevState: any, formData: FormData) {
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
    const gstin = formData.get('gstin') as string
    const type = formData.get('type') as string
    const state = formData.get('state') as string
    const state_code = formData.get('state_code') as string
    const address = formData.get('address') as string

    const payload = {
        company_id: profile.company_id,
        name,
        gstin,
        type,
        state,
        state_code,
        address,
    }

    let error = null

    if (id) {
        const { error: updateError } = await (supabase
            .from('parties') as any)
            .update(payload)
            .eq('id', id)
        error = updateError
    } else {
        const { error: insertError } = await (supabase
            .from('parties') as any)
            .insert(payload)
        error = insertError
    }

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/dashboard/parties')
    return { message: 'success' }
}
