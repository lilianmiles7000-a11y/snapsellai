'use client';

import { useState, useCallback } from 'react';
import { analyzeImages } from '@/services/image-analysis';
import type { VisionAnalysisResult, AnalyzeImagesInput, AnalysisStepState } from '@/types/ai';
import { ANALYSIS_STEPS } from '@/types/ai';

interface UseImageAnalysisReturn {
  analysis: VisionAnalysisResult | null;
  loading: boolean;
  error: string | null;
  steps: AnalysisStepState[];
  analyze: (input: AnalyzeImagesInput) => Promise<VisionAnalysisResult | null>;
  reset: () => void;
}

/**
 * Hook that manages the image analysis lifecycle:
 * 1. Sets all steps to pending
 * 2. Progressively advances each step (with animation timing)
 * 3. Calls the OpenAI Vision edge function
 * 4. Returns the structured result
 *
 * The step animation runs in parallel with the actual API call so the UI
 * feels responsive even while waiting for the network.
 */
export function useImageAnalysis(): UseImageAnalysisReturn {
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStepState[]>(
    ANALYSIS_STEPS.map((s) => ({ ...s, status: 'pending' as const }))
  );

  const advanceSteps = useCallback(async () => {
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      const step = ANALYSIS_STEPS[i];
      setSteps((prev) =>
        prev.map((s) => (s.key === step.key ? { ...s, status: 'running' } : s))
      );
      // Vary the delay so it feels natural — earlier steps are faster
      const delay = step.key === 'done' ? 200 : 300 + Math.random() * 400;
      await new Promise((r) => setTimeout(r, delay));
      setSteps((prev) =>
        prev.map((s) => (s.key === step.key ? { ...s, status: 'done' } : s))
      );
    }
  }, []);

  const analyze = useCallback(
    async (input: AnalyzeImagesInput): Promise<VisionAnalysisResult | null> => {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      setSteps(ANALYSIS_STEPS.map((s) => ({ ...s, status: 'pending' as const })));

      try {
        // Run step animation in parallel with the real API call
        const [result] = await Promise.all([
          analyzeImages(input),
          advanceSteps(),
        ]);
        setAnalysis(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze images';
        setError(message);
        // Mark remaining steps as done so the UI doesn't hang
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [advanceSteps]
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
    setSteps(ANALYSIS_STEPS.map((s) => ({ ...s, status: 'pending' as const })));
  }, []);

  return { analysis, loading, error, steps, analyze, reset };
}
