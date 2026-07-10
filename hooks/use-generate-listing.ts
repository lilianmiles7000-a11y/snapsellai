'use client';

import { useState, useCallback } from 'react';
import { generateListing } from '@/services/listing-generator';
import type { VisionAnalysisResult, GeneratedListing } from '@/types/ai';
import type { Platform } from '@/types';

interface UseGenerateListingReturn {
  listing: GeneratedListing | null;
  loading: boolean;
  error: string | null;
  generate: (analysis: VisionAnalysisResult, platform: Platform) => GeneratedListing;
  update: (patch: Partial<GeneratedListing>) => void;
  reset: () => void;
}

/**
 * Hook that transforms a VisionAnalysisResult into a complete GeneratedListing.
 *
 * `generate` is synchronous (pure transformation) but the hook exposes a
 * loading state for UI consistency — the heavy work happens in the
 * useImageAnalysis hook during the Vision API call.
 *
 * `update` allows the user to edit fields before saving.
 */
export function useGenerateListing(): UseGenerateListingReturn {
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    (analysis: VisionAnalysisResult, platform: Platform): GeneratedListing => {
      setLoading(true);
      setError(null);
      try {
        const result = generateListing(analysis, platform);
        setListing(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate listing';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback((patch: Partial<GeneratedListing>) => {
    setListing((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const reset = useCallback(() => {
    setListing(null);
    setError(null);
    setLoading(false);
  }, []);

  return { listing, loading, error, generate, update, reset };
}
