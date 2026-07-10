'use client';

import { cn } from '@/lib/utils';
import type { Listing } from '@/types';
import { PlatformBadge } from './platform-badge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash2, Copy, Tag, Calendar } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ListingCardProps {
  listing: Listing;
  onDelete?: (id: string) => void;
  onDuplicate?: (listing: Listing) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  ready: { label: 'Ready', variant: 'success' },
  generating: { label: 'Generating…', variant: 'warning' },
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'secondary' },
};

export function ListingCard({ listing, onDelete, onDuplicate }: ListingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cover = listing.images[0]?.url;
  const status = STATUS_BADGE[listing.status] ?? { label: listing.status, variant: 'secondary' };

  return (
    <Card className={cn('group overflow-hidden transition-all duration-150 hover:border-border-strong/60', menuOpen && 'border-border-strong/60')}>
      {/* Cover */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
        </div>
        {listing.platform && (
          <div className="absolute bottom-2 left-2">
            <div className="rounded-md bg-black/60 px-2 py-0.5 backdrop-blur-sm">
              <PlatformBadge platform={listing.platform} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-foreground">
              {listing.title ?? 'Untitled listing'}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {listing.brand ?? listing.category ?? '—'}
            </p>
          </div>
          {listing.suggested_price && (
            <span className="shrink-0 text-sm font-semibold text-foreground">
              {formatPrice(listing.suggested_price)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(listing.created_at)}
          </div>

          {(onDelete || onDuplicate) && (
            <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus:opacity-100">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-36 rounded-lg border border-border bg-popover p-1 shadow-lg"
                  align="end"
                  sideOffset={4}
                >
                  {onDuplicate && (
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent outline-none"
                      onSelect={() => onDuplicate(listing)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </DropdownMenu.Item>
                  )}
                  {onDelete && (
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 outline-none"
                      onSelect={() => onDelete(listing.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </Card>
  );
}
