export const avatarSizes = {
  sm: { dimension: 32, className: "h-8 w-8" },
  md: { dimension: 40, className: "h-10 w-10" },
  lg: { dimension: 56, className: "h-14 w-14" },
  xl: { dimension: 96, className: "h-24 w-24" },
} as const;

export type AvatarSize = keyof typeof avatarSizes;

export function getAvatarSizeClass(size: AvatarSize): string {
  return avatarSizes[size].className;
}

export function getAvatarDimension(size: AvatarSize): number {
  return avatarSizes[size].dimension;
}

export const statusDotSizes: Record<AvatarSize, string> = {
  sm: "h-2 w-2 right-0 bottom-0 ring-1",
  md: "h-2.5 w-2.5 right-0.5 bottom-0.5 ring-1.5",
  lg: "h-3.5 w-3.5 right-0.5 bottom-0.5 ring-2",
  xl: "h-5 w-5 right-1 bottom-1 ring-2",
};

export const statusColors = {
  online: "bg-success shadow-[0_0_8px_rgba(46,204,113,0.8)]",
  away: "bg-warning shadow-[0_0_8px_rgba(241,196,15,0.8)]",
  offline: "bg-neutral-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]",
} as const;
