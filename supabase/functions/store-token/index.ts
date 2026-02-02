/**
 * store-token Edge Function
 * Stores Microsoft provider tokens server-side for Graph API access.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId } = await verifyAuth(req);
    const { provider_token, provider_refresh_token, expires_in } = await req.json();

    if (!provider_token) {
      return new Response(
        JSON.stringify({ error: 'provider_token is required' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const admin = getAdminClient();
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    // Upsert: insert or update if user already has tokens
    const { error } = await admin
      .from('provider_tokens')
      .upsert(
        {
          user_id: userId,
          access_token: provider_token,
          refresh_token: provider_refresh_token || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Token storage error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store token' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('store-token error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
