import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

const BUCKET = 'listing-images';

export async function uploadListingImage(userId: string, file: File): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = getSupabaseBrowserClient();

  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return null;

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteListingImage(path: string): Promise<boolean> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.storage.from(BUCKET).remove([path]);
  return !error;
}
