import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { sign } from 'jose';

export const POST = createAPIRoute(async ({ request, context }) => {
  const body = await request.json();
  const { email, password, name, tenantName } = body as {
    email: string;
    password: string;
    name: string;
    tenantName: string;
  };

  const { data: authUser, error: authError } = await getDB()
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (authUser) {
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

  if (tenantError) throw tenantError;

  // Hash password
  const encoder = new TextEncoder();
  const passwordHash = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(password),
  );
  const passwordHex = Array.from(new Uint8Array(passwordHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const userId = crypto.randomUUID();

  const { data: user, error: userError } = await getDB()
    .from('users')
    .insert({
      id: userId,
      tenant_id: tenant.id,
      email,
      name,
      role: 'admin',
    })
    .select('id, tenant_id, email, name, role')
    .single();

  if (userError) throw userError;

  // Create session JWT
  const sessionToken = await sign(
    {
      sub: userId,
      tenant_id: tenant.id,
      email,
      name,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
    { algorithm: 'HS256' },
  );

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      sessionToken: await sessionToken,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
