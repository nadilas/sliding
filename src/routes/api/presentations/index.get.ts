import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';

export const GET = createAPIRoute(async ({ request }) => {
  const cookie = request.headers.get('cookie') || '';
  const sessionToken = getCookieValue(cookie, 'session_token');

  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decoded = await verify(
      sessionToken,
      new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
    ) as { sub: string; tenant_id: string };

    const { data, error } = await getDB()
      .from('presentations')
      .select(
        'id, title, description, share_token, created_at, updated_at, published_at, view_count, confidential, latest_revision_id',
      )
      .eq('tenant_id', decoded.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ presentations: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
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
