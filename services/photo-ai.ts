import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { EnhancementAction } from '@/types';

const EDGE_ENHANCE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/photo-enhance`;

export interface EnhanceResult {
  enhanced_url: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

export async function enhanceImage(imageUrl: string, action: EnhancementAction): Promise<EnhanceResult> {
  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();

  const res = await fetch(EDGE_ENHANCE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image_url: imageUrl, action }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Enhancement failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.enhanced_url) throw new Error('No enhanced URL returned');
  return data;
}

export const ENHANCEMENT_ACTIONS = [
  { action: 'enhance_colors' as const,         label: 'Enhance Colors',          desc: 'Boost vibrancy and color accuracy',     icon: 'Palette',  group: 'adjust' as const },
  { action: 'improve_brightness' as const,     label: 'Improve Brightness',      desc: 'Auto-correct exposure and lighting',    icon: 'Sun',      group: 'adjust' as const },
  { action: 'sharpen' as const,                label: 'Sharpen Image',           desc: 'Increase detail and edge clarity',      icon: 'Focus',    group: 'adjust' as const },
  { action: 'reduce_noise' as const,           label: 'Reduce Noise',            desc: 'Remove grain and digital artifacts',    icon: 'Sparkles', group: 'adjust' as const },
  { action: 'auto_crop' as const,              label: 'Auto Crop',               desc: 'Smart crop to focus on product',        icon: 'Crop',     group: 'transform' as const },
  { action: 'remove_background' as const,      label: 'Remove Background',       desc: 'Cut out the subject from the scene',    icon: 'Eraser',   group: 'background' as const },
  { action: 'white_background' as const,       label: 'White Background',        desc: 'Clean white studio background',         icon: 'Square',   group: 'background' as const },
  { action: 'marketplace_background' as const, label: 'Marketplace Background',  desc: 'Neutral gradient for marketplaces',     icon: 'Store',    group: 'background' as const },
  { action: 'transparent_background' as const, label: 'Transparent Background',  desc: 'PNG with transparent background',       icon: 'Layers',   group: 'background' as const },
] as const;
