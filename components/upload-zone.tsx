'use client';

import { useCallback, useState, useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage, validateImageFile } from '@/lib/image-utils';
import { uploadListingImage } from '@/lib/storage';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  file: File;
  url: string;
  storagePath: string | null;
  status: 'uploading' | 'done' | 'error';
  preview: string;
}

interface UploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function UploadZone({ onFilesChange, maxFiles = 10, disabled }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const updateFile = (id: string, patch: Partial<UploadedFile>) => {
    setFiles((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, ...patch } : f);
      onFilesChange(updated);
      return updated;
    });
  };

  const onDrop = useCallback(async (accepted: File[]) => {
    const sb = getSupabaseBrowserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { toast.error('You must be signed in to upload photos'); return; }

    const remaining = maxFiles - files.length;
    const toAdd = accepted.slice(0, remaining);

    const newEntries: UploadedFile[] = toAdd.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: '',
      storagePath: null,
      status: 'uploading',
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => {
      const updated = [...prev, ...newEntries];
      onFilesChange(updated);
      return updated;
    });

    for (const entry of newEntries) {
      const validation = validateImageFile(entry.file);
      if (validation) {
        toast.error(validation);
        updateFile(entry.id, { status: 'error' });
        continue;
      }

      try {
        const compressed = await compressImage(entry.file);
        const result = await uploadListingImage(user.id, compressed);
        if (!result) throw new Error('Upload failed');
        updateFile(entry.id, { url: result.url, storagePath: result.path, status: 'done' });
      } catch {
        toast.error(`Failed to upload ${entry.file.name}`);
        updateFile(entry.id, { status: 'error' });
      }
    }
  }, [files.length, maxFiles, updateFile]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onFilesChange(updated);
      return updated;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
  });

  return (
    <div className="space-y-3">
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150 cursor-pointer',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40',
            (disabled || files.length >= maxFiles) && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? 'Drop photos here' : 'Upload product photos'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag & drop or click · JPG, PNG, WebP · Max 20MB · {maxFiles} photos max
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.preview} alt="" className="h-full w-full object-cover" />
              {f.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/40">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              )}
              {f.status === 'done' && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="h-4 w-4 text-success drop-shadow" />
                </div>
              )}
              <button
                onClick={() => removeFile(f.id)}
                className="absolute top-1 left-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white group-hover:flex"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
