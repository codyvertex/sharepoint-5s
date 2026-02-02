/**
 * Supabase Admin Client (service-role)
 * Used by Edge Functions for privileged operations like reading provider_tokens.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

let client: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!client) {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
