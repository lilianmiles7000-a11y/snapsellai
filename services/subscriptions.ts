import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  edgeFunctionUrl,
  isStripeConfigured,
  APP_URL,
} from "@/lib/env";
import type { Subscription } from "@/types";

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Subscription) ?? null;
}

export async function createCheckoutSession(
  priceId: string
): Promise<{ url: string | null; error: string | null }> {
  if (!isStripeConfigured()) {
    return { url: null, error: "Stripe is not configured for this project." };
  }

  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { url: null, error: "Not authenticated" };

  try {
    const res = await fetch(edgeFunctionUrl("create-checkout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${APP_URL}/dashboard?upgraded=1`,
        cancel_url: `${APP_URL}/pricing`,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    return { url: data.url ?? null, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function openBillingPortal(): Promise<{
  url: string | null;
  error: string | null;
}> {
  if (!isStripeConfigured()) {
    return { url: null, error: "Stripe is not configured for this project." };
  }

  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { url: null, error: "Not authenticated" };

  try {
    const res = await fetch(edgeFunctionUrl("billing-portal"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        return_url: `${APP_URL}/settings?tab=billing`,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    return { url: data.url ?? null, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
