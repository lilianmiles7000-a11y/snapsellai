'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, TrendingUp, Wallet, Clock, Zap, ArrowRight, ImageIcon, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stat-card';
import { UsageChart } from '@/components/usage-chart';
import { ListingCard } from '@/components/listing-card';
import { PlatformBadge } from '@/components/platform-badge';
import { useAuth } from '@/contexts/auth-context';
import { fetchUsageStats, fetchRecentListings, deleteListing } from '@/services/listings';
import { fetchRecentEnhancements } from '@/services/enhancements';
import type { Listing, UsageStats, Platform, PhotoEnhancement } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ENHANCEMENT_ACTIONS } from '@/services/photo-ai';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [enhancements, setEnhancements] = useState<PhotoEnhancement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, l, e] = await Promise.all([
        fetchUsageStats(),
        fetchRecentListings(6),
        fetchRecentEnhancements(6),
      ]);
      setStats(s);
      setListings(l);
      setEnhancements(e);
      setLoading(false);
    })();
  }, []);

  const onDelete = async (id: string) => {
    const ok = await deleteListing(id);
    if (ok) { setListings((p) => p.filter((l) => l.id !== id)); toast.success('Deleted'); }
    else toast.error('Could not delete');
  };

  const creditsPct = profile ? Math.round((profile.credits_remaining / profile.credits_total) * 100) : 0;
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Here's what's happening with your listings.</p>
        </div>
        <Link href="/new-listing">
          <Button variant="gradient">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total listings" value={stats?.totalListings ?? '—'} icon={Package} accent="primary" loading={loading} trend={stats && stats.listingsThisMonth > 0 ? { value: `+${stats.listingsThisMonth} this month`, direction: 'up' } : undefined} />
        <StatCard label="This month" value={stats?.listingsThisMonth ?? '—'} icon={TrendingUp} accent="success" loading={loading} />
        <StatCard label="Est. inventory value" value={stats ? formatPrice(stats.estimatedValue) : '—'} icon={Wallet} accent="warning" loading={loading} />
        <StatCard label="Time saved" value={stats ? `${stats.timeSavedMinutes}m` : '—'} icon={Clock} accent="neutral" loading={loading} />
      </div>

      {/* Credits */}
      {profile && (
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Credit usage</p>
                <p className="text-xs text-muted-foreground">{profile.credits_remaining} of {profile.credits_total} remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden w-40 sm:block">
                <Progress value={creditsPct} />
              </div>
              {profile.plan === 'free' && (
                <Link href="/pricing">
                  <Button size="sm" variant="outline">
                    Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Listings this week</h2>
              <p className="text-xs text-muted-foreground">Daily AI generation</p>
            </div>
            <Link href="/history" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <UsageChart data={stats?.weeklyData ?? []} />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">Top platforms</h2>
          <p className="text-xs text-muted-foreground mb-4">Where you publish most</p>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-8" />)}</div>
          ) : (stats?.platformBreakdown ?? []).length > 0 ? (
            <div className="space-y-3">
              {stats!.platformBreakdown.slice(0, 4).map((p) => {
                const max = stats!.platformBreakdown[0].count || 1;
                return (
                  <div key={p.platform} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <PlatformBadge platform={p.platform as Platform} />
                      <span className="text-xs text-muted-foreground">{p.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ImageIcon className="h-7 w-7 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">No data yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent AI Enhancements */}
      {(enhancements.length > 0 || loading) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent AI Enhancements</h2>
            </div>
            <Link href="/new-listing" className="text-xs text-primary hover:underline">New photo studio</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">{[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
              {enhancements.map((e) => {
                const meta = ENHANCEMENT_ACTIONS.find((a) => a.action === e.action);
                return (
                  <Card key={e.id} className="overflow-hidden p-0">
                    <div className="grid grid-cols-2">
                      <div className="aspect-square overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.original_url} alt="" className="h-full w-full object-cover opacity-70" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-center text-[8px] text-white py-0.5">Before</div>
                      </div>
                      <div className="aspect-square overflow-hidden relative">
                        {e.enhanced_url
                          ? <img src={e.enhanced_url} alt="" className="h-full w-full object-cover" />
                          : <div className="h-full w-full bg-muted animate-pulse" />}
                        <div className="absolute inset-x-0 bottom-0 bg-primary/70 text-center text-[8px] text-white py-0.5">After</div>
                      </div>
                    </div>
                    <p className="truncate px-1.5 py-1 text-[9px] text-muted-foreground">{meta?.label ?? e.action.replace(/_/g, ' ')}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent listings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent listings</h2>
          <Link href="/history" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} onDelete={onDelete} />)}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="text-base font-medium text-foreground">No listings yet</h3>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">Upload your first product photo and let AI create a listing in seconds.</p>
            <Link href="/new-listing" className="mt-5">
              <Button variant="gradient"><Plus className="h-4 w-4" />Create your first listing</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
