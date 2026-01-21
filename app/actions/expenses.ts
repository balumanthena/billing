'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getExpenses() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data: expenses } = await (supabase
        .from('expenses') as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_deleted', false) // Soft delete filter
        .order('date', { ascending: false })

    return expenses || []
}

export async function upsertExpense(prevState: any, formData: FormData) {
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
    const category = formData.get('category') as string
    const vendor_name = formData.get('vendor_name') as string
    const amount = parseFloat(formData.get('amount') as string)
    const gst_amount = parseFloat(formData.get('gst_amount') as string || '0')
    const date = formData.get('date') as string
    const payment_mode = formData.get('payment_mode') as string
    const description = formData.get('description') as string

    const payload = {
        company_id: profile.company_id,
        category,
        vendor_name,
        amount,
        gst_amount,
        date,
        payment_mode,
        description,
        created_by: user.id
    }

    let error = null

    if (id) {
        const { error: updateError } = await (supabase
            .from('expenses') as any)
            .update(payload)
            .eq('id', id)
        error = updateError
    } else {
        const { error: insertError } = await (supabase
            .from('expenses') as any)
            .insert(payload)
        error = insertError
    }

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/dashboard/expenses')
    return { message: 'success' }
}

export async function deleteExpense(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    // Soft delete
    const { error } = await (supabase
        .from('expenses') as any)
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) return { message: error.message }

    revalidatePath('/dashboard/expenses')
    return { message: 'success' }
}
