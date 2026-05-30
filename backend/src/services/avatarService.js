import crypto from "crypto";

const SYSTEM_AVATAR_BASE_PATH = "/avatars";

const AVATAR_LIBRARY = [
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
  {
    id: "mentor-02",
    role: "mentor",
    label: "Mentor avatar 2",
    alt: "Illustrated Ethiopian mentor avatar with a tie",
  },
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

const rolePriority = {
  student: ["student"],
  mentor: ["mentor"],
  admin: ["mentor"],
  parent: ["mentor"],
};

export const SYSTEM_AVATAR_ROLES = ["student", "mentor"];

export const buildSystemAvatarUrl = (avatarId) => `${SYSTEM_AVATAR_BASE_PATH}/${avatarId}.svg`;

export const getSystemAvatarCatalog = () =>
  AVATAR_LIBRARY.map((avatar) => ({
    ...avatar,
    url: buildSystemAvatarUrl(avatar.id),
  }));

export const getSystemAvatarCatalogForRole = (role) => {
  const priorities = rolePriority[role] ?? ["student", "mentor"];
  const catalog = getSystemAvatarCatalog().filter((avatar) => priorities.includes(avatar.role));
  return catalog.length ? catalog : getSystemAvatarCatalog();
};

export const isSystemAvatarUrl = (value) =>
  typeof value === "string" && (value.startsWith("/avatars/") || /^https?:\/\/[^/]+\/avatars\//.test(value));

export const getSystemAvatarById = (avatarId) => getSystemAvatarCatalog().find((avatar) => avatar.id === avatarId) ?? null;

export const pickSystemAvatar = (role = "student", seed) => {
  const catalog = getSystemAvatarCatalogForRole(role);
  if (catalog.length === 0) {
    throw new Error("No system avatars are configured");
  }

  if (seed) {
    const hash = crypto.createHash("sha256").update(String(seed)).digest();
    const index = hash.readUInt32BE(0) % catalog.length;
    return catalog[index];
  }

  const index = crypto.randomInt(0, catalog.length);
  return catalog[index];
};

export const pickAlternateSystemAvatar = (role = "student", excludeIds = [], seed) => {
  const catalog = getSystemAvatarCatalogForRole(role).filter((avatar) => !excludeIds.includes(avatar.id));
  if (catalog.length === 0) {
    return pickSystemAvatar(role, seed);
  }

  if (seed) {
    const hash = crypto.createHash("sha256").update(`${seed}:backup`).digest();
    const index = hash.readUInt32BE(0) % catalog.length;
    return catalog[index];
  }

  const index = crypto.randomInt(0, catalog.length);
  return catalog[index];
};

export const getFallbackAvatarChain = ({ role = "student", seed, currentAvatarUrl } = {}) => {
  const primary = pickSystemAvatar(role, seed);
  const backup = pickAlternateSystemAvatar(role, [primary.id], `${seed ?? currentAvatarUrl ?? role}`);
  const tertiary = pickAlternateSystemAvatar(role, [primary.id, backup.id], `${seed ?? currentAvatarUrl ?? `${role}:secondary`}`);

  return [primary, backup, tertiary]
    .map((avatar) => avatar.url)
    .filter((url, index, list) => list.indexOf(url) === index);
};

export const createAssignedAvatar = ({ role = "student", seed } = {}) => {
  const avatar = pickSystemAvatar(role, seed);
  return {
    avatarUrl: avatar.url,
    avatarType: "default",
    avatarSource: "system",
    avatarPublicId: null,
  };
};

export const normalizeAvatarUrl = (user) => {
  const url = user.avatarUrl || user.avatar || null;
  if (url) return url;
  return createAssignedAvatar({ role: user.role, seed: user._id?.toString?.() ?? user.email ?? user.fullName }).avatarUrl;
};

export const getCloudinaryPublicIdFromUrl = (url) => {
  if (typeof url !== "string" || !/^https:\/\/res\.cloudinary\.com\//.test(url)) {
    return null;
  }

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  if (!match) return null;
  return decodeURIComponent(match[1]);
};
