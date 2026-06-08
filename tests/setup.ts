import { createClient } from '@supabase/supabase-js';

export interface TestContext {
  userId: string;
  tenantId: string;
  token: string;
  api: {
    createPresentation: (token: string, data: Record<string, unknown>) => Promise<Response>;
    regeneratePresentation: (token: string, id: number, data: Record<string, unknown>) => Promise<Response>;
    getSharedPresentation: (shareToken: string, extra?: Record<string, unknown>) => Promise<Response>;
    revokePresentation: (token: string, id: number) => Promise<Response>;
  };
  seedDatabase: () => Promise<void>;
  createUser: () => Promise<{ id: string; tenant_id: string; token: string }>;
}

let db: ReturnType<typeof createClient>;

function getDB() {
  if (!db) {
    db = createClient(
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sliding',
      process.env.DATABASE_SERVICE_KEY || '',
    );
  }
  return db;
}

export async function createTestClient(): Promise<TestContext> {
  const userId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const appToken = await createToken({ sub: userId, tenant_id: tenantId });

  return {
    userId,
    tenantId,
    token: appToken,
    api: {
      createPresentation: async (token: string, data: Record<string, unknown>) => {
        return fetch('http://localhost:3000/api/presentations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      },
      regeneratePresentation: async (token: string, id: number, data: Record<string, unknown>) => {
        return fetch(`http://localhost:3000/api/presentations/${id}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      },
      getSharedPresentation: async (shareToken: string, extra?: Record<string, unknown>) => {
        const body = extra ? JSON.stringify(extra) : undefined;
        return fetch(`http://localhost:3000/api/presentations/t/${shareToken}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      },
      revokePresentation: async (token: string, id: number) => {
        return fetch(`http://localhost:3000/api/presentations/${id}/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
    seedDatabase: async () => {
      const { error } = await getDB()
        .from('tenants')
        .insert({ id: tenantId, name: 'Test Tenant' });
      if (error) throw error;

      const { error: userError } = await getDB()
        .from('users')
        .insert({
          id: userId,
          tenant_id: tenantId,
          email: 'test@sliding.dev',
          name: 'Test User',
        });
      if (userError) throw userError;
    },
    createUser: async () => {
      const uid = crypto.randomUUID();
      const tid = crypto.randomUUID();
      const tkn = await createToken({ sub: uid, tenant_id: tid });

      const { error: userError } = await getDB()
        .from('users')
        .insert({
          id: uid,
          tenant_id: tid,
          email: `user-${uid.slice(0, 8)}@sliding.dev`,
          name: 'Test User',
        });
      if (userError) throw userError;

      return { id: uid, tenant_id: tid, token: tkn };
    },
  };
}

async function createToken(payload: Record<string, unknown>): Promise<string> {
  const secret = new Uint8Array(
    Buffer.from(process.env.BETTER_AUTH_SECRET || 'dev-secret-change', 'utf-8'),
  );

  const encoder = new TextEncoder();
  const header = encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const parts = encoder.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));

  const base64Url = (data: Uint8Array) =>
    btoa(String.fromCharCode(...data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const sig = await crypto.subtle.sign(
    'HMAC',
    secret,
    new Uint8Array([...encoder.encode(base64Url(header)), 46, ...encoder.encode(base64Url(parts))]),
  );

  return `${base64Url(header)}.${base64Url(parts)}.${base64Url(new Uint8Array(sig))}`;
}
