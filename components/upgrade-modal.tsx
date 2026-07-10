'use client';

import { useState } from 'react';
import { Zap, ArrowRight, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/services/subscriptions';
import { isStripeConfigured, STRIPE_PRO_PRICE_ID } from '@/lib/env';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const PRO_FEATURES = [
  'Unlimited listings per month',
  'Unlimited AI analysis',
  'HD photo enhancement',
  'Background removal',
  'Priority processing',
  'Unlimited history',
  'All future features',
];

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const stripeReady = isStripeConfigured();

  const onUpgrade = async () => {
    if (!stripeReady || !STRIPE_PRO_PRICE_ID) {
      toast.error('Billing is not yet configured. Contact support.');
      return;
    }
    setLoading(true);
    const { url, error } = await createCheckoutSession(STRIPE_PRO_PRICE_ID);
    setLoading(false);
    if (error || !url) {
      toast.error(error ?? 'Could not start checkout');
    } else {
      window.location.href = url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary mb-3">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            {reason ?? "You've reached your free plan limit."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-foreground">Pro Plan</p>
              <p className="text-sm text-muted-foreground">Everything you need to sell at scale</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">€19</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {stripeReady ? (
            <Button onClick={onUpgrade} disabled={loading} variant="gradient" size="lg" className="w-full">
              {loading ? 'Loading…' : 'Upgrade to Pro — €19/month'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Billing is not configured for this project yet.
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
