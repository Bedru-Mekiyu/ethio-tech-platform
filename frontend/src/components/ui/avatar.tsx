import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  buildAvatarFallbackChain,
  resolveAvatarUrl,
  buildAvatarSrcSet,
  type SystemAvatarRole,
} from "@/config/avatarLibrary";
import { useAvatarSnapshot } from "@/store/avatarRegistry";

export interface AvatarProps {
  src?: string;
  name?: string;
  userId?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  hoverZoom?: boolean;
  className?: string;
  alt?: string;
  role?: SystemAvatarRole;
}

const unique = (items: Array<string | null | undefined>) =>
  items.filter((item, index, list) => Boolean(item) && list.indexOf(item) === index) as string[];

function getInitials(name?: string): string {
  if (!name || typeof name !== "string" || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  userId,
  size = "md",
  status,
  hoverZoom = false,
  className,
  alt,
  role,
}: AvatarProps) {
  const registryAvatar = useAvatarSnapshot(userId);

  const candidateSources = useMemo(() => {
    const resolvedSource = resolveAvatarUrl(registryAvatar?.avatarUrl ?? src);
    const fallbackSeed = userId || name || "ethio-user";
    const systemCandidates = buildAvatarFallbackChain(fallbackSeed, role, 4).map((candidate) =>
      resolveAvatarUrl(candidate),
    );
    return unique([resolvedSource, ...systemCandidates]);
  }, [name, registryAvatar?.avatarUrl, role, src, userId]);

  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-24 w-24",
  };

  const statusDotSizes = {
    sm: "h-2 w-2 right-0 bottom-0 ring-1",
    md: "h-2.5 w-2.5 right-0.5 bottom-0.5 ring-1.5",
    lg: "h-3.5 w-3.5 right-0.5 bottom-0.5 ring-2",
    xl: "h-5 w-5 right-1 bottom-1 ring-2",
  };

  const statusColors = {
    online: "bg-zinc-800 ring-2 ring-white",
    away: "bg-amber-500 ring-2 ring-white",
    offline: "bg-zinc-400 ring-2 ring-white",
  };

  const resolvedAlt = alt ?? (name ? `${name}'s profile avatar` : "Profile avatar");

  return (
    <div className="relative inline-block shrink-0">
      <AvatarMedia
        key={candidateSources.join("|")}
        candidateSources={candidateSources}
        name={name}
        sizeClass={sizes[size]}
        alt={resolvedAlt}
        className={cn(
          "relative overflow-hidden rounded-full transition-transform duration-200 ease-out",
          hoverZoom && "hover:scale-[1.03] hover:shadow-sm",
          className,
        )}
      />
      {status && (
        <span
          className={cn(
            "absolute block rounded-full ring-[var(--bg-base)]",
            statusDotSizes[size],
            statusColors[status],
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

interface AvatarMediaProps {
  candidateSources: string[];
  name?: string;
  sizeClass: string;
  alt: string;
  className?: string;
}

function AvatarMedia({ candidateSources, name, sizeClass, alt, className }: AvatarMediaProps) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasErrored, setHasErrored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeSource = candidateSources[attemptIndex];
  const srcSet = activeSource ? buildAvatarSrcSet(activeSource) : "";

  const handleError = () => {
    if (attemptIndex < candidateSources.length - 1) {
      setAttemptIndex((current) => Math.min(current + 1, candidateSources.length - 1));
      setLoadError(null);
      return;
    }
    setHasErrored(true);
    setLoadError(name ? `Failed to load avatar for ${name}` : "Failed to load avatar");
  };

  useEffect(() => {
    if (loadError) {
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = loadError;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }, [loadError]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full transition-transform duration-300 ease-out",
        sizeClass,
        className,
      )}
      role="img"
      aria-label={alt}
      aria-busy={!isLoaded && !hasErrored}
    >
      {activeSource && !hasErrored ? (
        <>
          <img
            src={activeSource}
            srcSet={srcSet || undefined}
            sizes={srcSet ? "(max-width: 640px) 64px, (max-width: 1024px) 128px, 256px" : undefined}
            alt={alt}
            className={cn("h-full w-full object-cover border border-zinc-200", !isLoaded && "opacity-0")}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            loading="lazy"
            decoding="async"
          />
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 transition-opacity duration-200",
              isLoaded ? "opacity-0" : "opacity-100",
            )}
            aria-hidden="true"
          >
            <span>{getInitials(name)}</span>
          </div>
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center border border-zinc-200 bg-zinc-100 font-semibold text-zinc-700 select-none text-xs"
          aria-label={alt}
        >
          <span>{getInitials(name)}</span>
        </div>
      )}
    </div>
  );
}
