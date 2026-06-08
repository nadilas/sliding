import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const POST = createAPIRoute(async ({ request, params }) => {
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

  const { data: presentation } = await getDB()
    .from('presentations')
    .select('id, tenant_id')
    .eq('id', numericId)
    .eq('tenant_id', dbUser.tenant_id)
    .maybeSingle();

  if (!presentation) {
    return new Response(JSON.stringify({ error: 'Presentation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: prevRevisions } = await getDB()
    .from('presentation_revisions')
    .select('content')
    .eq('presentation_id', numericId)
    .order('sequence', { ascending: false })
    .limit(1);

  const { data: newRevision, error: revError } = await getDB()
    .from('presentation_revisions')
    .insert({
      presentation_id: numericId,
      content: prevRevisions?.[0]?.content ?? {},
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

  return new Response(
    JSON.stringify({ revisionId: newRevision.id, status: 'generating' }),
    { status: 202, headers: { 'Content-Type': 'application/json' } },
  );
});
