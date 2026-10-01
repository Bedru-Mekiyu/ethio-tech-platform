/**
 * Curated high-quality visual assets for the EthioTech Platform.
 * Using optimized, responsive CDN URLs with built-in lazy loading and size scaling.
 * Sourced with an aesthetic focus on futuristic engineering, realistic human presence,
 * and collaborative, authentic African/Ethiopian developer representation.
 */

export interface MediaAsset {
  id: string;
  unsplashId?: string;
  localPath?: string;
  alt: string;
  caption?: string;
  blurDataUrl?: string; // Low-res placeholder for smooth progressive blur-up
}

export const LOCAL_MEDIA_ASSETS = {
  hero: {
    collaboration: "/images/hero/software-team-collaboration.webp",
  },
  tracks: {
    fullstack: "/images/tracks/fullstack-cloud.webp",
    frontend: "/images/tracks/frontend-engineering.webp",
    mobile: "/images/tracks/mobile-engineering.webp",
    ai: "/images/tracks/applied-ai-systems.webp",
    devops: "/images/tracks/cloud-devops.webp",
    fintech: "/images/tracks/fintech-systems.webp",
  },
  events: {
    hackathon: "/images/events/developer-event.webp",
  },
  mentorship: {
    codeReview: "/images/mentorship/technical-mentorship.webp",
  },
  hubs: {
    workshop: "/images/hubs/tech-hub-workshop.webp",
  },
  community: {
    classroom: "/images/community/tech-community-classroom.webp",
  },
} as const;

export const MEDIA_CATEGORIES = {
  marketing: {
    hero: [
      {
        id: "hero-collaboration",
        unsplashId: "photo-1730130054404-c2bd8e7038c2",
        alt: "African software engineer in studio headphones deeply engaged in VS Code, terminal git commands, and interface systems on a curved ultrawide display",
        blurDataUrl:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4=",
      },
      {
        id: "hero-engineering",
        unsplashId: "photo-1604145559206-e3bce0040e2d",
        alt: "African software engineer developing secure authentication services in TypeScript on a mechanical keyboard workstation",
        blurDataUrl:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4=",
      },
      {
        id: "hero-classroom",
        unsplashId: "photo-1620829813573-7c9e1877706f",
        alt: "Young African engineering student deeply focused on coding on a laptop in a university technical workspace",
        blurDataUrl:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4=",
      },
    ] as MediaAsset[],
    features: {
      realtime: "photo-1607604276583-eef5d076aa5f", // neon ambient coding space
      mentorship: "photo-1528901166007-3784c7dd3653", // pair programming code review
      gamification: "photo-1634017839464-5c339ebe3cb4", // 3D abstract shapes/rewards
    },
  },
  dashboard: {
    coding: [
      {
        id: "dash-coding-setup",
        unsplashId: "photo-1687603917313-ccae1a289a9d",
        alt: "High-resolution display showing TypeScript and React hooks with syntax highlighting in a dark-theme code editor",
      },
      {
        id: "dash-workspace",
        unsplashId: "photo-1547860664-b8537ca5f833",
        alt: "African software engineer building responsive user interfaces in VS Code with a live browser preview",
      },
    ] as MediaAsset[],
    stats: {
      xp: "photo-1635070041078-e363dbe005cb", // grid lines glowing
      badges: "photo-1618005182384-a83a8bd57fbe", // premium 3D mesh
    },
  },
  mentorship: {
    sessions: [
      {
        id: "mentor-teaching",
        unsplashId: "photo-1528901166007-3784c7dd3653",
        alt: "Senior African software engineer conducting a pair programming code review session with a developer over dual monitors",
      },
      {
        id: "mentor-collaboration",
        unsplashId: "photo-1573164713619-24c711fe7878",
        alt: "Software engineers collaborating on technical architecture during an engineering sprint",
      },
    ] as MediaAsset[],
  },
  classroom: {
    immersive: [
      {
        id: "class-virtual-lab",
        unsplashId: "photo-1620829813573-7c9e1877706f",
        alt: "Young African engineering student deeply focused on coding on a laptop in a university technical workspace",
      },
      {
        id: "class-pair-programming",
        unsplashId: "photo-1528901166007-3784c7dd3653",
        alt: "Pair programming in a modern collaborative developer environment",
      },
    ] as MediaAsset[],
  },
  community: {
    showcase: [
      {
        id: "community-hackathon",
        unsplashId: "photo-1573164713619-24c711fe7878",
        alt: "African software engineering team collaborating on laptops covered in developer community stickers during a hackathon sprint",
      },
      {
        id: "community-pitch",
        unsplashId: "photo-1521791136064-7986c2920216",
        alt: "Technology partners agreeing on engineering internships and junior hiring commitments in Nairobi",
      },
    ] as MediaAsset[],
  },
};

/**
 * Builds an optimized Unsplash CDN URL with dynamic resizing, auto-formatting, and quality parameters.
 */
export function getOptimizedImageUrl(
  unsplashId: string,
  options: {
    width?: number;
    height?: number;
    fit?: "crop" | "facearea" | "fill" | "max" | "min" | "scale";
    quality?: number;
  } = {},
): string {
  const { width = 800, height, fit = "crop", quality = 80 } = options;
  const baseUrl = `https://images.unsplash.com/${unsplashId}`;
  const params = new URLSearchParams({
    auto: "format,compress",
    fit,
    w: width.toString(),
    q: quality.toString(),
  });

  if (height) {
    params.append("h", height.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Returns a tiny, low-quality version of the image to serve as a fast blur-up placeholder.
 */
export function getBlurPlaceholderUrl(unsplashId: string): string {
  return getOptimizedImageUrl(unsplashId, { width: 32, quality: 10 });
}
