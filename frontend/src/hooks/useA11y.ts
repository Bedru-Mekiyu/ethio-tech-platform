import { useState, useEffect } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 * Helps optimize animations for users with motion sensitivity
 * or on low-end devices with limited GPU resources.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    // Initialize from media query (no setState in effect)
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    // Listen for changes only
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
  return useState(() => {
    // Check device memory (if available)
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    if (deviceMemory && deviceMemory <= 4) {
      return true;
    }

    const maxTouchPoints = navigator.maxTouchPoints ?? 0;
    if (maxTouchPoints > 0 && window.innerWidth < 768) {
      return true;
    }

    const concurrency = navigator.hardwareConcurrency ?? 1;
    if (concurrency <= 2) {
      return true;
    }

    return false;
  })[0];
};
