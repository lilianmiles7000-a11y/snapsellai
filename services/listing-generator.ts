import type { VisionAnalysisResult, GeneratedListing } from '@/types/ai';
import type { Platform } from '@/types';

/**
 * Listing generator.
 *
 * Takes the raw VisionAnalysisResult from the AI and transforms it into a
 * complete GeneratedListing with platform-tuned copy, price tiers, keywords
 * and tags. All transformations are pure — no API calls.
 *
 * If the AI returned "Unknown" for any field, the generator handles it
 * gracefully without crashing.
 */

/**
 * Generates a platform-tuned listing from the AI analysis result.
 */
export function generateListing(
  analysis: VisionAnalysisResult,
  platform: Platform
): GeneratedListing {
  const title = analysis.title || buildFallbackTitle(analysis);
  const description = analysis.description || buildFallbackDescription(analysis, platform);
  const prices = computePriceTiers(analysis.suggested_price);

  const keywords = buildKeywords(analysis, platform);
  const tags = buildTags(analysis);

  return {
    title,
    description,
    brand: analysis.brand,
    category: analysis.category,
    subcategory: analysis.subcategory,
    condition: analysis.condition,
    colors: analysis.colors,
    materials: analysis.materials,
    size: analysis.estimated_size,
    gender: analysis.gender,
    suggested_price: prices.suggested,
    quick_sale_price: prices.quickSale,
    premium_price: prices.premium,
    keywords,
    tags,
    confidence: analysis.confidence,
  };
}

/**
 * Generates just the title from analysis + platform.
 */
export function generateTitle(
  analysis: VisionAnalysisResult,
  _platform: Platform
): string {
  return analysis.title || buildFallbackTitle(analysis);
}

/**
 * Generates just the description from analysis + platform.
 */
export function generateDescription(
  analysis: VisionAnalysisResult,
  platform: Platform
): string {
  return analysis.description || buildFallbackDescription(analysis, platform);
}

/**
 * Estimates three price tiers from the AI's suggested price.
 */
export function estimatePrice(
  analysis: VisionAnalysisResult
): { quick_sale_price: number; suggested_price: number; premium_price: number } {
  const tiers = computePriceTiers(analysis.suggested_price);
  return {
    quick_sale_price: tiers.quickSale,
    suggested_price: tiers.suggested,
    premium_price: tiers.premium,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildFallbackTitle(a: VisionAnalysisResult): string {
  const parts: string[] = [];
  if (a.brand && a.brand !== 'Unknown') parts.push(a.brand);
  if (a.category && a.category !== 'Unknown') parts.push(a.category);
  if (a.colors.length > 0) parts.push(a.colors.join(' / '));
  if (a.estimated_size && a.estimated_size !== 'Unknown') parts.push(`Size ${a.estimated_size}`);
  return parts.length > 0 ? parts.join(' — ') : 'Untitled listing';
}

function buildFallbackDescription(a: VisionAnalysisResult, platform: Platform): string {
  const lines: string[] = [];
  const brandPart = a.brand && a.brand !== 'Unknown' ? a.brand + ' ' : '';
  const conditionPart = a.condition && a.condition !== 'Unknown' ? a.condition.toLowerCase() : 'good';
  lines.push(`${brandPart}${a.category !== 'Unknown' ? a.category.toLowerCase() : 'item'} in ${conditionPart} condition.`);
  if (a.estimated_size && a.estimated_size !== 'Unknown') lines.push(`Size: ${a.estimated_size}.`);
  if (a.colors.length > 0) lines.push(`Color${a.colors.length > 1 ? 's' : ''}: ${a.colors.join(', ')}.`);
  if (a.materials.length > 0) lines.push(`Material${a.materials.length > 1 ? 's' : ''}: ${a.materials.join(', ')}.`);
  lines.push('');
  lines.push(platformTone(platform));
  return lines.join('\n');
}

function platformTone(platform: Platform): string {
  switch (platform) {
    case 'vinted':
      return "Very good condition. Fast and careful shipping. Feel free to ask any questions!";
    case 'leboncoin':
      return 'Bonjour, je vends cet article en très bon état. Disponible rapidement. Contact par message.';
    case 'facebook_marketplace':
      return 'Great condition, barely used. Pickup available or can ship. Message me with any questions!';
    case 'ebay':
      return 'Excellent condition. Item has been well cared for and comes from a smoke-free home. Fast shipping.';
  }
}

function computePriceTiers(base: number): { quickSale: number; suggested: number; premium: number } {
  const safe = Math.max(0, base || 0);
  return {
    quickSale: Math.round(safe * 0.8 * 100) / 100,
    suggested: Math.round(safe * 100) / 100,
    premium: Math.round(safe * 1.25 * 100) / 100,
  };
}

function buildKeywords(a: VisionAnalysisResult, platform: Platform): string[] {
  const kw: string[] = [];
  if (a.brand && a.brand !== 'Unknown') kw.push(a.brand.toLowerCase());
  if (a.category && a.category !== 'Unknown') kw.push(a.category.toLowerCase());
  if (a.subcategory && a.subcategory !== 'Unknown') kw.push(a.subcategory.toLowerCase());
  a.colors.forEach((c) => kw.push(c.toLowerCase()));
  a.materials.forEach((m) => kw.push(m.toLowerCase()));
  if (a.estimated_size && a.estimated_size !== 'Unknown') kw.push(`size ${a.estimated_size.toLowerCase()}`);
  kw.push('used', 'second hand', platform);
  // Merge with AI-provided keywords, deduplicate
  a.keywords.forEach((k) => {
    if (!kw.includes(k.toLowerCase())) kw.push(k.toLowerCase());
  });
  return Array.from(new Set(kw));
}

function buildTags(a: VisionAnalysisResult): string[] {
  const tags: string[] = [];
  if (a.category && a.category !== 'Unknown') tags.push(a.category.toLowerCase());
  if (a.condition && a.condition !== 'Unknown') tags.push(a.condition.toLowerCase().replace(/\s+/g, '-'));
  if (a.brand && a.brand !== 'Unknown') tags.push(a.brand.toLowerCase());
  if (a.gender && a.gender !== 'Unknown') tags.push(a.gender.toLowerCase());
  a.colors.forEach((c) => tags.push(c.toLowerCase()));
  return Array.from(new Set(tags));
}
