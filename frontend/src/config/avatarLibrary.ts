import { getBackendOrigin } from "@/config/runtime";

export type SystemAvatarRole = "student" | "mentor";

export interface SystemAvatarEntry {
  id: string;
  role: SystemAvatarRole;
  label: string;
  alt: string;
  url: string;
}

const rawCatalog: Array<Omit<SystemAvatarEntry, "url">> = [
  {
    id: "student-01",
    role: "student",
    label: "Student avatar 1",
    alt: "Illustrated Ethiopian student avatar with a backpack",
  },
  {
    id: "student-02",
    role: "student",
    label: "Student avatar 2",
    alt: "Illustrated Ethiopian student avatar with a hoodie",
  },
  {
    id: "student-03",
    role: "student",
    label: "Student avatar 3",
    alt: "Illustrated Ethiopian student avatar with a notebook",
  },
  {
    id: "student-04",
    role: "student",
    label: "Student avatar 4",
    alt: "Illustrated Ethiopian student avatar with glasses",
  },
  {
    id: "mentor-01",
    role: "mentor",
    label: "Mentor avatar 1",
    alt: "Illustrated Ethiopian mentor avatar with a blazer",
  },
  { id: "mentor-02", role: "mentor", label: "Mentor avatar 2", alt: "Illustrated Ethiopian mentor avatar with a tie" },
  {
    id: "mentor-03",
    role: "mentor",
    label: "Mentor avatar 3",
    alt: "Illustrated Ethiopian mentor avatar with a laptop",
  },
  {
    id: "mentor-04",
    role: "mentor",
    label: "Mentor avatar 4",
    alt: "Illustrated Ethiopian mentor avatar with a calm profile",
  },
];

const systemAvatarUrl = (id: string) => `/avatars/${id}.svg`;

const buildLocalCatalog = (): SystemAvatarEntry[] =>
  rawCatalog.map((avatar) => ({
    ...avatar,
    url: systemAvatarUrl(avatar.id),
  }));

let cachedAvatars: SystemAvatarEntry[] | null = null;
let cachePromise: Promise<SystemAvatarEntry[]> | null = null;

export async function fetchSystemAvatars(): Promise<SystemAvatarEntry[]> {
  if (cachedAvatars) return cachedAvatars;

  if (!cachePromise) {
    cachePromise = (async (): Promise<SystemAvatarEntry[]> => {
      let avatars: SystemAvatarEntry[] = buildLocalCatalog();
      try {
        const response = await fetch(`${getBackendOrigin()}/api/users/me/avatars`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.avatars?.length) {
            avatars = data.data.avatars;
          }
        }
      } catch {
        // Ignore network errors, fall back to local catalog
      }
      cachedAvatars = avatars;
      return avatars;
    })();
  }

  // cachePromise is guaranteed to be non-null here
  const promise = cachePromise;
  const result = await promise;
  return result;
}

export function getSystemAvatars(role?: SystemAvatarRole): SystemAvatarEntry[] {
  const catalog = cachedAvatars ?? buildLocalCatalog();
  if (!role) return catalog;
  const order: Record<SystemAvatarRole, SystemAvatarRole[]> = {
    student: ["student", "mentor"],
    mentor: ["mentor", "student"],
  };
  const roleOrder = order[role] ?? ["student", "mentor"];
  return catalog.filter((avatar) => roleOrder.includes(avatar.role));
}

export function getSystemAvatarById(id: string): SystemAvatarEntry | null {
  const catalog = cachedAvatars ?? buildLocalCatalog();
  return catalog.find((avatar) => avatar.id === id) ?? null;
}

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const uniqueByUrl = (avatars: SystemAvatarEntry[]) =>
  avatars.filter((avatar, index, list) => list.findIndex((item) => item.url === avatar.url) === index);

export function buildAvatarFallbackChain(seed: string, role?: SystemAvatarRole, count = 4): string[] {
  const catalog = getSystemAvatars(role);
  if (catalog.length === 0) return [];

  const primaryIndex = hashSeed(seed) % catalog.length;
  const secondaryIndex = (primaryIndex + 3) % catalog.length;
  const tertiaryIndex = (primaryIndex + 5) % catalog.length;
  const quaternaryIndex = (primaryIndex + 7) % catalog.length;

  return uniqueByUrl([catalog[primaryIndex], catalog[secondaryIndex], catalog[tertiaryIndex], catalog[quaternaryIndex]])
    .map((avatar) => avatar.url)
    .slice(0, count);
}

export function buildAvatarSrcSet(baseUrl: string): string {
  if (baseUrl.startsWith("/avatars/")) {
    return "";
  }
  if (baseUrl.includes("res.cloudinary.com")) {
    const widths = [64, 128, 256, 512];
    return widths
      .map((w) => {
        const url = baseUrl.includes("/upload/")
          ? baseUrl.replace("/upload/", `/upload/w_${w},c_fill,g_face/`)
          : baseUrl;
        return `${url} ${w}w`;
      })
      .join(", ");
  }
  return "";
}

export function resolveAvatarUrl(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("/avatars/")) return `${getBackendOrigin()}${src}`;
  return src;
}

export function clearAvatarCache() {
  cachedAvatars = null;
  cachePromise = null;
}
