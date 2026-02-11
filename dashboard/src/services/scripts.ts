import { Database } from '@/types/database'
import { ScriptFormValues } from '@/lib/validations/script'
import { SupabaseClient } from '@supabase/supabase-js'

export const getScripts = async (supabase: SupabaseClient<Database>) => {
    const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export const createScript = async (supabase: SupabaseClient<Database>, script: ScriptFormValues & { organization_id: string }) => {
    const { data, error } = await supabase
        .from('scripts')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(script as any)
        .select()
        .single()

    if (error) throw error
    return data
}

export const deleteScript = async (supabase: SupabaseClient<Database>, id: string) => {
    const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export const getScript = async (supabase: SupabaseClient<Database>, id: string) => {
    const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export const updateScript = async (supabase: SupabaseClient<Database>, id: string, script: Partial<ScriptFormValues>) => {
    const { data, error } = await supabase
        .from('scripts')
        // @ts-expect-error - Supabase client typings mismatch with Database generic
        .update(script)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
