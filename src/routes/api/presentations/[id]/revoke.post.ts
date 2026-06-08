import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const POST = createAPIRoute(async ({ request, params }) => {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(url, serviceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: dbUser } = await getDB()
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!dbUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await getDB()
    .from('presentations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', numericId)
    .eq('tenant_id', dbUser.tenant_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ revoked: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
