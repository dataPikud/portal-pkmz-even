import { useState, useEffect, useRef } from 'react';

interface SmartLoaderOptions {
  delayMs?: number;       // Time to wait before displaying loader (default 2000ms)
  minVisibleMs?: number;  // Minimum display duration once loader is shown (default 5000ms)
}

/**
 * Custom hook to handle smart loading state hysteresis:
 * 1. If data returns within delayMs (<= 2s), loader is NEVER shown. Content displays immediately.
 * 2. If data takes longer (> 2s), loader is displayed for at least minVisibleMs (>= 5s).
 * 3. If data takes longer than 2s + 5s, loader continues until data completes.
 */
export function useSmartLoader(
  isLoading: boolean,
  options: SmartLoaderOptions = {}
) {
  const { delayMs = 2000, minVisibleMs = 5000 } = options;

  const [showLoader, setShowLoader] = useState(false);
  const [isContentReady, setIsContentReady] = useState(!isLoading);

  const loaderShownTimeRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minVisibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minVisibleTimerRef.current) clearTimeout(minVisibleTimerRef.current);

      setIsContentReady(false);

      // Wait delayMs (2 seconds) before revealing loader
      delayTimerRef.current = setTimeout(() => {
        setShowLoader(true);
        loaderShownTimeRef.current = Date.now();
      }, delayMs);
    } else {
      // Loading finished from API
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }

      if (!loaderShownTimeRef.current) {
        // Loader was NEVER shown (data arrived within delayMs)
        setShowLoader(false);
        setIsContentReady(true);
      } else {
        // Loader IS currently visible. Ensure it stays for at least minVisibleMs (5 seconds)
        const elapsed = Date.now() - loaderShownTimeRef.current;
        const remaining = Math.max(0, minVisibleMs - elapsed);

        minVisibleTimerRef.current = setTimeout(() => {
          setShowLoader(false);
          setIsContentReady(true);
          loaderShownTimeRef.current = null;
        }, remaining);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minVisibleTimerRef.current) clearTimeout(minVisibleTimerRef.current);
    };
  }, [isLoading, delayMs, minVisibleMs]);

  return { showLoader, isContentReady };
}
