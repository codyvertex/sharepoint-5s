/**
 * refresh-token Edge Function
 * Refreshes an expired Microsoft access token and returns a fresh one.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { getGraphToken } from '../_shared/graph-client.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId } = await verifyAuth(req);
    const accessToken = await getGraphToken(userId);

    return new Response(
      JSON.stringify({ access_token: accessToken }),
      { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('refresh-token error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
