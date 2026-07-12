/**
 * lib/env.ts — Centralized environment configuration.
 *
 * All environment-variable access in the application goes through this module.
 * Components and services MUST NOT read process.env directly.
 */

// ─── Core — always required ───────────────────────────────────────────────────

export const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Optional — Stripe ────────────────────────────────────────────────────────

export const STRIPE_PUBLISHABLE_KEY: string =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const STRIPE_PRO_PRICE_ID: string =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";

// ─── App URL ──────────────────────────────────────────────────────────────────

export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Capability checks ────────────────────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isOpenAIConfigured(): boolean {
  return isSupabaseConfigured();
}

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PRO_PRICE_ID);
}

export function isPhotoEnhancementAvailable(): boolean {
  return isSupabaseConfigured();
}

export function isCloudinaryConfigured(): boolean {
  return isSupabaseConfigured();
}

export function isRemoveBgConfigured(): boolean {
  return isSupabaseConfigured();
}

export function isReplicateConfigured(): boolean {
  return isSupabaseConfigured();
}

export function isFalConfigured(): boolean {
  return isSupabaseConfigured();
}

// ─── Edge-function URL helper ─────────────────────────────────────────────────

export function edgeFunctionUrl(slug: string): string {
  return `${SUPABASE_URL}/functions/v1/${slug}`;
}

// ─── Development warnings ─────────────────────────────────────────────────────

function warnDev(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[SnapSell env] ${message}`);
  }
}

if (!SUPABASE_URL) warnDev("NEXT_PUBLIC_SUPABASE_URL is not set.");
if (!SUPABASE_ANON_KEY) warnDev("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
if (!STRIPE_PRO_PRICE_ID) warnDev("NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is not set — Stripe billing disabled.");
