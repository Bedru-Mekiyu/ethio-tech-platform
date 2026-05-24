import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      className={cn("rounded-full object-cover ring-2 ring-primary/40", sizes[size], className)}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-secondary/30 font-semibold text-primary ring-2 ring-primary/30",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
