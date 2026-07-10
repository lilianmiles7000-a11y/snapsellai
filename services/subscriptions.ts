import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Subscription } from '@/types';

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
  return data as Subscription ?? null;
}

export async function createCheckoutSession(priceId: string): Promise<{ url: string | null; error: string | null }> {
  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { url: null, error: 'Not authenticated' };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ price_id: priceId, success_url: `${window.location.origin}/dashboard?upgraded=1`, cancel_url: `${window.location.origin}/pricing` }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { url: data.url ?? null, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function openBillingPortal(): Promise<{ url: string | null; error: string | null }> {
  const sb = getSupabaseBrowserClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return { url: null, error: 'Not authenticated' };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/billing-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ return_url: `${window.location.origin}/settings?tab=billing` }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { url: data.url ?? null, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
