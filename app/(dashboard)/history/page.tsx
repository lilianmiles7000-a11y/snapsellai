'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListingCard } from '@/components/listing-card';
import { fetchAllListings, deleteListing } from '@/services/listings';
import type { Listing, Platform } from '@/types';
import { PLATFORMS } from '@/lib/constants';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'ready' | 'draft' | 'generating';

export default function HistoryPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');

  useEffect(() => {
    fetchAllListings().then((d) => { setListings(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() =>
    listings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (platformFilter !== 'all' && l.platform !== platformFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return l.title?.toLowerCase().includes(q) || l.brand?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q);
      }
      return true;
    }),
  [listings, query, statusFilter, platformFilter]);

  const onDelete = async (id: string) => {
    const ok = await deleteListing(id);
    if (ok) { setListings((p) => p.filter((l) => l.id !== id)); toast.success('Listing deleted'); }
    else toast.error('Could not delete');
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">History</h1>
          <p className="text-sm text-muted-foreground">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/new-listing">
          <Button variant="gradient" size="sm"><Plus className="h-4 w-4" />New Listing</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings…" className="pl-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Platform chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Platform:</span>
        {(['all', ...PLATFORMS.map((p) => p.id)] as (Platform | 'all')[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${platformFilter === p ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {p === 'all' ? 'All' : PLATFORMS.find((pl) => pl.id === p)?.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((l) => <ListingCard key={l.id} listing={l} onDelete={onDelete} />)}
        </div>
      ) : listings.length > 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-medium">No listings match your filters</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-medium">No listings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">Your AI-generated listings will appear here.</p>
          <Link href="/new-listing" className="mt-5">
            <Button variant="gradient"><Plus className="h-4 w-4" />Create a listing</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
