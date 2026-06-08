import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { createClient } from '@supabase/supabase-js';

export const POST = createAPIRoute(async ({ request }) => {
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

  const { title, description, source_markdown, source_files, confidential, password } = (await request.json()) as {
    title: string;
    description?: string;
    source_markdown: string;
    source_files?: string[];
    confidential?: boolean;
    password?: string;
  };

  const { data: dbUser, error: userError } = await getDB()
    .from('users')
    .select('id, tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!dbUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const shareToken = crypto.randomUUID();
  let shareTokenHash: string | null = null;

  if (password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(password + Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')),
    );
    shareTokenHash = Array.from(new Uint8Array(passwordHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const { data: presentation, error: presError } = await getDB()
    .from('presentations')
    .insert({
      tenant_id: dbUser.tenant_id,
      title,
      description: description || '',
      source_markdown,
      source_files: source_files || [],
      created_by: dbUser.id,
      confidential: confidential ?? false,
      share_token: shareToken,
      share_token_hash: shareTokenHash,
      password_salt: password
        ? Array.from(
            await crypto.subtle.digest(
              'SHA-256',
              new Uint8Array(password + shareToken.slice(-8).split('').map((c) => c.charCodeAt(0)).buffer),
            ),
          )
        : undefined,
    })
    .select('id, title, share_token, created_at')
    .single();

  if (presError) {
    return new Response(JSON.stringify({ error: presError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: revision, error: revError } = await getDB()
    .from('presentation_revisions')
    .insert({
      presentation_id: presentation.id,
      content: {},
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

  await getDB()
    .from('presentations')
    .update({ latest_revision_id: revision.id, updated_at: new Date().toISOString() })
    .eq('id', presentation.id);

  return new Response(
    JSON.stringify({ presentation, revision: { id: revision.id, status: 'generating' } }),
    { status: 202, headers: { 'Content-Type': 'application/json' } },
  );
});
