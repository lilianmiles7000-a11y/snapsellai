import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PhotoEnhancement, UserAISettings, EnhancementAction } from '@/types';

function mapEnh(row: Record<string, unknown>): PhotoEnhancement {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    listing_id: (row.listing_id as string) ?? null,
    original_url: row.original_url as string,
    enhanced_url: (row.enhanced_url as string) ?? null,
    original_storage_path: (row.original_storage_path as string) ?? null,
    enhanced_storage_path: (row.enhanced_storage_path as string) ?? null,
    action: row.action as EnhancementAction,
    status: row.status as PhotoEnhancement['status'],
    provider: (row.provider as PhotoEnhancement['provider']) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function createEnhancement(params: Pick<PhotoEnhancement, 'original_url' | 'action' | 'listing_id' | 'original_storage_path'>): Promise<PhotoEnhancement | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('photo_enhancements').insert({ ...params, status: 'pending' }).select('*').maybeSingle();
  return data ? mapEnh(data as Record<string, unknown>) : null;
}

export async function updateEnhancement(id: string, patch: Partial<Pick<PhotoEnhancement, 'enhanced_url' | 'enhanced_storage_path' | 'status' | 'provider' | 'metadata'>>): Promise<PhotoEnhancement | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('photo_enhancements').update(patch).eq('id', id).select('*').maybeSingle();
  return data ? mapEnh(data as Record<string, unknown>) : null;
}

export async function fetchRecentEnhancements(limit = 6): Promise<PhotoEnhancement[]> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('photo_enhancements').select('*').eq('status', 'done').order('created_at', { ascending: false }).limit(limit);
  return (data ?? []).map((r: Record<string, unknown>) => mapEnh(r));
}

export async function fetchEnhancementsForListing(listingId: string): Promise<PhotoEnhancement[]> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('photo_enhancements').select('*').eq('listing_id', listingId).eq('status', 'done').order('created_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => mapEnh(r));
}

export async function fetchUserAISettings(userId: string): Promise<UserAISettings | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('user_ai_settings').select('*').eq('id', userId).maybeSingle();
  return data as UserAISettings ?? null;
}

export async function upsertUserAISettings(userId: string, patch: Partial<Pick<UserAISettings, 'default_preset' | 'auto_enhance' | 'preferred_background'>>): Promise<UserAISettings | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('user_ai_settings').upsert({ id: userId, ...patch }, { onConflict: 'id' }).select('*').maybeSingle();
  return data as UserAISettings ?? null;
}
