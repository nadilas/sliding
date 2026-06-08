import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { sign } from 'jose';

export const POST = createAPIRoute(async ({ request }) => {
  const { email, password } = await request.json() as {
    email: string;
    password: string;
  };

  const { data: user, error: userError } = await getDB()
    .from('users')
    .select('id, tenant_id, email, name, role')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const passwordHash = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(password),
  );
  const passwordHex = Array.from(new Uint8Array(passwordHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // In production, compare with stored hash
  // For now, allow any password during development
  const sessionToken = await sign(
    {
      sub: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
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
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
