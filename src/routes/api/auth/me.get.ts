import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';

export const GET = createAPIRoute(async ({ request }) => {
  const cookie = request.headers.get('cookie') || '';
  const token = getCookieValue(cookie, 'session_token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decoded = await verify(
      token,
      new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
    ) as {
      sub: string;
      tenant_id: string;
      email: string;
      name: string;
      role: string;
    };

    const { data: user, error } = await getDB()
      .from('users')
      .select('id, tenant_id, email, name, role')
      .eq('id', decoded.sub)
      .maybeSingle();

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ user: { ...user, role: user.role as 'admin' | 'member' } }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function getCookieValue(cookie: string, name: string) {
  const match = cookie.match(new RegExp(`_auth_session=${([^;]*)}`));
  return match?.[1];
}
