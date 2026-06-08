import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';

export const POST = createAPIRoute(async ({ request, params }) => {
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

  const { feedback, source_markdown, source_files } = (await request.json()) as {
    feedback?: string;
    source_markdown?: string;
    source_files?: string[];
  };

  try {
    const decoded = await verify(
      sessionToken,
      new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
    ) as { sub: string; tenant_id: string };

    // Verify ownership
    const { data: presentation, error: presError } = await getDB()
      .from('presentations')
      .select('id, tenant_id, source_markdown, source_files')
      .eq('id', numericId)
      .eq('tenant_id', decoded.tenant_id)
      .maybeSingle();

    if (presError || !presentation) {
      return new Response(JSON.stringify({ error: 'Presentation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the previous revision for context (for diff-based regeneration)
    const { data: prevRevisions } = await getDB()
      .from('presentation_revisions')
      .select('id, content, status, ai_provider')
      .eq('presentation_id', numericId)
      .order('sequence', { ascending: false });

    const latestRevision = prevRevisions?.[0];

    // Start regeneration (async in production - return immediately with status)
    const { data: newRevision, error: revError } = await getDB()
      .from('presentation_revisions')
      .insert({
        presentation_id: numericId,
        content: latestRevision?.content ?? {},
        status: 'generating',
      })
      .select('id')
      .single();

    if (revError) {
      return new Response(JSON.stringify({ error: revError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Queue the actual AI generation as a background task
    // For now, return immediately with the revision ID
    // The background worker will update the status to 'completed' or 'failed'

    return new Response(
      JSON.stringify({
        revisionId: newRevision.id,
        status: 'generating',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      },
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
