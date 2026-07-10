'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, RefreshCw, Wand2,
  Tag, FileText, Hash, Palette, Ruler, Shirt, TrendingUp,
  Zap, Save, Pencil, Eye, Copy, Loader2, Image as ImageIcon,
  Undo2, Redo2, RotateCcw, Download, Eraser, Sun, Focus,
  Crop, Square, Store, Layers, ChevronRight, X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { UploadZone, type UploadedFile } from '@/components/upload-zone';
import { useAuth } from '@/contexts/auth-context';
import { analyzeImages } from '@/services/ai';
import { enhanceImage, ENHANCEMENT_ACTIONS } from '@/services/photo-ai';
import { createEnhancement, updateEnhancement } from '@/services/enhancements';
import { createListingRecord, updateListing, addImageToListing } from '@/services/listings';
import { PLATFORMS } from '@/lib/constants';
import { formatPrice, cn } from '@/lib/utils';
import type { Platform, EnhancementAction } from '@/types';
import type { VisionAnalysisResult } from '@/types/ai';
import { ANALYSIS_STEPS } from '@/types/ai';
import { toast } from 'sonner';

type Step = 'upload' | 'studio' | 'analyzing' | 'result';
type Mode = 'view' | 'edit';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Sun, Focus, Sparkles, Crop, Eraser, Square, Store, Layers,
};

interface HistoryEntry {
  id: string;
  action: EnhancementAction;
  url: string;
  timestamp: Date;
}

interface PhotoState {
  original: string;
  current: string;
  history: HistoryEntry[];
  historyIndex: number;
  processingAction: EnhancementAction | null;
}

export default function NewListingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Flow state
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [platform, setPlatform] = useState<Platform>('vinted');
  const [listingId, setListingId] = useState<string | null>(null);

  // Studio state
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [photoStates, setPhotoStates] = useState<PhotoState[]>([]);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Analysis state
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [editable, setEditable] = useState<VisionAnalysisResult | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);

  const allUploaded = files.length > 0 && files.every((f) => f.status === 'done');

  // Initialize photo states when entering studio
  const enterStudio = useCallback(() => {
    setPhotoStates(files.map((f) => ({ original: f.url, current: f.url, history: [], historyIndex: -1, processingAction: null })));
    setSelectedPhotoIdx(0);
    setStep('studio');
  }, [files]);

  const setPhotoState = (idx: number, updater: (prev: PhotoState) => PhotoState) => {
    setPhotoStates((prev) => prev.map((s, i) => i === idx ? updater(s) : s));
  };

  // Photo Studio slider
  const handleSlider = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  // Apply enhancement
  const onApply = useCallback(async (action: EnhancementAction) => {
    const idx = selectedPhotoIdx;
    const photo = photoStates[idx];
    if (!photo || photo.processingAction) return;

    setPhotoState(idx, (s) => ({ ...s, processingAction: action }));
    const record = await createEnhancement({ original_url: photo.original, action, listing_id: listingId, original_storage_path: null });

    try {
      const res = await enhanceImage(photo.current, action);
      if (record) await updateEnhancement(record.id, { enhanced_url: res.enhanced_url, status: 'done', provider: res.provider as PhotoState['processingAction'] extends string ? never : never }).catch(() => null);

      setPhotoState(idx, (s) => {
        const trimmed = s.history.slice(0, s.historyIndex + 1);
        const newHistory = [...trimmed, { id: `${Date.now()}`, action, url: res.enhanced_url, timestamp: new Date() }];
        return { ...s, current: res.enhanced_url, history: newHistory, historyIndex: newHistory.length - 1, processingAction: null };
      });
      toast.success(`${action.replace(/_/g, ' ')} applied`);
    } catch (err) {
      if (record) await updateEnhancement(record.id, { status: 'failed' }).catch(() => null);
      setPhotoState(idx, (s) => ({ ...s, processingAction: null }));
      toast.error(err instanceof Error ? err.message : 'Enhancement failed');
    }
  }, [selectedPhotoIdx, photoStates, listingId]);

  const onUndo = () => setPhotoState(selectedPhotoIdx, (s) => {
    if (s.historyIndex <= -1) return s;
    const ni = s.historyIndex - 1;
    return { ...s, historyIndex: ni, current: ni === -1 ? s.original : s.history[ni].url };
  });

  const onRedo = () => setPhotoState(selectedPhotoIdx, (s) => {
    if (s.historyIndex >= s.history.length - 1) return s;
    const ni = s.historyIndex + 1;
    return { ...s, historyIndex: ni, current: s.history[ni].url };
  });

  const onReset = () => setPhotoState(selectedPhotoIdx, (s) => ({ ...s, current: s.original, historyIndex: -1 }));

  const onDownload = () => {
    const url = photoStates[selectedPhotoIdx]?.current;
    if (!url || !downloadRef.current) return;
    downloadRef.current.href = url;
    downloadRef.current.download = `enhanced-${selectedPhotoIdx + 1}.jpg`;
    downloadRef.current.click();
  };

  // Continue from Studio to AI Analysis
  const onStudioContinue = useCallback(async () => {
    const enhancedFiles = files.map((f, i) => {
      const ps = photoStates[i];
      if (!ps || ps.current === ps.original) return f;
      return { ...f, url: ps.current };
    });
    setFiles(enhancedFiles);
    setStep('analyzing');
    setAnalysisStep(0);

    // Create listing record
    const created = await createListingRecord(platform);
    if (created) {
      setListingId(created.id);
      enhancedFiles.forEach((f, i) => addImageToListing(created.id, f.url, f.storagePath ?? null, i));
    }

    // Step animation
    const stepInterval = setInterval(() => setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 800);

    try {
      const res = await analyzeImages(enhancedFiles.map((f) => f.url), platform);
      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setResult(res);
      setEditable(res);
      setMode('view');
      setStep('result');

      if (created) {
        await updateListing(created.id, {
          title: res.title, description: res.description, brand: res.brand, category: res.category,
          subcategory: res.subcategory, condition: res.condition, size: res.size, colors: res.colors,
          materials: res.materials, gender: res.gender, suggested_price: res.suggested_price,
          quick_sale_price: res.quick_sale_price, premium_price: res.premium_price,
          confidence: res.confidence, seo_keywords: res.keywords, tags: res.tags, status: 'ready',
        });
        await refreshProfile();
      }
    } catch (err) {
      clearInterval(stepInterval);
      toast.error(err instanceof Error ? err.message : 'AI analysis failed');
      setStep('upload');
    }
  }, [files, photoStates, platform, refreshProfile]);

  const onSave = async () => {
    if (!listingId || !editable) return;
    setSaving(true);
    await updateListing(listingId, {
      title: editable.title, description: editable.description, brand: editable.brand,
      category: editable.category, subcategory: editable.subcategory, condition: editable.condition,
      size: editable.size, colors: editable.colors, materials: editable.materials, gender: editable.gender,
      suggested_price: editable.suggested_price, quick_sale_price: editable.quick_sale_price,
      premium_price: editable.premium_price, confidence: editable.confidence,
      seo_keywords: editable.keywords, tags: editable.tags, status: 'ready',
    });
    await refreshProfile();
    setSaving(false);
    toast.success('Listing saved');
    router.push('/history');
  };

  const copyAll = async () => {
    if (!editable) return;
    const text = [editable.title, '', editable.description, '', `Price: ${formatPrice(editable.suggested_price)}`].join('\n');
    await navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'));
  };

  const reset = () => { setStep('upload'); setFiles([]); setResult(null); setEditable(null); setListingId(null); };

  const selectedPhoto = photoStates[selectedPhotoIdx];

  // ─── STUDIO ──────────────────────────────────────────────────────────────
  if (step === 'studio') {
    const hasEnhanced = (selectedPhoto?.history.length ?? 0) > 0;
    const currentUrl = selectedPhoto?.current ?? '';
    const originalUrl = selectedPhoto?.original ?? '';
    const appliedActions = selectedPhoto?.history.slice(0, (selectedPhoto.historyIndex ?? -1) + 1).map((h) => h.action) ?? [];

    const GROUPS = [
      { key: 'adjust', label: 'Adjustments' },
      { key: 'background', label: 'Background' },
      { key: 'transform', label: 'Transform' },
    ] as const;

    return (
      <div className="flex flex-col gap-4 pb-8">
        {/* Studio header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">AI Photo Studio</h2>
              <p className="text-xs text-muted-foreground">Enhance your photos before generating the listing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{PLATFORMS.find((p) => p.id === platform)?.label}</Badge>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onStudioContinue()}>
              Skip <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5">
          <div className="flex items-center gap-1">
            {[
              { icon: Undo2, label: 'Undo', action: onUndo, enabled: (selectedPhoto?.historyIndex ?? -1) > -1 },
              { icon: Redo2, label: 'Redo', action: onRedo, enabled: (selectedPhoto?.historyIndex ?? -1) < (selectedPhoto?.history.length ?? 0) - 1 },
            ].map(({ icon: Icon, label, action, enabled }) => (
              <button key={label} onClick={action} disabled={!enabled} title={label}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-all', enabled ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/40 cursor-not-allowed')}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="mx-1.5 h-5 w-px bg-border" />
            <button onClick={onReset} title="Reset" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            AI Photo Studio
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onDownload} disabled={!hasEnhanced} title="Download"
              className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-all', hasEnhanced ? 'hover:bg-accent text-foreground' : 'text-muted-foreground/40 cursor-not-allowed')}>
              <Download className="h-4 w-4" />
            </button>
            <Button size="sm" onClick={onStudioContinue} disabled={!!selectedPhoto?.processingAction} className="h-8 bg-gradient-primary text-xs">
              <Check className="h-3.5 w-3.5" />Use photos
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[200px_1fr_200px]">
          {/* Photo strip */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Photos ({files.length})</p>
            <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2">
              {files.map((f, i) => {
                const ps = photoStates[i];
                const isSelected = i === selectedPhotoIdx;
                return (
                  <button key={f.id} onClick={() => setSelectedPhotoIdx(i)}
                    className={cn('relative aspect-square overflow-hidden rounded-lg border-2 transition-all', isSelected ? 'border-primary' : 'border-transparent hover:border-border')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ps?.current ?? f.url} alt="" className="h-full w-full object-cover" />
                    {ps?.processingAction && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-4 w-4 animate-spin text-white" /></div>}
                    {(ps?.history.length ?? 0) > 0 && !ps?.processingAction && <div className="absolute top-1 right-1"><Check className="h-3.5 w-3.5 text-success drop-shadow" /></div>}
                    <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-sm bg-black/60 text-[9px] font-bold text-white">{i + 1}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <Card className={cn('flex items-center justify-center overflow-hidden p-2', hasEnhanced && 'bg-checkerboard')}>
            {hasEnhanced ? (
              <div
                ref={sliderRef}
                className="relative w-full max-h-[480px] overflow-hidden rounded-lg select-none"
                style={{ aspectRatio: '1/1', cursor: 'col-resize' }}
                onMouseMove={(e) => e.buttons === 1 && handleSlider(e)}
                onMouseDown={handleSlider}
                onTouchMove={handleSlider}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentUrl} alt="Enhanced" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
                </div>
                <div className="absolute inset-y-0 w-0.5 bg-white shadow-xl" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">Original</div>
                <div className="absolute bottom-2 right-2 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] text-white">Enhanced</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {currentUrl && <img src={currentUrl} alt="Preview" className="max-h-[440px] max-w-full rounded-lg object-contain" />}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />Apply an enhancement to see before/after
                </p>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="space-y-4 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Actions</p>
            {GROUPS.map((group) => {
              const actions = ENHANCEMENT_ACTIONS.filter((a) => a.group === group.key);
              return (
                <div key={group.key}>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{group.label}</p>
                  <div className="grid grid-cols-1 gap-1">
                    {actions.map((item) => {
                      const Icon = ICON_MAP[item.icon] ?? Sparkles;
                      const isLoading = selectedPhoto?.processingAction === item.action;
                      const isDone = appliedActions.includes(item.action);
                      return (
                        <button key={item.action} onClick={() => onApply(item.action)}
                          disabled={!!selectedPhoto?.processingAction || isLoading}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                            'hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]',
                            isDone ? 'border-success/30 bg-success/5' : 'border-border bg-card/40',
                            (!!selectedPhoto?.processingAction) && 'pointer-events-none opacity-60'
                          )}>
                          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', isDone ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">{item.label}</p>
                            <p className="truncate text-[9px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {photoStates.filter((s) => s.history.length > 0).length} of {files.length} photos enhanced
          </p>
          <Button onClick={onStudioContinue} disabled={!!selectedPhoto?.processingAction} variant="gradient">
            Continue to AI Analysis <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <a ref={downloadRef} className="hidden" />
      </div>
    );
  }

  // ─── ANALYZING ─────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary glow-primary">
            <Wand2 className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-semibold">AI is analyzing your photos…</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Identifying the product, brand, condition and generating optimized copy for {PLATFORMS.find((p) => p.id === platform)?.label}.
        </p>
        <div className="mt-8 w-full max-w-sm space-y-2">
          {ANALYSIS_STEPS.map((s, i) => {
            const status = i < analysisStep ? 'done' : i === analysisStep ? 'running' : 'pending';
            return (
              <div key={s.key} className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-all duration-300',
                status === 'done' ? 'border-success/20 bg-success/5' : status === 'running' ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/40 opacity-40'
              )}>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {status === 'done' ? <Check className="h-4 w-4 text-success" /> : status === 'running' ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                </div>
                <span className={cn('text-sm', status === 'done' ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── RESULT ────────────────────────────────────────────────────────────
  if (step === 'result' && editable) {
    const isEditing = mode === 'edit';
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Your AI-generated listing</h1>
            <p className="text-sm text-muted-foreground">Review, edit, and copy it to your marketplace.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={reset}><ArrowLeft className="h-4 w-4" />New</Button>
            {!isEditing
              ? <Button variant="outline" size="sm" onClick={() => setMode('edit')}><Pencil className="h-4 w-4" />Edit</Button>
              : <Button variant="outline" size="sm" onClick={() => { setMode('view'); setEditable(result); }}><Eye className="h-4 w-4" />View</Button>
            }
            <Button size="sm" onClick={onSave} disabled={saving} className="bg-gradient-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left: photos + prices */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {files.map((f, i) => (
                  <div key={f.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-sm bg-black/70 text-[9px] font-bold text-white">{i + 1}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Price tiers */}
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { label: 'Quick sale', value: isEditing ? editable.quick_sale_price : null, formatted: formatPrice(editable.quick_sale_price), accent: 'text-success', onChange: (v: number) => setEditable({ ...editable!, quick_sale_price: v }) },
                { label: 'Suggested', value: isEditing ? editable.suggested_price : null, formatted: formatPrice(editable.suggested_price), accent: 'text-primary', onChange: (v: number) => setEditable({ ...editable!, suggested_price: v }) },
                { label: 'Premium', value: isEditing ? editable.premium_price : null, formatted: formatPrice(editable.premium_price), accent: 'text-warning', onChange: (v: number) => setEditable({ ...editable!, premium_price: v }) },
              ].map((p) => (
                <Card key={p.label} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={cn('h-4 w-4 shrink-0', p.accent)} />
                    <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
                  </div>
                  {isEditing && p.value !== null ? (
                    <Input type="number" defaultValue={p.value} onChange={(e) => p.onChange(Number(e.target.value))} className="w-24 h-7 text-right border-0 text-sm font-bold focus-visible:ring-0" />
                  ) : (
                    <span className={cn('text-sm font-bold', p.accent)}>{p.formatted}</span>
                  )}
                </Card>
              ))}
            </div>

            {/* Confidence */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />AI Confidence</div>
                <span className={cn('text-sm font-semibold', editable.confidence >= 0.8 ? 'text-success' : editable.confidence >= 0.5 ? 'text-warning' : 'text-destructive')}>
                  {Math.round(editable.confidence * 100)}%
                </span>
              </div>
              <Progress value={editable.confidence * 100} className={cn('h-1.5', editable.confidence >= 0.8 ? '[&>div]:bg-success' : editable.confidence >= 0.5 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive')} />
            </Card>
          </div>

          {/* Right: content */}
          <div className="space-y-4 lg:col-span-3">
            {isEditing ? (
              <Card className="p-5 space-y-4">
                {[
                  { label: 'Title', value: editable.title, onChange: (v: string) => setEditable({ ...editable!, title: v }), type: 'input' },
                  { label: 'Description', value: editable.description, onChange: (v: string) => setEditable({ ...editable!, description: v }), type: 'textarea' },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    {field.type === 'textarea'
                      ? <Textarea value={field.value} onChange={(e) => field.onChange(e.target.value)} rows={6} className="resize-none" />
                      : <Input value={field.value} onChange={(e) => field.onChange(e.target.value)} className="font-medium" />
                    }
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Brand', key: 'brand' as const }, { label: 'Category', key: 'category' as const },
                    { label: 'Condition', key: 'condition' as const }, { label: 'Size', key: 'size' as const },
                    { label: 'Gender', key: 'gender' as const }, { label: 'Subcategory', key: 'subcategory' as const },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Input value={(editable[f.key] ?? '') as string} onChange={(e) => setEditable({ ...editable!, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Colors (comma-separated)</Label>
                  <Input value={editable.colors.join(', ')} onChange={(e) => setEditable({ ...editable!, colors: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })} />
                </div>
              </Card>
            ) : (
              <>
                {/* Title */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Tag className="h-3 w-3" />Title</p>
                      <p className="text-sm font-semibold text-foreground">{editable.title}</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(editable.title).then(() => toast.success('Copied'))} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>

                {/* Description */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Description</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{editable.description}</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(editable.description).then(() => toast.success('Copied'))} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>

                {/* Meta grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Brand', value: editable.brand, icon: Shirt },
                    { label: 'Category', value: editable.category, icon: Tag },
                    { label: 'Condition', value: editable.condition, icon: Check },
                    { label: 'Size', value: editable.size, icon: Ruler },
                    { label: 'Gender', value: editable.gender, icon: Shirt },
                    { label: 'Subcategory', value: editable.subcategory, icon: Tag },
                  ].map(({ label, value, icon: Icon }) => (
                    <Card key={label} className="p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1"><Icon className="h-3 w-3" />{label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{value || '—'}</p>
                    </Card>
                  ))}
                </div>

                {/* Colors & Materials */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Colors', items: editable.colors, icon: Palette, itemClass: 'bg-primary/10 text-primary border-primary/20' },
                    { label: 'Materials', items: editable.materials, icon: Shirt, itemClass: 'border-border text-muted-foreground' },
                  ].map(({ label, items, icon: Icon, itemClass }) => (
                    <Card key={label} className="p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2"><Icon className="h-3 w-3" />{label}</p>
                      <div className="flex flex-wrap gap-1">
                        {items.length > 0 ? items.map((c) => <Badge key={c} variant="outline" className={cn('text-[10px]', itemClass)}>{c}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Keywords */}
                <Card className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2"><Hash className="h-3 w-3" />SEO Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {editable.keywords.map((k) => <Badge key={k} variant="outline" className="text-[10px] border-border text-muted-foreground">{k}</Badge>)}
                  </div>
                </Card>
              </>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={copyAll} variant="gradient">
                <Copy className="h-4 w-4" />Copy full listing
              </Button>
              <Button variant="outline" onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4" />Save to history
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── UPLOAD ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold">Create a new listing</h1>
        <p className="text-sm text-muted-foreground">Upload product photos, choose a platform, and let AI do the rest.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-xs font-bold">1</span>
              Upload product photos
            </h3>
            <UploadZone onFilesChange={setFiles} maxFiles={10} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-xs font-bold">2</span>
              Choose a target platform
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={cn('relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all', platform === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card/40 hover:border-border')}>
                  <span className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: p.color }}>{p.label[0]}</span>
                  <span className="text-xs font-medium">{p.label}</span>
                  {platform === p.id && <Check className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5 sticky top-20">
            <h3 className="mb-4 text-sm font-medium">Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Photos</span><span className="font-medium">{files.length} selected</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">{PLATFORMS.find((p) => p.id === platform)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Credits used</span><span className="font-medium">1</span></div>
            </div>

            {/* Step indicator */}
            <div className="my-4 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold">1</div>
              <span className="text-foreground font-medium">Upload</span>
              <div className="h-px flex-1 bg-border" />
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[9px]">2</div>
              <span>Studio</span>
              <div className="h-px flex-1 bg-border" />
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[9px]">3</div>
              <span>AI</span>
            </div>

            <Button onClick={enterStudio} disabled={!allUploaded} className="w-full bg-gradient-primary h-11">
              <Wand2 className="h-4 w-4" />
              Open Photo Studio
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!allUploaded && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {files.length === 0 ? 'Upload at least one photo to continue' : 'Wait for uploads to finish'}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
