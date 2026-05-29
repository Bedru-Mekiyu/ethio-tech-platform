/**
 * Curated high-quality visual assets for the EthioTech Platform.
 * Using optimized, responsive CDN URLs with built-in lazy loading and size scaling.
 * Sourced with an aesthetic focus on futuristic engineering, realistic human presence,
 * and collaborative, authentic African/Ethiopian developer representation.
 */

export interface MediaAsset {
  id: string;
  unsplashId: string;
  alt: string;
  caption?: string;
  blurDataUrl?: string; // Low-res placeholder for smooth progressive blur-up
}

export const MEDIA_CATEGORIES = {
  marketing: {
    hero: [
      {
        id: "hero-collaboration",
        unsplashId: "photo-1531482615713-2afd69097998",
        alt: "Young developers collaborating on a software architecture project in a modern tech workspace",
        blurDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4="
      },
      {
        id: "hero-engineering",
        unsplashId: "photo-1522071820081-009f0129c71c",
        alt: "Student engineer designing code pipelines in front of multiple screen setups with neon ambient light",
        blurDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4="
      },
      {
        id: "hero-classroom",
        unsplashId: "photo-1515187029135-18ee286d815b",
        alt: "Innovative technology laboratory workshop with team solving engineering tasks",
        blurDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTEwMWMiLz48L3N2Zz4="
      }
    ] as MediaAsset[],
    features: {
      realtime: "photo-1607604276583-eef5d076aa5f", // neon ambient coding space
      mentorship: "photo-1573497019940-1c28c88b4f3e", // remote meeting call
      gamification: "photo-1634017839464-5c339ebe3cb4" // 3D abstract shapes/rewards
    }
  },
  dashboard: {
    coding: [
      {
        id: "dash-coding-setup",
        unsplashId: "photo-1607604276583-eef5d076aa5f",
        alt: "Clean programming setup with VS Code editor open under custom keyboard lights",
      },
      {
        id: "dash-workspace",
        unsplashId: "photo-1555066931-4365d14bab8c",
        alt: "Sleek software engineering environment with high resolution screen arrays",
      }
    ] as MediaAsset[],
    stats: {
      xp: "photo-1635070041078-e363dbe005cb", // grid lines glowing
      badges: "photo-1618005182384-a83a8bd57fbe" // premium 3D mesh
    }
  },
  mentorship: {
    sessions: [
      {
        id: "mentor-teaching",
        unsplashId: "photo-1573496359142-b8d87734a5a2",
        alt: "Senior engineer explaining logic streams in a collaborative session",
      },
      {
        id: "mentor-collaboration",
        unsplashId: "photo-1507537297725-24a1c029d3ca",
        alt: "Global professionals talking over software mockups and system logs",
      }
    ] as MediaAsset[]
  },
  classroom: {
    immersive: [
      {
        id: "class-virtual-lab",
        unsplashId: "photo-1635070041078-e363dbe005cb",
        alt: "Connected virtual laboratory with interactive engineering overlays",
      },
      {
        id: "class-pair-programming",
        unsplashId: "photo-1522071820081-009f0129c71c",
        alt: "Pair programming in a high-end dark-themed environment",
      }
    ] as MediaAsset[]
  },
  community: {
    showcase: [
      {
        id: "community-hackathon",
        unsplashId: "photo-1504384308090-c894fdcc538d",
        alt: "Active software engineering sprint event",
      },
      {
        id: "community-pitch",
        unsplashId: "photo-1531498860502-7c67cfd28058",
        alt: "Ethiopian developers showcasing a local fintech solution at an innovation hub",
      }
    ] as MediaAsset[]
  }
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
  } = {}
): string {
  const { width = 800, height, fit = "crop", quality = 80 } = options;
  const baseUrl = `https://images.unsplash.com/${unsplashId}`;
  const params = new URLSearchParams({
    auto: "format,compress",
    fit,
    w: width.toString(),
    q: quality.toString()
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
