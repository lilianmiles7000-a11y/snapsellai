'use client';

import Link from 'next/link';
import { Check, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { createCheckoutSession } from '@/services/subscriptions';
import { PRICING_PLANS } from '@/lib/constants';
import { isStripeConfigured } from '@/lib/env';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const stripeReady = isStripeConfigured();

  const onSubscribe = async (priceId: string | null, planId: string) => {
    if (!user) { window.location.href = '/signup'; return; }
    if (!stripeReady || !priceId) {
      toast.error('Billing is not configured for this project yet. Contact support.');
      return;
    }
    setLoading(planId);
    const { url, error } = await createCheckoutSession(priceId);
    setLoading(null);
    if (error || !url) toast.error(error ?? 'Could not start checkout');
    else window.location.href = url;
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pricing</h1>
        <p className="text-sm text-muted-foreground">Choose the plan that's right for you.</p>
      </div>

      {/* Stripe not configured warning — only shown when billing is absent */}
      {!stripeReady && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Billing not configured</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stripe is not set up for this project. The Free plan is fully functional.
              To enable Pro subscriptions, configure{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_STRIPE_PRO_PRICE_ID</code>
              {' '}and the Stripe edge function secrets.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn('relative p-6', plan.highlight && 'border-primary/40 bg-primary/3')}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-white px-3">{plan.badge}</Badge>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                {isCurrent && <Badge variant="success" className="shrink-0">Current</Badge>}
              </div>

              <div className="mt-4 flex items-end gap-1">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">€{plan.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">/month</span>
                  </>
                )}
              </div>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className={cn('h-4 w-4 shrink-0', plan.highlight ? 'text-primary' : 'text-success')} />
                    <span className={plan.highlight ? 'text-foreground' : 'text-muted-foreground'}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current plan</Button>
                ) : plan.price === 0 ? (
                  user ? (
                    <Button variant="outline" className="w-full" disabled>Free plan</Button>
                  ) : (
                    <Link href="/signup">
                      <Button variant="outline" className="w-full">Get started free</Button>
                    </Link>
                  )
                ) : (
                  <Button
                    variant={stripeReady ? 'gradient' : 'outline'}
                    className="w-full"
                    disabled={loading === plan.id || !stripeReady}
                    onClick={() => onSubscribe(plan.priceId, plan.id)}
                  >
                    {loading === plan.id
                      ? 'Loading…'
                      : stripeReady
                        ? `Upgrade to Pro — €${plan.price}/month`
                        : 'Billing not configured'}
                    {stripeReady && <ArrowRight className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Questions?</p>
            <p className="text-xs text-muted-foreground">
              Email{' '}
              <a href="mailto:support@snapsell.ai" className="text-primary hover:underline">
                support@snapsell.ai
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
