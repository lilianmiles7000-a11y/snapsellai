import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Listing, ListingImage, Platform, UsageStats } from '@/types';

function mapListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: (row.title as string) ?? null,
    description: (row.description as string) ?? null,
    brand: (row.brand as string) ?? null,
    category: (row.category as string) ?? null,
    subcategory: (row.subcategory as string) ?? null,
    condition: (row.condition as string) ?? null,
    size: (row.size as string) ?? null,
    colors: (row.colors as string[]) ?? null,
    materials: (row.materials as string[]) ?? null,
    gender: (row.gender as string) ?? null,
    suggested_price: row.suggested_price != null ? Number(row.suggested_price) : null,
    quick_sale_price: row.quick_sale_price != null ? Number(row.quick_sale_price) : null,
    premium_price: row.premium_price != null ? Number(row.premium_price) : null,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    currency: (row.currency as string) ?? 'EUR',
    platform: (row.platform as Platform) ?? null,
    status: (row.status as Listing['status']) ?? 'draft',
    seo_keywords: (row.seo_keywords as string[]) ?? null,
    tags: (row.tags as string[]) ?? null,
    hashtags: (row.hashtags as string[]) ?? null,
    images: (row.listing_images as ListingImage[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchRecentListings(limit = 6): Promise<Listing[]> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('listings').select('*, listing_images(*)').order('created_at', { ascending: false }).limit(limit);
  return (data ?? []).map((r: Record<string, unknown>) => mapListing(r));
}

export async function fetchAllListings(): Promise<Listing[]> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('listings').select('*, listing_images(*)').order('created_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => mapListing(r));
}

export async function createListingRecord(platform: Platform): Promise<Listing | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('listings').insert({ platform, status: 'generating' }).select('*').maybeSingle();
  return data ? mapListing(data as Record<string, unknown>) : null;
}

export async function updateListing(id: string, patch: Partial<Omit<Listing, 'id' | 'user_id' | 'images' | 'created_at' | 'updated_at'>>): Promise<Listing | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('listings').update(patch).eq('id', id).select('*, listing_images(*)').maybeSingle();
  return data ? mapListing(data as Record<string, unknown>) : null;
}

export async function deleteListing(id: string): Promise<boolean> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.from('listings').delete().eq('id', id);
  return !error;
}

export async function addImageToListing(listingId: string, url: string, storagePath: string | null, orderIndex: number): Promise<void> {
  const sb = getSupabaseBrowserClient();
  await sb.from('listing_images').insert({ listing_id: listingId, url, storage_path: storagePath, order_index: orderIndex });
}

export async function fetchUsageStats(): Promise<UsageStats> {
  const sb = getSupabaseBrowserClient();
  const { data: listings } = await sb.from('listings').select('platform, created_at, suggested_price, status').order('created_at', { ascending: false });
  const all = (listings ?? []) as Array<{ platform: string | null; created_at: string; suggested_price: number | null; status: string }>;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = all.filter((l) => new Date(l.created_at) >= monthStart);
  const estimatedValue = all.filter((l) => l.status === 'ready').reduce((s, l) => s + Number(l.suggested_price ?? 0), 0);
  const timeSavedMinutes = all.length * 3;
  const platformCounts = all.reduce<Record<string, number>>((acc, l) => {
    if (l.platform) acc[l.platform] = (acc[l.platform] ?? 0) + 1;
    return acc;
  }, {});
  const platformBreakdown = (Object.entries(platformCounts) as [Platform, number][])
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = days.map((day) => ({ day, listings: 0 }));
  all.forEach((l) => {
    const d = new Date(l.created_at);
    const dayIdx = (d.getDay() + 6) % 7;
    if (Math.floor((now.getTime() - d.getTime()) / 86400000) < 7) weeklyData[dayIdx].listings += 1;
  });
  return {
    totalListings: all.length,
    listingsThisMonth: thisMonth.length,
    estimatedValue,
    timeSavedMinutes,
    topPlatform: platformBreakdown[0]?.platform ?? null,
    weeklyData,
    platformBreakdown,
  };
}

export async function fetchListingCount(): Promise<number> {
  const sb = getSupabaseBrowserClient();
  const { count } = await sb.from('listings').select('id', { count: 'exact', head: true });
  return count ?? 0;
}
