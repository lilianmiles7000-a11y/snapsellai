import type { VisionAnalysisResult, AnalyzeImagesInput } from '@/types/ai';

/**
 * OpenAI Vision API client.
 *
 * This module NEVER exposes the OpenAI API key to the browser. It calls the
 * `analyze-listing` Supabase Edge Function, which holds OPENAI_API_KEY in its
 * server-side environment and proxies the request to OpenAI.
 *
 * The edge function returns sanitized structured JSON — never plain text.
 * If the key is missing or OpenAI fails, the edge function returns an error
 * object with a descriptive message.
 */

const EDGE_FUNCTION_PATH = '/functions/v1/analyze-listing';

export interface OpenAIError {
  error: string;
  details?: string;
}

function getEdgeUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return `${url}${EDGE_FUNCTION_PATH}`;
}

function getAuthHeader(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return `Bearer ${key}`;
}

/**
 * Calls the edge function with image URLs and receives structured analysis.
 * Throws on network errors or non-2xx responses with a human-readable message.
 */
export async function callVisionAPI(
  input: AnalyzeImagesInput
): Promise<VisionAnalysisResult> {
  const res = await fetch(getEdgeUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      image_urls: input.imageUrls,
      platform: input.platform,
      language: input.language ?? 'en',
    }),
  });

  if (!res.ok) {
    let message = `Analysis failed (${res.status})`;
    try {
      const body: OpenAIError = await res.json();
      if (body.error) message = body.error;
    } catch {
      // response body wasn't JSON — keep the status-based message
    }
    throw new Error(message);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data as VisionAnalysisResult;
}
