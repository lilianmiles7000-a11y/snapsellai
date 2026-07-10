'use client';

import { cn } from '@/lib/utils';
import type { EnhancementAction } from '@/types';
import { ENHANCEMENT_ACTIONS } from '@/services/photo-ai';
import {
  Palette, Sun, Focus, Sparkles, Crop, Eraser, Square, Store, Layers, Loader2, Check,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Sun, Focus, Sparkles, Crop, Eraser, Square, Store, Layers,
};

interface PhotoActionsProps {
  onApply: (action: EnhancementAction) => void;
  loadingAction: EnhancementAction | null;
  appliedActions: EnhancementAction[];
  disabled?: boolean;
}

const GROUPS = [
  { key: 'adjust',     label: 'Adjustments' },
  { key: 'background', label: 'Background'  },
  { key: 'transform',  label: 'Transform'   },
] as const;

export function PhotoActions({ onApply, loadingAction, appliedActions, disabled }: PhotoActionsProps) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const actions = ENHANCEMENT_ACTIONS.filter((a) => a.group === group.key);
        return (
          <div key={group.key}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {actions.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Sparkles;
                const isLoading = loadingAction === item.action;
                const isDone = appliedActions.includes(item.action);
                return (
                  <button
                    key={item.action}
                    onClick={() => onApply(item.action)}
                    disabled={disabled || isLoading}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                      'hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]',
                      isDone && 'border-success/30 bg-success/5',
                      (disabled || isLoading) && 'pointer-events-none opacity-60',
                      !isDone && !isLoading && 'border-border bg-card/40'
                    )}
                  >
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      isDone ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                    )}>
                      {isLoading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : isDone
                          ? <Check className="h-3.5 w-3.5" />
                          : <Icon className="h-3.5 w-3.5" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
