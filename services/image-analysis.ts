import { callVisionAPI } from '@/services/openai';
import type { VisionAnalysisResult, AnalyzeImagesInput } from '@/types/ai';

/**
 * Image analysis pipeline.
 *
 * Sends image URLs to the OpenAI Vision API (via edge function) and returns
 * the structured analysis. If the AI cannot detect a field, the edge function
 * returns "Unknown" — this module never crashes on missing data.
 *
 * In production, images are already uploaded to Supabase Storage and the
 * public URLs are passed here. The edge function fetches them server-side.
 */

export { callVisionAPI };

/**
 * Analyzes uploaded product images and returns structured detection results.
 */
export async function analyzeImages(
  input: AnalyzeImagesInput
): Promise<VisionAnalysisResult> {
  return callVisionAPI(input);
}

/**
 * Extracts only the detection fields (no generated text) from the full result.
 * Used when the caller wants raw detection data separately from generated copy.
 */
export function extractDetection(result: VisionAnalysisResult) {
  return {
    brand: result.brand,
    category: result.category,
    subcategory: result.subcategory,
    condition: result.condition,
    colors: result.colors,
    materials: result.materials,
    size: result.estimated_size,
    gender: result.gender,
    confidence: result.confidence,
  };
}
