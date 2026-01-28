'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getCompany() {
    const supabase = (await createClient()) as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get user profile to find company_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as any

    if (!profile || !profile.company_id) return null

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()

    return company
}

export async function updateCompany(prevState: any, formData: FormData) {
    const supabase = (await createClient()) as SupabaseClient<Database>

    // Basic validation - in real app use Zod
    const name = formData.get('name') as string
    const gstin = formData.get('gstin') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const state_code = formData.get('state_code') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const pan = formData.get('pan') as string
    const logo_url = formData.get('logo_url') as string
    const id = formData.get('id') as string

    // If no ID, we might need to create (for bootstrapping first time)
    // But for "Settings" usually we update. 
    // Let's assume update for now, or insert if ID is missing but user is authenticated?
    // RBAC policy handles security.

    const payload = {
        name,
        gstin,
        address,
        city,
        state,
        state_code,
        email,
        phone,
        pan,
        logo_url,
        // updated_at: new Date().toISOString() // Not in schema yet
    }

    let error = null

    if (id) {
        console.log('Update Company: Updating existing company', id)
        const { error: updateError } = await (supabase
            .from('companies') as any)
            .update(payload)
            .eq('id', id)
        error = updateError
    } else {
        console.log('Update Company: Creating NEW company')
        // Handle case where user has no company yet - create one and link profile
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
            console.error('Update Company: User not authenticated')
            return { message: 'Not authenticated' }
        }

        const { data: newCompany, error: createError } = await (supabase
            .from('companies') as any)
            .insert(payload)
            .select()
            .single()

        if (createError) {
            console.error('Update Company: Create Failed', createError)
            return { message: createError.message }
        }
        console.log('Update Company: Company Created', newCompany.id)

        // Link to profile
        console.log('Update Company: Linking profile', user.user.id, 'to company', newCompany.id)
        const { error: profileError } = await (supabase
            .from('profiles') as any)
            .upsert({ id: user.user.id, company_id: newCompany.id, role: 'admin' }, { onConflict: 'id' })

        if (profileError) {
            console.error('Update Company: Profile Link Failed', profileError)
            return { message: 'Company created but failed to link profile: ' + profileError.message }
        }
        console.log('Update Company: Profile Linked Successfully')
    }

    if (error) {
        console.error('Update Company: General Error', error)
        return { message: error.message }
    }

    revalidatePath('/', 'layout')
    return { message: 'Company details updated successfully' }
}
