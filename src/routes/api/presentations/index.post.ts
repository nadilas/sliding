import { createAPIRoute } from '@tanstack/start';
import { getDB } from '../../../lib/db/index.ts';
import { verify } from 'jose';
import { createAI } from '../../../lib/ai/index.ts';
import { generateContentModel } from '../../../lib/ai/model.ts';

export const POST = createAPIRoute(async ({ request }) => {
  const cookie = request.headers.get('cookie') || '';
  const sessionToken = getCookieValue(cookie, 'session_token');

  if (!sessionToken) {
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

  // Decode JWT to get user info
  const decoded = await verify(
    sessionToken,
    new Uint8Array(Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8')),
  ) as { sub: string; tenant_id: string; email: string };

  const { data: user, error: userError } = await getDB()
    .from('users')
    .select('id, tenant_id, email')
    .eq('id', decoded.sub)
    .maybeSingle();

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate share token (UUID, unpredictable)
  const shareToken = crypto.randomUUID();
  let shareTokenHash: string | null = null;

  if (password) {
    // Hash the password with a salt for stored comparison
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(password + Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')),
    );
    shareTokenHash = Array.from(new Uint8Array(passwordHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Create presentation
  const { data: presentation, error: presError } = await getDB()
    .from('presentations')
    .insert({
      tenant_id: user.tenant_id,
      title,
      description: description || '',
      source_markdown,
      source_files: source_files || [],
      created_by: user.id,
      confidential: confidential ?? false,
      share_token: shareToken,
      share_token_hash: shareTokenHash,
      password_salt: password
        ? Array.from(
            await crypto.subtle.digest(
              'SHA-256',
              new Uint8Array(
                password + shareToken.slice(-8).split('').map((c) => c.charCodeAt(0)).buffer,
              ),
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

  // Generate presentation content via AI
  const ai = createAI();
  const contentModel = createAI(ai);

  let contentJson = {};
  let status: 'completed' | 'failed' = 'completed';
  let aiProvider = 'openai';
  let errorMessage: string | null = null;

  try {
    const content = await contentModel.generate(presError.id, source_markdown, source_files || []);
    contentJson = content;
  } catch (err) {
    status = 'failed';
    errorMessage = err instanceof Error ? err.message : 'AI generation failed';
  }

  // Create revision
  const { data: revision, error: revError } = await getDB()
    .from('presentation_revisions')
    .insert({
      presentation_id: presentation.id,
      content: contentJson,
      status,
      ai_provider: aiProvider,
      error_message: errorMessage,
    })
    .select('id, status')
    .single();

  if (revError) {
    return new Response(JSON.stringify({ error: revError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update presentation with latest revision
  await getDB()
    .from('presentations')
    .update({ latest_revision_id: revision.id, updated_at: new Date().toISOString() })
    .eq('id', presentation.id);

  return new Response(
    JSON.stringify({
      presentation,
      revision: { id: revision.id, status: revision.status },
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});

function getCookieValue(cookie: string, name: string) {
  const match = cookie.match(new RegExp(`_auth_session=${([^;]*)}`));
  return match?.[1];
}
