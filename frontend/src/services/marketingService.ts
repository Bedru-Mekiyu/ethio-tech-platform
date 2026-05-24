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

export async function fetchMarketingHome() {
  const { data } = await api.get<ApiResponse<MarketingHomeData>>("/marketing/home");
  return data.data;
}
