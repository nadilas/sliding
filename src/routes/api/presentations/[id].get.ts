import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const GET = createAPIRoute(async ({ request, params }) => {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(url, serviceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: dbUser } = await getDB()
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!dbUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: presentation, error: presError } = await getDB()
    .from('presentations')
    .select('id, tenant_id, title, description, source_markdown, source_files, share_token, published_at, confidential, view_count, latest_revision_id')
    .eq('id', numericId)
    .eq('tenant_id', dbUser.tenant_id)
    .maybeSingle();

  if (presError || !presentation) {
    return new Response(JSON.stringify({ error: 'Presentation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
});
