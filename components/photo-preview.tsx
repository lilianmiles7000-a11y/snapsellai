'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PhotoPreviewProps {
  url: string;
  isSelected?: boolean;
  isProcessing?: boolean;
  hasEnhancement?: boolean;
  hasFailed?: boolean;
  index: number;
  onSelect: () => void;
}

export function PhotoPreview({
  url,
  isSelected,
  isProcessing,
  hasEnhancement,
  hasFailed,
  index,
  onSelect,
}: PhotoPreviewProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all duration-150',
        isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-border-strong',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />

      {/* Index badge */}
      <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-[10px] font-bold text-white backdrop-blur-sm">
        {index + 1}
      </div>

      {/* Status overlays */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      )}
      {hasEnhancement && !isProcessing && (
        <div className="absolute right-1.5 top-1.5">
          <CheckCircle2 className="h-4 w-4 text-success drop-shadow" />
        </div>
      )}
      {hasFailed && !isProcessing && (
        <div className="absolute right-1.5 top-1.5">
          <XCircle className="h-4 w-4 text-destructive drop-shadow" />
        </div>
      )}
    </button>
  );
}
