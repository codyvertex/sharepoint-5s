/**
 * Auth Helper for Edge Functions
 * Verifies the Supabase JWT and extracts the user ID.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface AuthResult {
  userId: string;
  accessToken: string;
}

/**
 * Verify the Authorization header and return the user ID.
 * Throws if the token is invalid or missing.
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  // Create a Supabase client with the user's JWT to verify it
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return {
    userId: user.id,
    accessToken: token,
  };
}
