import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const POST = createAPIRoute(async ({ request }) => {
  const { email, password, name, tenantName } = (await request.json()) as {
    email: string;
    password: string;
    name: string;
    tenantName: string;
  };

  const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(url, serviceKey);

  const { data: existing } = await getDB()
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: 'User already exists' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tenant, error: tenantError } = await getDB()
    .from('tenants')
    .insert({ name: tenantName || `${name.split(' ')[0]}'s Team` })
    .select('id')
    .single();

  if (tenantError) {
    return new Response(JSON.stringify({ error: tenantError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: user, error: userError } = await getDB()
    .from('users')
    .insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      email,
      name,
      role: 'admin',
    })
    .select('id, tenant_id, email, name, role')
    .single();

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ user: { id: user.id, tenant_id: user.tenant_id, email: user.email, name: user.name, role: user.role } }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
});
