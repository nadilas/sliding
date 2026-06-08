import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesINSERT, Updatable } from './types.ts';

let db: ReturnType<typeof createClient<Database>>;

export function getDB() {
  if (!db) {
    const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    db = createClient<Database>(url, key, {
      db: { transform: { values: { keepCase: false } } },
    });
  }
  return db;
}

export async function selectAll<T extends keyof Tables>(
  table: T,
  select: (keyof Tables[T])[],
  where: Record<string, unknown>,
) {
  const { data, error } = await getDB()
    .from(table)
    .select(select.join(','))
    .where(where)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Tables<T>[];
}

export async function selectOne<T extends keyof Tables>(
  table: T,
  select: (keyof Tables[T])[],
  where: Record<string, unknown>,
) {
  const { data, error } = await getDB()
    .from(table)
    .select(select.join(','))
    .where(where)
    .maybeSingle();

  if (error) throw error;
  return data as Tables<T> | null;
}

export async function insertOne<T extends keyof TablesINSERT>(
  table: T,
  row: TablesINSERT[T],
  select: (keyof Tables[T])[],
) {
  const { data, error } = await getDB()
    .from(table)
    .insert(row)
    .select(select.join(','))
    .single();

  if (error) throw error;
  return data as Tables[T];
}

export async function updateOne<T extends keyof Updatable>(
  table: T,
  where: Record<string, unknown>,
  updates: Record<keyof Updatable[T], unknown>,
  select: (keyof Tables[T])[],
) {
  const { data, error } = await getDB()
    .from(table)
    .update(updates)
    .where(where)
    .select(select.join(','))
    .single();

  if (error) throw error;
  return data as Tables[T];
}

export async function deleteOne<T extends keyof Tables>(
  table: T,
  where: Record<string, unknown>,
) {
  const { error } = await getDB().from(table).delete().where(where);
  if (error) throw error;
}
