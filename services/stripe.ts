import type { Plan } from '@/types';

/**
 * Stripe billing integration layer.
 *
 * In production, a Supabase Edge Function (`stripe-create-checkout`) creates a
 * Stripe Checkout Session and returns its URL. The client redirects there.
 * A Stripe webhook edge function (`stripe-webhook`) updates the `subscriptions`
 * table on checkout.session.completed / customer.subscription.updated / deleted.
 *
 * Until those edge functions are deployed, `createCheckoutSession` returns
 * a no-op so the pricing page can show the intended flow.
 */

const CHECKOUT_EDGE_FUNCTION = 'stripe-create-checkout';
const PORTAL_EDGE_FUNCTION = 'stripe-customer-portal';

export async function createCheckoutSession(plan: Plan): Promise<{ url: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${supabaseUrl}/functions/v1/${CHECKOUT_EDGE_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) return { url: null };
  const data = await res.json();
  return { url: data.url ?? null };
}

export async function openCustomerPortal(): Promise<{ url: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${supabaseUrl}/functions/v1/${PORTAL_EDGE_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
  });
  if (!res.ok) return { url: null };
  const data = await res.json();
  return { url: data.url ?? null };
}
