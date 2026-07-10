'use client';

import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import { PLATFORMS } from '@/lib/constants';

export function PlatformBadge({ platform }: { platform: Platform }) {
  const info = PLATFORMS.find((p) => p.id === platform);
  if (!info) return <span className="text-xs text-muted-foreground">{platform}</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: info.color }}
      />
      {info.label}
    </span>
  );
}
