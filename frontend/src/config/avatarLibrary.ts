export type SystemAvatarRole = "student" | "mentor";

export interface SystemAvatarEntry {
  id: string;
  role: SystemAvatarRole;
  label: string;
  alt: string;
  url: string;
}

const rawCatalog: Array<Omit<SystemAvatarEntry, "url">> = [
  { id: "student-01", role: "student", label: "Student avatar 1", alt: "Illustrated Ethiopian student avatar with a backpack" },
  { id: "student-02", role: "student", label: "Student avatar 2", alt: "Illustrated Ethiopian student avatar with a hoodie" },
  { id: "student-03", role: "student", label: "Student avatar 3", alt: "Illustrated Ethiopian student avatar with a notebook" },
  { id: "student-04", role: "student", label: "Student avatar 4", alt: "Illustrated Ethiopian student avatar with glasses" },
  { id: "mentor-01", role: "mentor", label: "Mentor avatar 1", alt: "Illustrated Ethiopian mentor avatar with a blazer" },
  { id: "mentor-02", role: "mentor", label: "Mentor avatar 2", alt: "Illustrated Ethiopian mentor avatar with a tie" },
  { id: "mentor-03", role: "mentor", label: "Mentor avatar 3", alt: "Illustrated Ethiopian mentor avatar with a laptop" },
  { id: "mentor-04", role: "mentor", label: "Mentor avatar 4", alt: "Illustrated Ethiopian mentor avatar with a calm profile" },
];

const systemAvatarUrl = (id: string) => `/avatars/${id}.svg`;

export const SYSTEM_AVATARS: SystemAvatarEntry[] = rawCatalog.map((avatar) => ({
  ...avatar,
  url: systemAvatarUrl(avatar.id),
}));

const roleOrder: Record<SystemAvatarRole, SystemAvatarRole[]> = {
  student: ["student", "mentor"],
  mentor: ["mentor", "student"],
};

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const uniqueByUrl = (avatars: SystemAvatarEntry[]) =>
  avatars.filter((avatar, index, list) => list.findIndex((item) => item.url === avatar.url) === index);

export function getSystemAvatars(role?: SystemAvatarRole) {
  if (!role) return SYSTEM_AVATARS;
  const order = roleOrder[role] ?? ["student", "mentor"];
  return SYSTEM_AVATARS.filter((avatar) => order.includes(avatar.role));
}

export function getSystemAvatarById(id: string) {
  return SYSTEM_AVATARS.find((avatar) => avatar.id === id) ?? null;
}

export function buildAvatarFallbackChain(seed: string, role?: SystemAvatarRole) {
  const catalog = getSystemAvatars(role);
  if (catalog.length === 0) return [];

  const primaryIndex = hashSeed(seed) % catalog.length;
  const secondaryIndex = (primaryIndex + 3) % catalog.length;
  const tertiaryIndex = (primaryIndex + 5) % catalog.length;

  return uniqueByUrl([catalog[primaryIndex], catalog[secondaryIndex], catalog[tertiaryIndex]]).map((avatar) => avatar.url);
}

export function resolveAvatarUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("/avatars/")) return `${import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "") ?? "http://localhost:5000"}${src}`;
  return src;
}

