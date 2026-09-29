import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface EthiopiaSilhouetteProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Clean, geographically-reduced geometric silhouette of Ethiopia.
 * Optimized for legibility across 16px, 24px, 32px, and display sizes.
 * Preserves the defining national landmarks: Tigray northern arch, Afar escarpment,
 * Djibouti notch, Ogaden eastern Horn apex, Moyale southern curve, and Gambella western salient.
 */
export function EthiopiaSilhouette({ className, size = 20, ...props }: EthiopiaSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      role="img"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d="M 35 14 C 36 14 37 14 38 14 L 46 16 C 47 16 48 17 49 18 L 61 27 C 62 28 62 29 61 30 L 57 35 C 56 36 57 37 58 37 L 64 38 C 66 38 67 39 68 39 L 92 53 C 94 54 94 56 92 57 L 77 74 C 76 75 75 75 74 76 L 45 86 C 44 86 43 86 42 86 L 30 81 C 29 81 28 80 27 79 L 20 70 C 19 69 19 68 18 67 L 8 56 C 6 55 6 53 8 52 L 13 47 C 14 46 14 45 15 44 L 19 33 C 20 31 20 30 21 29 L 26 22 C 27 21 28 20 29 19 Z" />
    </svg>
  );
}
