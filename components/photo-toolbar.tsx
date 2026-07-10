'use client';

import { cn } from '@/lib/utils';
import { Undo2, Redo2, RotateCcw, Download, RefreshCw, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasEnhanced: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDownload: () => void;
  onReplaceOriginal: () => void;
  onContinue: () => void;
  saving?: boolean;
}

export function PhotoToolbar({
  canUndo,
  canRedo,
  hasEnhanced,
  onUndo,
  onRedo,
  onReset,
  onDownload,
  onReplaceOriginal,
  onContinue,
  saving,
}: PhotoToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 backdrop-blur-sm">
      {/* History controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            canUndo ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'
          )}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            canRedo ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'
          )}
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <div className="mx-1.5 h-5 w-px bg-border" />
        <button
          onClick={onReset}
          title="Reset to original"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Center label */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        AI Photo Studio
      </div>

      {/* Save / download */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDownload}
          disabled={!hasEnhanced}
          title="Download enhanced"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            hasEnhanced ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'
          )}
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          onClick={onReplaceOriginal}
          disabled={!hasEnhanced}
          title="Replace original with enhanced"
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all',
            hasEnhanced
              ? 'hover:bg-accent text-foreground'
              : 'text-muted-foreground/40 cursor-not-allowed'
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Replace
        </button>
        <Button
          size="sm"
          onClick={onContinue}
          disabled={saving}
          className="h-8 bg-gradient-primary text-xs"
        >
          {saving ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Use photos
        </Button>
      </div>
    </div>
  );
}
