import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';

export const GET = createAPIRoute(async ({ request, params }) => {
  const { id } = await params;
  const numericId = parseInt(id, 10);
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

    // Get presentation
    const { data: presentation, error: presError } = await getDB()
      .from('presentations')
      .select('id, tenant_id, title, description, source_markdown, source_files, share_token, published_at, confidential, view_count, latest_revision_id')
      .eq('id', numericId)
      .eq('tenant_id', decoded.tenant_id)
      .maybeSingle();

    if (presError || !presentation) {
      return new Response(JSON.stringify({ error: 'Presentation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get latest revision
    const { data: revision, error: revError } = await getDB()
      .from('presentation_revisions')
      .select('id, sequence, content, status, ai_provider, created_at')
      .eq('presentation_id', numericId)
      .order('sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (revError) {
      return new Response(JSON.stringify({ error: revError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!revision) {
      return new Response(JSON.stringify({ error: 'No revisions found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Increment view count
    await getDB()
      .from('presentations')
      .update({ view_count: presentation.view_count + 1 })
      .eq('id', numericId);

    return new Response(
      JSON.stringify({
        presentation,
        revision: {
          id: revision.id,
          sequence: revision.sequence,
          content: revision.content,
          status: revision.status,
          ai_provider: revision.ai_provider,
          created_at: revision.created_at,
        },
      }),
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
