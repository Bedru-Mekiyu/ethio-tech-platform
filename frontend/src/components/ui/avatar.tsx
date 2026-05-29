import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  hoverZoom?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  status,
  hoverZoom = false,
  className,
}: AvatarProps) {
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

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "rounded-full overflow-hidden transition-transform duration-300 ease-out",
          hoverZoom && "hover:scale-[1.05] hover:shadow-lg hover:shadow-primary/10",
          sizes[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover ring-2 ring-primary/30"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center font-semibold text-white ring-2 ring-primary/20",
              "bg-gradient-to-tr from-secondary/40 via-primary/30 to-secondary/30",
              "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            )}
          >
            {initials}
          </div>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-[var(--bg-base)] block",
            statusDotSizes[size],
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

