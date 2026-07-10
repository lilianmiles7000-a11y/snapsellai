import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { VisionAnalysisResult } from '@/types/ai';
import type { Platform } from '@/types';

const EDGE_ANALYZE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-listing`;

export async function analyzeImages(imageUrls: string[], platform: Platform): Promise<VisionAnalysisResult> {
  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();

  const res = await fetch(EDGE_ANALYZE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image_urls: imageUrls, platform }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `AI analysis failed (${res.status})`);
  }

  const data = await res.json();
  return data as VisionAnalysisResult;
}
