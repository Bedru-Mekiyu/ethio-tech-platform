import { useEffect, useState } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 * Helps optimize animations for users with motion sensitivity
 * or on low-end devices with limited GPU resources.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
};

/**
 * Hook to detect if running on a low-end device (low DPI, limited GPU).
 * Helps disable expensive animations and 3D rendering on constrained hardware.
 */
export const useLowEndDevice = (): boolean => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 4) {
      setIsLowEnd(true);
      return;
    }

    // Check max touch points (touch devices are often constrained)
    const maxTouchPoints = navigator.maxTouchPoints ?? 0;
    if (maxTouchPoints > 0 && window.innerWidth < 768) {
      // Mobile device
      setIsLowEnd(true);
    }

    // Check hardware concurrency (logical CPUs)
    const concurrency = navigator.hardwareConcurrency ?? 1;
    if (concurrency <= 2) {
      setIsLowEnd(true);
    }
  }, []);

  return isLowEnd;
};
