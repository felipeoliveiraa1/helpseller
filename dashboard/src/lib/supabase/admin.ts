import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client com service role para uso apenas em server (ex.: webhook Pagar.me).
 * Nunca expor no browser. Usar para operações que não têm usuário autenticado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createSupabaseClient(url, serviceRoleKey);
}
