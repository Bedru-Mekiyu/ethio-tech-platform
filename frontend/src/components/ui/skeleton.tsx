import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  lines?: number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  lines = 1,
  ...props
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="flex flex-col gap-2.5 w-full" {...props}>
        {Array.from({ length: lines }).map((_, idx) => {
          const isLast = idx === lines - 1;
          return (
            <div
              key={idx}
              className={cn(
                "h-3 rounded-md bg-white/8 skeleton-shimmer",
                isLast ? "w-4/5" : "w-full",
                className
              )}
            />
          );
        })}
      </div>
    );
  }

  const variants = {
    text: "h-3 w-full rounded-md",
    circular: "rounded-full shrink-0",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "bg-white/8 skeleton-shimmer",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

