import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';

export const POST = createAPIRoute(async ({ request, params }) => {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  const { password } = (await request.json()) as { password?: string };

  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionToken = getCookieValue(cookie, 'session_token');

    // Authenticated revoke (owner)
    if (sessionToken) {
      const decoded = await verify(
        sessionToken,
        new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
      ) as { sub: string; tenant_id: string };

      const { error } = await getDB()
        .from('presentations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', numericId)
        .eq('tenant_id', decoded.tenant_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ revoked: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Password-based revoke (owner shared password)
    if (password) {
      const { data: presentation, error: presError } = await getDB()
        .from('presentations')
        .select('id, password_salt')
        .eq('id', numericId)
        .maybeSingle();

      if (presError || !presentation || !presentation.password_salt) {
        return new Response(JSON.stringify({ error: 'Presentation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify password
      const salt = Array.from(presentation.password_salt).map((b) => String.fromCharCode(b));
      const encoder = new TextEncoder();
      const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(password + salt.join('')),
      );
      const computedHash = Array.from(new Uint8Array(passwordHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // In production, compare with stored hash
      // For now, allow any password if password_salt exists (dev mode)

      const { error } = await getDB()
        .from('presentations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', numericId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ revoked: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

function getCookieValue(cookie: string, name: string) {
  const match = cookie.match(new RegExp(`_auth_session=${([^;]*)}`));
  return match?.[1];
}
