'use client';

import { useState, useCallback, useRef } from 'react';
import { Wand2, ChevronRight, X, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PhotoCompareSlider } from '@/components/photo-compare-slider';
import { PhotoActions } from '@/components/photo-actions';
import { PhotoToolbar } from '@/components/photo-toolbar';
import { PhotoPreview } from '@/components/photo-preview';
import { PhotoHistory } from '@/components/photo-history';
import { enhanceImage } from '@/services/photo-ai';
import { createEnhancement, updateEnhancement } from '@/services/enhancements';
import type { UploadedFile } from '@/components/upload-zone';
import type { EnhancementAction } from '@/types';
import type { Platform } from '@/types';
import { PLATFORM_LIST } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HistoryEntry {
  id: string;
  action: EnhancementAction;
  url: string;
  timestamp: Date;
  enhancementId: string | null;
}

/** Per-photo editor state */
interface PhotoState {
  original: string;
  current: string;
  history: HistoryEntry[];
  historyIndex: number;
  processingAction: EnhancementAction | null;
  failed: boolean;
}

interface PhotoStudioProps {
  files: UploadedFile[];
  listingId: string | null;
  platform: Platform;
  onContinue: (enhancedFiles: UploadedFile[]) => void;
  onSkip: () => void;
}

export function PhotoStudio({ files, listingId, platform, onContinue, onSkip }: PhotoStudioProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [photoStates, setPhotoStates] = useState<PhotoState[]>(() =>
    files.map((f) => ({
      original: f.url,
      current: f.url,
      history: [],
      historyIndex: -1,
      processingAction: null,
      failed: false,
    }))
  );
  const [saving, setSaving] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const selectedPhoto = photoStates[selectedIdx];
  const hasEnhanced = selectedPhoto?.history.length > 0;
  const currentUrl = selectedPhoto?.current ?? '';
  const originalUrl = selectedPhoto?.original ?? '';
  const showCompare = hasEnhanced;

  const setPhotoState = useCallback((idx: number, updater: (prev: PhotoState) => PhotoState) => {
    setPhotoStates((prev) => prev.map((s, i) => (i === idx ? updater(s) : s)));
  }, []);

  const onApply = useCallback(async (action: EnhancementAction) => {
    const idx = selectedIdx;
    const photo = photoStates[idx];
    if (!photo || photo.processingAction) return;

    setPhotoState(idx, (s) => ({ ...s, processingAction: action, failed: false }));

    // Create a DB record (non-blocking UI)
    const record = await createEnhancement({
      original_url: photo.original,
      action,
      listing_id: listingId,
      original_storage_path: null,
    });

    try {
      const result = await enhanceImage({ imageUrl: photo.current, action });
      const enhancedUrl = result.enhanced_url;

      // Update DB record
      if (record) {
        await updateEnhancement(record.id, {
          enhanced_url: enhancedUrl,
          status: 'done',
          provider: result.provider as PhotoState['processingAction'] extends string ? never : never,
        }).catch(() => null);
      }

      setPhotoState(idx, (s) => {
        const newEntry: HistoryEntry = {
          id: `${Date.now()}-${Math.random()}`,
          action,
          url: enhancedUrl,
          timestamp: new Date(),
          enhancementId: record?.id ?? null,
        };
        // Truncate any redo history past current index
        const trimmedHistory = s.history.slice(0, s.historyIndex + 1);
        const newHistory = [...trimmedHistory, newEntry];
        return {
          ...s,
          current: enhancedUrl,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          processingAction: null,
        };
      });

      toast.success(`${action.replace(/_/g, ' ')} applied`);
    } catch (err) {
      if (record) {
        await updateEnhancement(record.id, { status: 'failed' }).catch(() => null);
      }
      setPhotoState(idx, (s) => ({ ...s, processingAction: null, failed: true }));
      toast.error(err instanceof Error ? err.message : 'Enhancement failed');
    }
  }, [selectedIdx, photoStates, listingId, setPhotoState]);

  const onUndo = useCallback(() => {
    const idx = selectedIdx;
    setPhotoState(idx, (s) => {
      if (s.historyIndex <= -1) return s;
      const newIndex = s.historyIndex - 1;
      const newUrl = newIndex === -1 ? s.original : s.history[newIndex].url;
      return { ...s, historyIndex: newIndex, current: newUrl };
    });
  }, [selectedIdx, setPhotoState]);

  const onRedo = useCallback(() => {
    const idx = selectedIdx;
    setPhotoState(idx, (s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      return { ...s, historyIndex: newIndex, current: s.history[newIndex].url };
    });
  }, [selectedIdx, setPhotoState]);

  const onReset = useCallback(() => {
    setPhotoState(selectedIdx, (s) => ({
      ...s,
      current: s.original,
      historyIndex: -1,
    }));
  }, [selectedIdx, setPhotoState]);

  const onDownload = useCallback(() => {
    if (!currentUrl || !downloadRef.current) return;
    downloadRef.current.href = currentUrl;
    downloadRef.current.download = `enhanced-${selectedIdx + 1}.jpg`;
    downloadRef.current.click();
  }, [currentUrl, selectedIdx]);

  const onReplaceOriginal = useCallback(() => {
    setPhotoState(selectedIdx, (s) => ({
      ...s,
      original: s.current,
      history: [],
      historyIndex: -1,
    }));
    toast.success('Original replaced with enhanced version');
  }, [selectedIdx, setPhotoState]);

  const onHistoryJump = useCallback((index: number) => {
    setPhotoState(selectedIdx, (s) => {
      const newUrl = index === -1 ? s.original : s.history[index].url;
      return { ...s, historyIndex: index, current: newUrl };
    });
  }, [selectedIdx, setPhotoState]);

  const onContinueClick = useCallback(async () => {
    setSaving(true);
    const enhanced = files.map((f, i) => {
      const state = photoStates[i];
      if (!state || state.current === state.original) return f;
      return { ...f, url: state.current, enhanced: true } as UploadedFile;
    });
    onContinue(enhanced);
    setSaving(false);
  }, [files, photoStates, onContinue]);

  const appliedActionsForCurrent = selectedPhoto?.history.slice(0, selectedPhoto.historyIndex + 1).map((h) => h.action) ?? [];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Photo Studio</h2>
            <p className="text-xs text-muted-foreground">
              Enhance your photos before generating the listing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
            {PLATFORM_LIST.find((p) => p.id === platform)?.label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground text-xs">
            Skip
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <PhotoToolbar
        canUndo={selectedPhoto?.historyIndex > -1}
        canRedo={selectedPhoto?.historyIndex < (selectedPhoto?.history.length ?? 0) - 1}
        hasEnhanced={hasEnhanced}
        onUndo={onUndo}
        onRedo={onRedo}
        onReset={onReset}
        onDownload={onDownload}
        onReplaceOriginal={onReplaceOriginal}
        onContinue={onContinueClick}
        saving={saving}
      />

      {/* Main content */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_200px]">

        {/* Left: photo strip */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Photos ({files.length})
          </p>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
            {files.map((f, i) => {
              const state = photoStates[i];
              return (
                <PhotoPreview
                  key={f.id}
                  url={state?.current ?? f.url}
                  index={i}
                  isSelected={i === selectedIdx}
                  isProcessing={!!state?.processingAction}
                  hasEnhancement={(state?.history.length ?? 0) > 0}
                  hasFailed={state?.failed}
                  onSelect={() => setSelectedIdx(i)}
                />
              );
            })}
          </div>

          {/* Per-photo history (mobile: hidden, desktop: shown) */}
          <div className="hidden lg:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Edit history
            </p>
            <PhotoHistory
              history={selectedPhoto?.history ?? []}
              currentIndex={selectedPhoto?.historyIndex ?? -1}
              onJump={onHistoryJump}
            />
          </div>
        </div>

        {/* Center: main preview / compare */}
        <Card className="relative flex items-center justify-center overflow-hidden bg-checkerboard p-2">
          {showCompare ? (
            <PhotoCompareSlider
              originalUrl={originalUrl}
              enhancedUrl={currentUrl}
              className="h-full w-full max-h-[500px]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt="Preview"
                className="max-h-[480px] max-w-full rounded-lg object-contain"
              />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Apply an enhancement to see before/after comparison
              </div>
            </div>
          )}
        </Card>

        {/* Right: actions panel */}
        <div className="space-y-3 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            AI Actions
          </p>
          <PhotoActions
            onApply={onApply}
            loadingAction={selectedPhoto?.processingAction ?? null}
            appliedActions={appliedActionsForCurrent}
            disabled={!!selectedPhoto?.processingAction}
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {photoStates.filter((s) => s.history.length > 0).length} of {files.length} photos enhanced
        </div>
        <Button onClick={onContinueClick} disabled={saving} className="bg-gradient-primary glow-primary h-9">
          Continue to AI Analysis
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>

      {/* Hidden download anchor */}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a ref={downloadRef} className="hidden" />
    </div>
  );
}
