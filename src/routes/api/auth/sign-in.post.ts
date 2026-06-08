import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const POST = createAPIRoute(async ({ request }) => {
  const { email, password } = (await request.json()) as { email: string; password: string };

  const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify credentials with Supabase Auth
  const supabase = createClient(url, serviceKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.session) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: user, error: userError } = await getDB()
    .from('users')
    .select('id, tenant_id, email, name, role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, name: user.name, role: user.role } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
