import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildAvatarFallbackChain, resolveAvatarUrl, type SystemAvatarRole } from "@/config/avatarLibrary";
import { useAvatarSnapshot } from "@/store/avatarRegistry";

export interface AvatarProps {
  src?: string;
  name: string;
  userId?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  hoverZoom?: boolean;
  className?: string;
  alt?: string;
  role?: SystemAvatarRole;
}

const initialsFromName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "•";

const unique = (items: Array<string | null | undefined>) =>
  items.filter((item, index, list) => Boolean(item) && list.indexOf(item) === index) as string[];

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
    const fallbackSeed = userId ?? name;
    const systemCandidates = buildAvatarFallbackChain(fallbackSeed, role).map((candidate) => resolveAvatarUrl(candidate));
    return unique([resolvedSource, ...systemCandidates]);
  }, [name, registryAvatar?.avatarUrl, role, src, userId]);

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-24 w-24 text-2xl",
  };

  const statusDotSizes = {
    sm: "h-2 w-2 right-0 bottom-0 ring-1",
    md: "h-2.5 w-2.5 right-0.5 bottom-0.5 ring-1.5",
    lg: "h-3.5 w-3.5 right-0.5 bottom-0.5 ring-2",
    xl: "h-5 w-5 right-1 bottom-1 ring-2",
  };

  const statusColors = {
    online: "bg-success shadow-[0_0_8px_rgba(46,204,113,0.8)]",
    away: "bg-warning shadow-[0_0_8px_rgba(241,196,15,0.8)]",
    offline: "bg-neutral-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]",
  };

  return (
    <div className="relative inline-block shrink-0">
      <AvatarMedia
        key={candidateSources.join("|")}
        candidateSources={candidateSources}
        name={name}
        sizeClass={sizes[size]}
        initials={initialsFromName(name)}
        alt={alt ?? `${name} profile avatar`}
        className={cn(
          "relative overflow-hidden rounded-full transition-transform duration-300 ease-out",
          hoverZoom && "hover:scale-[1.05] hover:shadow-lg hover:shadow-primary/10",
          className
        )}
      />
      {status && (
        <span
          className={cn(
            "absolute block rounded-full ring-[var(--bg-base)]",
            statusDotSizes[size],
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

interface AvatarMediaProps {
  candidateSources: string[];
  name: string;
  sizeClass: string;
  initials: string;
  alt: string;
  className?: string;
}

function AvatarMedia({ candidateSources, name, sizeClass, initials, alt, className }: AvatarMediaProps) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasErrored, setHasErrored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const activeSource = candidateSources[attemptIndex];

  const handleError = () => {
    if (attemptIndex < candidateSources.length - 1) {
      setAttemptIndex((current) => Math.min(current + 1, candidateSources.length - 1));
      return;
    }
    setHasErrored(true);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full transition-transform duration-300 ease-out",
        sizeClass,
        className
      )}
      aria-busy={!isLoaded && !hasErrored}
    >
      {activeSource && !hasErrored ? (
        <img
          src={activeSource}
          alt={alt}
          className={cn("h-full w-full object-cover ring-2 ring-primary/30", !isLoaded && "opacity-0")}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {!hasErrored ? (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold text-white ring-2 ring-primary/20 transition-opacity duration-200",
            "bg-gradient-to-tr from-secondary/40 via-primary/30 to-secondary/30",
            isLoaded ? "opacity-0" : "opacity-100",
            !activeSource && "opacity-100"
          )}
        >
          <span className="sr-only">{name}</span>
        </div>
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center font-semibold text-white ring-2 ring-primary/20",
            "bg-gradient-to-tr from-secondary/40 via-primary/30 to-secondary/30"
          )}
          aria-label={`${name} avatar unavailable`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
