import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getBlurPlaceholderUrl } from "@/config/mediaConfig";
import { ImageIcon } from "lucide-react";

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  unsplashId?: string;
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  fit?: "crop" | "fill" | "scale";
  quality?: number;
  hoverEffect?: "none" | "zoom" | "lift" | "glow";
  wrapperClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
}

function generateSrcSet(unsplashId: string, fit: "crop" | "facearea" | "fill" | "max" | "min" | "scale"): string {
  const widths = [400, 800, 1200];
  return widths.map((w) => `${getOptimizedImageUrl(unsplashId, { width: w, fit, quality: 82 })} ${w}w`).join(", ");
}

export function SmartImage({
  unsplashId,
  src,
  alt,
  width = 800,
  height,
  fit = "crop",
  quality = 82,
  hoverEffect = "none",
  className,
  wrapperClassName,
  aspectRatio,
  priority = false,
  loading,
  fetchPriority,
  ...props
}: SmartImageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const finalSrc = unsplashId ? getOptimizedImageUrl(unsplashId, { width, height, fit, quality }) : src || "";
  const placeholderSrc = unsplashId ? getBlurPlaceholderUrl(unsplashId) : "";
  const srcSet = unsplashId ? generateSrcSet(unsplashId, fit) : undefined;
  const sizesAttr = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px";

  const computedLoading = loading ?? (priority ? "eager" : "lazy");
  const computedFetchPriority = fetchPriority ?? (priority ? "high" : "auto");

  const hoverVariants = {
    none: {},
    zoom: shouldReduceMotion ? {} : { scale: 1.03 },
    lift: shouldReduceMotion ? {} : { y: -3, scale: 1.01 },
    glow: shouldReduceMotion ? {} : { scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" },
  };

  return (
    <motion.div
      key={finalSrc}
      className={cn("relative overflow-hidden bg-slate-100 border border-slate-200", aspectRatio, wrapperClassName)}
      whileHover={hoverEffect !== "none" ? hoverEffect : undefined}
      variants={hoverVariants}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {!loaded && !error && <div className="absolute inset-0 z-10 animate-pulse bg-slate-200/60" />}

      {placeholderSrc && !loaded && !error && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover blur-md scale-105"
        />
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 p-4 text-slate-500">
          <ImageIcon size={24} className="opacity-60" />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={finalSrc}
          srcSet={srcSet}
          sizes={sizesAttr}
          alt={alt}
          loading={computedLoading}
          fetchPriority={computedFetchPriority}
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </motion.div>
  );
}
