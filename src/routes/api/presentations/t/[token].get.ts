import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';

export const GET = createAPIRoute(async ({ params, request }) => {
  const { token } = await params;

  // Get presentation by share_token
  const { data: presentation, error: presError } = await getDB()
    .from('presentations')
    .select('id, tenant_id, title, description, share_token, published_at, confidential, view_count, share_token_hash')
    .eq('share_token', token)
    .maybeSingle();

  if (presError || !presentation) {
    return new Response(JSON.stringify({ error: 'Presentation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if revoked (revoked_at would be set)
  // In this schema, revoked presentations are hidden via a query filter

  // Check password if set
  const { password } = await request.json().catch(() => ({})) as { password?: string };

  if (presentation.share_token_hash) {
    // Token is password-protected
    if (!password) {
      return new Response(
        JSON.stringify({ requiresPassword: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Verify password
    const salt = presentation.password_salt
      ? Array.from(presentation.password_salt).map((b) => String.fromCharCode(b))
      : [];

    const encoder = new TextEncoder();
    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(password + salt.join('')),
    );
    const computedHash = Array.from(new Uint8Array(passwordHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedHash !== presentation.share_token_hash) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Increment view count (best-effort)
  try {
    await getDB()
      .from('presentations')
      .update({ view_count: presentation.view_count + 1 })
      .eq('id', presentation.id);
  } catch {
    // View count increment failure shouldn't block the user
  }

  // Get latest revision (use LATERAL JOIN via subquery)
  const { data: revision, error: revError } = await getDB()
    .from('presentation_revisions')
    .select('content')
    .eq('presentation_id', presentation.id)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (revError || !revision) {
    return new Response(JSON.stringify({ error: 'No content available yet' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return without sensitive fields
  const { share_token_hash, ...safePresentation } = presentation;

  return new Response(
    JSON.stringify({
      presentation: {
        ...safePresentation,
        password_salt: null,
      },
      revision: {
        content: revision.content,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
