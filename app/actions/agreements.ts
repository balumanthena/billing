'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function createAgreement(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    // 1. Get User & Company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return { message: 'No company profile found' }

    // 2. Extract Data
    // We expect the form to submit JSON strings for complex objects since FormData is flat
    const customerId = formData.get('customer_id') as string
    const date = formData.get('date') as string
    const grandTotal = parseFloat(formData.get('grand_total') as string) || 0
    const taxMode = formData.get('tax_mode') as string
    const projectSettings = JSON.parse(formData.get('project_settings') as string)
    const servicesSnapshot = JSON.parse(formData.get('services_snapshot') as string)

    // 3. Insert
    const { error } = await (supabase.from('agreements') as any).insert({
        company_id: profile.company_id,
        customer_id: customerId,
        date: date,
        status: 'draft',
        grand_total: grandTotal,
        tax_mode: taxMode,
        project_settings: projectSettings,
        services_snapshot: servicesSnapshot,
        created_by: user.id
    })

    if (error) {
        console.error('Error creating agreement:', error)
        return { message: 'Failed to create agreement: ' + error.message }
    }

    revalidatePath('/dashboard/agreements')
    return { success: true, message: 'Agreement saved successfully!' }
}


export async function getAgreements() {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile?.company_id) return []

    const { data, error } = await (supabase
        .from('agreements') as any)
        .select(`
            *,
            parties (*),
            companies (*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching agreements:', error)
        return []
    }

    return data
}

export async function getAgreement(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await (supabase
        .from('agreements') as any)
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function deleteAgreement(id: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Not authenticated' }

    const { error } = await (supabase
        .from('agreements') as any)
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath('/dashboard/agreements')
    return { success: true, message: 'Agreement deleted successfully' }
}

export async function updateAgreementStatus(id: string, status: string) {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { error } = await (supabase
        .from('agreements') as any)
        .update({ status })
        .eq('id', id)

    if (error) return { success: false, message: error.message }

    revalidatePath('/dashboard/agreements')
    return { success: true }
}

export async function updateAgreement(id: string, prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    const customerId = formData.get('customer_id') as string
    const date = formData.get('date') as string
    const grandTotal = parseFloat(formData.get('grand_total') as string) || 0
    const taxMode = formData.get('tax_mode') as string
    const projectSettings = JSON.parse(formData.get('project_settings') as string)
    const servicesSnapshot = JSON.parse(formData.get('services_snapshot') as string)

    const { error } = await (supabase.from('agreements') as any).update({
        customer_id: customerId,
        date: date,
        grand_total: grandTotal,
        tax_mode: taxMode,
        project_settings: projectSettings,
        services_snapshot: servicesSnapshot,
        updated_at: new Date().toISOString()
    }).eq('id', id)

    if (error) {
        console.error('Error updating agreement:', error)
        return { message: 'Failed to update agreement: ' + error.message }
    }

    revalidatePath('/dashboard/agreements')
    return { success: true, message: 'Agreement updated successfully!' }
}
