'use client';

import { cn } from '@/lib/utils';
import type { EnhancementAction } from '@/types';
import { ENHANCEMENT_ACTIONS } from '@/services/photo-ai';
import { RotateCcw, Clock } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action: EnhancementAction;
  url: string;
  timestamp: Date;
}

interface PhotoHistoryProps {
  history: HistoryEntry[];
  currentIndex: number;
  onJump: (index: number) => void;
  className?: string;
}

export function PhotoHistory({ history, currentIndex, onJump, className }: PhotoHistoryProps) {
  if (history.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <Clock className="h-6 w-6 text-muted-foreground/40" />
        <p className="mt-2 text-xs text-muted-foreground">No edits yet</p>
        <p className="text-[10px] text-muted-foreground/60">Apply an action to start editing</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Original step */}
      <button
        onClick={() => onJump(-1)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
          currentIndex === -1 ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
          <RotateCcw className="h-3 w-3" />
        </div>
        <span className="text-xs font-medium">Original</span>
      </button>

      {history.map((entry, i) => {
        const meta = ENHANCEMENT_ACTIONS.find((a) => a.action === entry.action);
        const isActive = i === currentIndex;
        return (
          <button
            key={entry.id}
            onClick={() => onJump(i)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
              isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.url} alt="" className="h-6 w-6 rounded-sm object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-xs font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                {meta?.label ?? entry.action}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
