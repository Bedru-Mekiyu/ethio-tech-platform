import { api, type ApiResponse } from "./api";
import {
  TRACKS_CATALOG,
  getCatalogTrackByIdOrSlug,
  type TrackCatalogItem,
  type CapstoneProject,
  type CareerOutcome,
  type SkillPrerequisite,
  type CompetencyGroup,
  type ToolingItem,
} from "@/data/tracksCatalog";

export type {
  TrackCatalogItem,
  CapstoneProject,
  CareerOutcome,
  SkillPrerequisite,
  CompetencyGroup,
  ToolingItem,
};

export interface TrackLessonSummary {
  _id: string;
  title: string;
  order?: number;
  xpReward?: number;
  durationMinutes?: number;
  type?: "concept" | "hands-on" | "code-lab" | "project-checkpoint";
  summary?: string;
}

export interface TrackModuleSummary {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  lessons?: TrackLessonSummary[];
}

export interface TrackSummary {
  _id: string;
  id?: string;
  slug?: string;
  title: string;
  shortTitle?: string;
  tagline?: string;
  description?: string;
  category?: string;
  categoryKey?: string;
  difficulty?: string;
  estimatedWeeks?: number;
  liveSessionsCount?: number;
  mentorshipHours?: number;
  totalProjectsCount?: number;
  xpReward?: number;
  featured?: boolean;
  badgeColor?: "cyan" | "purple" | "success" | "warning";
  unsplashId?: string;
  marketDemand?: TrackCatalogItem["marketDemand"];
  targetCareerRoles?: CareerOutcome[];
  prerequisites?: SkillPrerequisite[];
  competencyGroups?: CompetencyGroup[];
  tooling?: ToolingItem[];
  capstones?: CapstoneProject[];
  modules?: TrackModuleSummary[];
}

export interface LessonDetail {
  _id: string;
  title: string;
  content?: string;
  summary?: string;
  type?: "concept" | "hands-on" | "code-lab" | "project-checkpoint";
  videoUrl?: string;
  codeSandboxUrl?: string;
  starterCode?: string;
  challengeTask?: string;
  prerequisites?: string[];
  xpReward?: number;
  module?: string;
  moduleTitle?: string;
  durationMinutes?: number;
  nextLessonId?: string;
  previousLessonId?: string;
  trackId?: string;
  trackTitle?: string;
}

export interface LeaderboardEntry {
  _id?: string;
  fullName: string;
  avatar?: string;
  xp?: number;
  level?: number;
}

export interface MentorLeaderboardEntry {
  _id?: string;
  fullName: string;
  mentorScore?: number;
  totalSessions?: number;
}

export interface PeerGroupLeaderboardEntry {
  _id?: string;
  name: string;
  groupXP?: number;
  members?: number[];
  leader?: { fullName?: string };
}

function mergeCatalogWithBackendTrack(
  backendTrack: TrackSummary,
  catalogItem: TrackCatalogItem
): TrackSummary {
  const backendModules = backendTrack.modules && backendTrack.modules.length > 0 ? backendTrack.modules : undefined;

  return {
    ...catalogItem,
    _id: backendTrack._id || catalogItem.id,
    id: backendTrack._id || catalogItem.id,
    title: backendTrack.title || catalogItem.title,
    description: backendTrack.description || catalogItem.description,
    category: catalogItem.category,
    categoryKey: catalogItem.categoryKey,
    difficulty: backendTrack.difficulty || catalogItem.difficulty,
    xpReward: backendTrack.xpReward || catalogItem.xpReward,
    modules: backendModules ?? catalogItem.modules.map((m) => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        _id: l._id,
        title: l.title,
        order: l.order,
        xpReward: l.xpReward,
        durationMinutes: l.durationMinutes,
        type: l.type,
        summary: l.summary,
      })),
    })),
  };
}

export async function fetchTracks(): Promise<TrackSummary[]> {
  try {
    const { data } = await api.get<
      ApiResponse<{ items: TrackSummary[] } | { tracks: TrackSummary[] }>
    >("/tracks");
    const payload = data.data as { items?: TrackSummary[]; tracks?: TrackSummary[] };
    const items = payload.items ?? payload.tracks ?? [];

    if (!items.length) {
      return TRACKS_CATALOG.map((cat) => ({
        ...cat,
        _id: cat.id,
      }));
    }

    // Match backend items with catalog items, or supplement missing catalog tracks
    const matchedTracks: TrackSummary[] = items.map((track) => {
      const match = getCatalogTrackByIdOrSlug(track._id) || getCatalogTrackByIdOrSlug(track.title) || getCatalogTrackByIdOrSlug(track.category || "");
      if (match) {
        return mergeCatalogWithBackendTrack(track, match);
      }
      const fallbackCat = TRACKS_CATALOG[0];
      return mergeCatalogWithBackendTrack(track, fallbackCat);
    });

    // If backend only has a subset of tracks, include the remaining catalog tracks so the full spectrum is available
    const presentKeys = new Set(matchedTracks.map((t) => t.categoryKey || t.slug || t._id));
    for (const cat of TRACKS_CATALOG) {
      if (!presentKeys.has(cat.categoryKey) && !presentKeys.has(cat.id)) {
        matchedTracks.push({
          ...cat,
          _id: cat.id,
        });
      }
    }

    return matchedTracks;
  } catch {
    // Return complete rich catalog if API is unavailable or offline
    return TRACKS_CATALOG.map((cat) => ({
      ...cat,
      _id: cat.id,
    }));
  }
}

export async function fetchTrackById(trackId: string): Promise<TrackSummary> {
  const catalogMatch = getCatalogTrackByIdOrSlug(trackId);

  try {
    const { data } = await api.get<ApiResponse<{ track: TrackSummary }>>(`/tracks/${trackId}`);
    const backendTrack = (data.data as { track: TrackSummary }).track;

    if (backendTrack) {
      const match = catalogMatch || getCatalogTrackByIdOrSlug(backendTrack.title) || getCatalogTrackByIdOrSlug(backendTrack.category || "") || TRACKS_CATALOG[0];
      return mergeCatalogWithBackendTrack(backendTrack, match);
    }
  } catch {
    // fallback to catalog below
  }

  if (catalogMatch) {
    return {
      ...catalogMatch,
      _id: catalogMatch.id,
    };
  }

  // Fallback to first track if not found
  return {
    ...TRACKS_CATALOG[0],
    _id: TRACKS_CATALOG[0].id,
  };
}

export async function fetchLessonById(lessonId: string): Promise<LessonDetail> {
  try {
    const { data } = await api.get<ApiResponse<{ lesson: LessonDetail }>>(`/lessons/${lessonId}`);
    const backendLesson = (data.data as { lesson: LessonDetail }).lesson;
    if (backendLesson) return backendLesson;
  } catch {
    // fallback to catalog search below
  }

  // Look through catalog for the lesson
  for (const track of TRACKS_CATALOG) {
    for (let mIdx = 0; mIdx < track.modules.length; mIdx++) {
      const mod = track.modules[mIdx];
      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        if (lesson._id === lessonId || lesson.title.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(lessonId.toLowerCase())) {
          const nextLesson = mod.lessons[lIdx + 1] || track.modules[mIdx + 1]?.lessons[0];
          const prevLesson = mod.lessons[lIdx - 1] || track.modules[mIdx - 1]?.lessons[track.modules[mIdx - 1]?.lessons.length - 1];

          return {
            _id: lesson._id,
            title: lesson.title,
            content: lesson.content,
            summary: lesson.summary,
            type: lesson.type,
            starterCode: lesson.starterCode,
            challengeTask: lesson.challengeTask,
            prerequisites: lesson.prerequisites,
            xpReward: lesson.xpReward,
            durationMinutes: lesson.durationMinutes,
            module: mod._id,
            moduleTitle: mod.title,
            nextLessonId: nextLesson?._id,
            previousLessonId: prevLesson?._id,
            trackId: track.id,
            trackTitle: track.title,
          };
        }
      }
    }
  }

  // Default fallback lesson
  const firstTrack = TRACKS_CATALOG[0];
  const firstMod = firstTrack.modules[0];
  const firstLesson = firstMod.lessons[0];
  return {
    _id: lessonId,
    title: firstLesson.title,
    content: firstLesson.content,
    summary: firstLesson.summary,
    type: firstLesson.type,
    starterCode: firstLesson.starterCode,
    challengeTask: firstLesson.challengeTask,
    xpReward: firstLesson.xpReward,
    durationMinutes: firstLesson.durationMinutes,
    module: firstMod._id,
    moduleTitle: firstMod.title,
    nextLessonId: firstMod.lessons[1]?._id,
    trackId: firstTrack.id,
    trackTitle: firstTrack.title,
  };
}

export async function completeLesson(lessonId: string) {
  try {
    const { data } = await api.post<ApiResponse<{ xpAdded?: number }>>(`/lessons/${lessonId}/complete`);
    return data.data;
  } catch {
    return { xpAdded: 75, alreadyCompleted: false };
  }
}

export async function fetchLeaderboard(top = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data } = await api.get<ApiResponse<{ students: LeaderboardEntry[] }>>(
      `/leaderboard/students?top=${top}`
    );
    const payload = data.data as { students?: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] };
    return payload.students ?? payload.leaderboard ?? [];
  } catch {
    return [];
  }
}

export async function fetchMentorLeaderboard(top = 10): Promise<MentorLeaderboardEntry[]> {
  try {
    const { data } = await api.get<ApiResponse<{ mentors: MentorLeaderboardEntry[] }>>(
      `/leaderboard/mentors?top=${top}`
    );
    return (data.data as { mentors?: MentorLeaderboardEntry[] }).mentors ?? [];
  } catch {
    return [];
  }
}

export async function fetchPeerGroupLeaderboard(top = 10): Promise<PeerGroupLeaderboardEntry[]> {
  try {
    const { data } = await api.get<ApiResponse<{ groups: PeerGroupLeaderboardEntry[] }>>(
      `/leaderboard/peer-groups?top=${top}`
    );
    return (data.data as { groups?: PeerGroupLeaderboardEntry[] }).groups ?? [];
  } catch {
    return [];
  }
}

export async function fetchBadges() {
  try {
    const { data } = await api.get<ApiResponse<{ badges: Array<{ _id: string; name: string; description?: string; category?: string; xpRequired?: number }> }>>("/badges");
    return (data.data as { badges?: unknown[] }).badges ?? [];
  } catch {
    return [];
  }
}
