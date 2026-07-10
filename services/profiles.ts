import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Profile } from '@/types';

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>): Promise<Profile | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('profiles').update(patch).eq('id', id).select('*').maybeSingle();
  return data as Profile ?? null;
}
