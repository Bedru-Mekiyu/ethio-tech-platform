import { api, type ApiResponse } from "./api";

export interface MarketingTrack {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  xpReward?: number;
  moduleCount?: number;
}

export interface MarketingMentor {
  _id: string;
  fullName: string;
  avatar?: string;
  mentorScore?: number;
  totalSessions?: number;
  expertise?: string[];
  currentCompany?: string;
}

export interface MarketingLearner {
  _id: string;
  fullName: string;
  avatar?: string;
  xp?: number;
  level?: number;
  gradeLevel?: number;
}

export interface MarketingHomeData {
  stats: {
    activeLearners: number;
    mentorNetwork: number;
    trackCount: number;
    approvalRate: number;
  };
  hero: {
    activeLearners: number;
    topLearnerXp: number;
    topMentorScore: number;
    topMentorName: string;
  };
  featuredTracks: MarketingTrack[];
  featuredMentors: MarketingMentor[];
  featuredLearners: MarketingLearner[];
  compact: {
    activeLearners: string;
    mentorNetwork: string;
    trackCount: string;
  };
}

export interface MarketingAboutData {
  stats: MarketingHomeData["stats"] & { compact: MarketingHomeData["compact"] };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
  };
  mission: {
    title: string;
    description: string;
  };
  vision: {
    title: string;
    description: string;
  };
  bridge: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
  };
  roadmap: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  cta: {
    title: string;
    description: string;
    primary: { to: string; label: string };
    secondary: { to: string; label: string };
    tertiary: { to: string; label: string };
  };
}

export interface MarketingMentorPageMentor {
  _id: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  currentCompany?: string;
  mentorScore?: number;
  totalSessions?: number;
  expertise?: string[];
  isVerified?: boolean;
}

export interface MarketingMentorPageData {
  stats: {
    totalMentors: number;
    verifiedMentors: number;
    totalSessions: number;
    averageScore: number;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
  };
  featuredMentors: MarketingMentorPageMentor[];
  discoverMentors: MarketingMentorPageMentor[];
  filters: Array<{ label: string; value: string; count: number }>;
  focusAreas: Array<{ label: string; count: number }>;
  cta: {
    title: string;
    description: string;
    primary: { to: string; label: string };
    secondary: { to: string; label: string };
  };
}

export interface MarketingHub {
  _id: string;
  city: string;
  address: string;
  capacity: number;
  computersAvailable: number;
  mentorInCharge?: { fullName: string; avatar?: string } | null;
  visits: number;
  rank: number;
}

export interface MarketingHubsData {
  stats: {
    hubCount: number;
    totalSeats: number;
    availableSeats: number;
    activeMentors: number;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
  };
  hubs: MarketingHub[];
  legend: Array<{ label: string; tone: "primary" | "purple" | "warning" }>;
  cta: {
    title: string;
    description: string;
    primary: { to: string; label: string };
    secondary: { to: string; label: string };
  };
}

export interface MentorApplicationPayload {
  fullName: string;
  email: string;
  currentRole: string;
  currentCompany?: string;
  location?: string;
  yearsExperience?: number;
  expertise: string[];
  availability?: "weeknights" | "weekends" | "flexible" | "ad-hoc";
  mentoringStyle: Array<"live-sessions" | "project-reviews" | "office-hours" | "cohort-support">;
  whyMentor: string;
  linkedin?: string;
  portfolio?: string;
  consent: true;
}

export async function fetchMarketingHome() {
  const { data } = await api.get<ApiResponse<MarketingHomeData>>("/marketing/home");
  return data.data;
}

export async function fetchMarketingAbout() {
  const { data } = await api.get<ApiResponse<MarketingAboutData>>("/marketing/about");
  return data.data;
}

export async function fetchMarketingMentors() {
  const { data } = await api.get<ApiResponse<MarketingMentorPageData>>("/marketing/mentors");
  return data.data;
}

export async function fetchMarketingHubs() {
  const { data } = await api.get<ApiResponse<MarketingHubsData>>("/marketing/hubs");
  return data.data;
}

export async function submitMentorApplication(payload: MentorApplicationPayload) {
  const { data } = await api.post<ApiResponse<{ application: { _id: string; status: string } }>>(
    "/mentor-applications",
    payload
  );
  return data.data;
}
