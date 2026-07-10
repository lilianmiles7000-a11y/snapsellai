import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { edgeFunctionUrl, SUPABASE_ANON_KEY, isOpenAIConfigured } from "@/lib/env";
import type { VisionAnalysisResult } from "@/types/ai";
import type { Platform } from "@/types";

export class AIUnavailableError extends Error {
  constructor(message = "AI analysis is not available. Please check your configuration.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

export async function analyzeImages(
  imageUrls: string[],
  platform: Platform
): Promise<VisionAnalysisResult> {
  if (!isOpenAIConfigured()) {
    throw new AIUnavailableError();
  }

  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();

  const res = await fetch(edgeFunctionUrl("analyze-listing"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image_urls: imageUrls, platform }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `AI analysis failed (${res.status})`
    );
  }

  const data = await res.json();
  return data as VisionAnalysisResult;
}
