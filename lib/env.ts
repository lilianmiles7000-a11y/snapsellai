/**
 * lib/env.ts — Centralized environment configuration.
 *
 * All environment-variable access in the application goes through this module.
 * Components and services MUST NOT read process.env directly — they must call
 * the helpers exported here.
 *
 * Rules:
 *  - NEXT_PUBLIC_* vars are safe to expose to the browser (they are bundled
 *    by Next.js into the client build).
 *  - Secret keys (service role, Stripe secret, OpenAI key) live ONLY in
 *    edge functions / server code — they are never sent to the browser.
 *  - If a required var is missing on the client, we return a safe default and
 *    log a warning in development. We never throw during module initialisation.
 */

// ─── Core — always required ───────────────────────────────────────────────────

export const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Optional — Stripe (billing) ─────────────────────────────────────────────

/**
 * The Stripe publishable key is safe for the browser. It is used only to
 * redirect to Stripe-hosted Checkout / Portal via a server-issued URL.
 * The secret key lives exclusively in the `create-checkout` edge function.
 */
export const STRIPE_PUBLISHABLE_KEY: string =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

/**
 * The price ID for the Pro plan, created in the Stripe dashboard.
 * Safe to expose — it is just a lookup key, not a secret.
 */
export const STRIPE_PRO_PRICE_ID: string =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '';

// ─── App URL ──────────────────────────────────────────────────────────────────

export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ─── Capability checks ────────────────────────────────────────────────────────
//
// These functions are the canonical way to ask "is feature X available?"
// before attempting to call a service. They never throw.
//
// Server-side env vars (secret keys) are deliberately NOT checked here —
// those checks live inside the edge functions themselves, where secrets are
// available via Deno.env.

/**
 * Core requirement — Supabase must always be configured for the app to work.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * OpenAI Vision is used for AI listing analysis. The actual API key lives
 * server-side in the `analyze-listing` edge function. On the client we can
 * only check whether the Supabase URL (needed to call the edge function) is
 * available — a true "is OpenAI configured?" check happens at the edge.
 *
 * We return `true` here as a client-side optimistic check, meaning the feature
 * will attempt to call the edge function. If the edge function itself reports
 * that OPENAI_API_KEY is missing it will return a descriptive error and the UI
 * will surface it gracefully.
 */
export function isOpenAIConfigured(): boolean {
  return isSupabaseConfigured();
}

/**
 * Stripe billing is optional. The feature is considered available when the Pro
 * price ID is configured (the publishable key is cosmetic — not required to
 * initiate a redirect-based checkout flow).
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PRO_PRICE_ID);
}

/**
 * Photo enhancement providers are all optional and server-side only.
 * On the client we can only report that the feature *may* be available —
 * the edge function will check each provider key and return an error if
 * the specific provider is not configured.
 *
 * These helpers return `true` as optimistic client-side checks. If a provider
 * key is absent the edge function returns a friendly error that the UI catches.
 *
 * To truly know whether a provider is configured, inspect the edge function
 * secrets in the Supabase dashboard. These client-side helpers exist to allow
 * selective feature disabling when the entire photo-enhance pipeline is known
 * to be unavailable (i.e. when Supabase itself isn't configured).
 */
export function isPhotoEnhancementAvailable(): boolean {
  // As long as we can reach the edge function, enhancement *may* work.
  return isSupabaseConfigured();
}

export function isCloudinaryConfigured(): boolean {
  // Cloudinary secrets are server-side only. We optimistically return true.
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

// ─── Edge-function URL helpers ───────────────────────────────────────────────
//
// All calls to Supabase Edge Functions must use these helpers so the URL is
// assembled in one place. Never construct edge-function URLs ad-hoc.

export function edgeFunctionUrl(slug: string): string {
  return `${SUPABASE_URL}/functions/v1/${slug}`;
}

// ─── Development warnings ─────────────────────────────────────────────────────
//
// Called once at module load in development to surface misconfiguration early.
// In production this is a no-op.

function warnDev(message: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SnapSell env] ${message}`);
  }
}

if (!SUPABASE_URL) warnDev('NEXT_PUBLIC_SUPABASE_URL is not set. Auth and data features will not work.');
if (!SUPABASE_ANON_KEY) warnDev('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Auth and data features will not work.');
if (!STRIPE_PRO_PRICE_ID) warnDev('NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is not set. Stripe billing is disabled.');
