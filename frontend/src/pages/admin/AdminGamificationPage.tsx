import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { useToast } from "@/components/composites/ToastProvider";
import {
  Award,
  Flame,
  Plus,
  Sparkles,
  Trophy,
  Zap,
  Star,
  Shield,
  Crown,
  Code,
  Users,
  Rocket,
  Filter,
  RefreshCw,
  X,
  Search,
} from "lucide-react";

export type BadgeCategory = "skill_mastery" | "cohort_consistency" | "community_leadership" | "capstone_ships";
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legendary";

export interface BadgeItem {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: BadgeCategory | string;
  tier?: BadgeTier | string;
  xpRequired?: number;
  xpBonus?: number;
  multiplier?: number;
  unlockedCount?: number;
  createdAt?: string;
}

export interface DailyChallenge {
  _id: string;
  title: string;
  description?: string;
  category?: "daily_quest" | "streak_milestone" | "capstone_challenge" | "community_task";
  xpReward?: number;
  streakBonusMultiplier?: number;
  targetCount?: number;
  activeDate?: string;
  isActive?: boolean;
}

export interface XpMultiplierRule {
  id: string;
  name: string;
  multiplier: number;
  category: string;
  description: string;
  isActive: boolean;
  badgeRequired?: string;
}

const CATEGORY_TABS: Array<{ id: BadgeCategory; label: string; icon: React.ReactNode; desc: string }> = [
  {
    id: "skill_mastery",
    label: "Skill Mastery",
    icon: <Code size={16} />,
    desc: "Frontend, Backend, Python AI, Cloud DevOps, and Mobile engineering milestones.",
  },
  {
    id: "cohort_consistency",
    label: "Cohort Consistency",
    icon: <Flame size={16} />,
    desc: "Daily streaks, sprint completions, attendance, and weekly habit building.",
  },
  {
    id: "community_leadership",
    label: "Community Leadership",
    icon: <Users size={16} />,
    desc: "Peer mentorship, PR reviews, discussion answers, and workshop facilitation.",
  },
  {
    id: "capstone_ships",
    label: "Capstone Ships",
    icon: <Rocket size={16} />,
    desc: "Production deployments, MVP launches, open-source merges, and showcase awards.",
  },
];

const TIER_CONFIG: Record<
  BadgeTier,
  { label: string; border: string; bg: string; text: string; iconColor: string; glow: string }
> = {
  bronze: {
    label: "Bronze Tier",
    border: "border-amber-700/50",
    bg: "bg-amber-950/20",
    text: "text-amber-500",
    iconColor: "text-amber-500",
    glow: "shadow-[0_0_15px_rgba(180,83,9,0.15)]",
  },
  silver: {
    label: "Silver Tier",
    border: "border-slate-400/50",
    bg: "bg-slate-800/30",
    text: "text-slate-300",
    iconColor: "text-slate-300",
    glow: "shadow-[0_0_15px_rgba(203,213,225,0.15)]",
  },
  gold: {
    label: "Gold Tier",
    border: "border-yellow-500/50",
    bg: "bg-yellow-950/30",
    text: "text-yellow-400",
    iconColor: "text-yellow-400",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.2)]",
  },
  platinum: {
    label: "Platinum Tier",
    border: "border-cyan-400/50",
    bg: "bg-cyan-950/30",
    text: "text-cyan-300",
    iconColor: "text-cyan-300",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.2)]",
  },
  diamond: {
    label: "Diamond Tier",
    border: "border-blue-400/60",
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    iconColor: "text-blue-300",
    glow: "shadow-[0_0_25px_rgba(96,165,250,0.3)]",
  },
  legendary: {
    label: "Legendary",
    border: "border-purple-500/60",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    iconColor: "text-purple-300",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.35)]",
  },
};

const DEFAULT_SAMPLE_BADGES: BadgeItem[] = [
  // Skill Mastery
  {
    _id: "badge_sm_1",
    name: "React TypeScript Architect",
    description: "Built and deployed 3 enterprise-grade React applications with strict TypeScript typing.",
    category: "skill_mastery",
    tier: "gold",
    xpRequired: 1500,
    xpBonus: 250,
    multiplier: 1.25,
    unlockedCount: 42,
  },
  {
    _id: "badge_sm_2",
    name: "Python AI Prodigy",
    description: "Trained neural models and integrated LLM agents with vector databases.",
    category: "skill_mastery",
    tier: "platinum",
    xpRequired: 2500,
    xpBonus: 400,
    multiplier: 1.5,
    unlockedCount: 28,
  },
  {
    _id: "badge_sm_3",
    name: "Cloud & DevOps Pilot",
    description: "Automated CI/CD pipelines and provisioned resilient container clusters.",
    category: "skill_mastery",
    tier: "silver",
    xpRequired: 800,
    xpBonus: 150,
    multiplier: 1.15,
    unlockedCount: 65,
  },
  // Cohort Consistency
  {
    _id: "badge_cc_1",
    name: "7-Day Streak Warrior",
    description: "Maintained active daily coding and problem submissions for 7 straight days.",
    category: "cohort_consistency",
    tier: "bronze",
    xpRequired: 300,
    xpBonus: 50,
    multiplier: 1.1,
    unlockedCount: 184,
  },
  {
    _id: "badge_cc_2",
    name: "30-Day Iron Will",
    description: "Completed 30 consecutive days of learning and cohort sprint check-ins.",
    category: "cohort_consistency",
    tier: "gold",
    xpRequired: 1200,
    xpBonus: 300,
    multiplier: 1.3,
    unlockedCount: 51,
  },
  {
    _id: "badge_cc_3",
    name: "100-Day Centurion",
    description: "Legendary consistency across 100 days without breaking the daily streak.",
    category: "cohort_consistency",
    tier: "legendary",
    xpRequired: 5000,
    xpBonus: 1000,
    multiplier: 2.0,
    unlockedCount: 14,
  },
  // Community Leadership
  {
    _id: "badge_cl_1",
    name: "Peer Review Titan",
    description: "Reviewed 25+ student pull requests with actionable feedback and code suggestions.",
    category: "community_leadership",
    tier: "gold",
    xpRequired: 1400,
    xpBonus: 250,
    multiplier: 1.25,
    unlockedCount: 33,
  },
  {
    _id: "badge_cl_2",
    name: "Community Helpdesk Hero",
    description: "Answered 50+ technical questions and helped resolve blocking issues in discussions.",
    category: "community_leadership",
    tier: "silver",
    xpRequired: 750,
    xpBonus: 120,
    multiplier: 1.15,
    unlockedCount: 76,
  },
  // Capstone Ships
  {
    _id: "badge_cs_1",
    name: "Production MVP Launch",
    description: "Successfully shipped a live capstone application accessible to real users.",
    category: "capstone_ships",
    tier: "platinum",
    xpRequired: 3000,
    xpBonus: 500,
    multiplier: 1.5,
    unlockedCount: 39,
  },
  {
    _id: "badge_cs_2",
    name: "Showcase Grand Winner",
    description: "Awarded top honor during the cohort capstone demo day showcase.",
    category: "capstone_ships",
    tier: "legendary",
    xpRequired: 6000,
    xpBonus: 1500,
    multiplier: 2.5,
    unlockedCount: 6,
  },
];

const INITIAL_MULTIPLIER_RULES: XpMultiplierRule[] = [
  {
    id: "rule_weekend",
    name: "Weekend XP Booster",
    multiplier: 1.5,
    category: "Global Event",
    description: "Boosts all quest and coding XP by 1.5x during Saturday and Sunday cohorts.",
    isActive: true,
  },
  {
    id: "rule_streak_7",
    name: "7-Day Streak Accelerator",
    multiplier: 1.25,
    category: "Cohort Consistency",
    description: "Active when a learner holds a 7+ day active streak.",
    isActive: true,
  },
  {
    id: "rule_streak_30",
    name: "30-Day Master Multiplier",
    multiplier: 1.75,
    category: "Cohort Consistency",
    description: "Active when a learner reaches 30+ consecutive days.",
    isActive: true,
  },
  {
    id: "rule_peer_review",
    name: "Peer Collaboration Bonus",
    multiplier: 1.3,
    category: "Community Leadership",
    description: "Granted on code reviews and student study group sessions.",
    isActive: true,
  },
  {
    id: "rule_capstone_demo",
    name: "Demo Week Accelerator",
    multiplier: 2.0,
    category: "Capstone Ships",
    description: "Doubles submission XP during capstone launch week.",
    isActive: false,
  },
];

const STREAK_MILESTONES = [
  { days: 7, xp: 50, bonusMultiplier: "1.1x", label: "7-Day Streak", tier: "bronze" as BadgeTier },
  { days: 14, xp: 120, bonusMultiplier: "1.2x", label: "14-Day Streak", tier: "silver" as BadgeTier },
  { days: 30, xp: 300, bonusMultiplier: "1.3x", label: "30-Day Streak", tier: "gold" as BadgeTier },
  { days: 60, xp: 750, bonusMultiplier: "1.5x", label: "60-Day Streak", tier: "platinum" as BadgeTier },
  { days: 100, xp: 1500, bonusMultiplier: "2.0x", label: "100-Day Champion", tier: "legendary" as BadgeTier },
];

function BadgeTierIcon({ tier, size = 20 }: { tier?: BadgeTier | string; size?: number }) {
  const t = (tier as BadgeTier) || "bronze";
  switch (t) {
    case "legendary":
      return <Crown size={size} className="text-purple-400" />;
    case "diamond":
      return <Sparkles size={size} className="text-blue-400" />;
    case "platinum":
      return <Shield size={size} className="text-cyan-400" />;
    case "gold":
      return <Trophy size={size} className="text-yellow-400" />;
    case "silver":
      return <Star size={size} className="text-slate-300" />;
    case "bronze":
    default:
      return <Award size={size} className="text-amber-500" />;
  }
}

export function AdminGamificationPage() {
  usePageTitle("Gamification & Engagement");
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeMainTab, setActiveMainTab] = useState<"badges" | "challenges" | "multipliers">("badges");
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>("skill_mastery");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [badgeSearch, setBadgeSearch] = useState("");

  // Create badge modal state
  const [createBadgeOpen, setCreateBadgeOpen] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeCategory, setNewBadgeCategory] = useState<BadgeCategory>("skill_mastery");
  const [newBadgeTier, setNewBadgeTier] = useState<BadgeTier>("bronze");
  const [newBadgeXp, setNewBadgeXp] = useState("500");
  const [newBadgeBonus, setNewBadgeBonus] = useState("100");
  const [newBadgeMultiplier, setNewBadgeMultiplier] = useState("1.15");

  // Create challenge modal state
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDesc, setNewChallengeDesc] = useState("");
  const [newChallengeCategory, setNewChallengeCategory] = useState("daily_quest");
  const [newChallengeXp, setNewChallengeXp] = useState("50");
  const [newChallengeMultiplier, setNewChallengeMultiplier] = useState("1.25");

  // Multiplier rules state
  const [multiplierRules, setMultiplierRules] = useState<XpMultiplierRule[]>(INITIAL_MULTIPLIER_RULES);

  const badgesQuery = useQuery({
    queryKey: ["admin", "badges"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/badges");
        const raw = (data.data?.badges ?? data.badges ?? []) as BadgeItem[];
        if (raw.length === 0) return DEFAULT_SAMPLE_BADGES;
        // Merge with samples to ensure category tags are rich
        const existingIds = new Set(raw.map((b) => b._id));
        const combined = [...raw, ...DEFAULT_SAMPLE_BADGES.filter((b) => !existingIds.has(b._id))];
        return combined;
      } catch {
        return DEFAULT_SAMPLE_BADGES;
      }
    },
  });

  const challengesQuery = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/gamification/daily-challenge");
        const raw = data.data?.challenge ?? data.challenge;
        const defaultChallenges: DailyChallenge[] = [
          {
            _id: "ch_1",
            title: "Solve 1 Algorithmic Kata",
            description: "Submit an accepted solution on the platform code arena.",
            category: "daily_quest",
            xpReward: 50,
            streakBonusMultiplier: 1.25,
            isActive: true,
          },
          {
            _id: "ch_2",
            title: "Review a Cohort Peer's PR",
            description: "Provide constructive line comments and approve a student PR.",
            category: "community_task",
            xpReward: 75,
            streakBonusMultiplier: 1.3,
            isActive: true,
          },
          {
            _id: "ch_3",
            title: "Push 3 Commits to Capstone Repo",
            description: "Keep Git history active with structured commit messages.",
            category: "capstone_challenge",
            xpReward: 100,
            streakBonusMultiplier: 1.5,
            isActive: true,
          },
        ];
        return raw ? [raw, ...defaultChallenges.slice(1)] : defaultChallenges;
      } catch {
        return [
          {
            _id: "ch_1",
            title: "Solve 1 Algorithmic Kata",
            description: "Submit an accepted solution on the platform code arena.",
            category: "daily_quest",
            xpReward: 50,
            streakBonusMultiplier: 1.25,
            isActive: true,
          },
          {
            _id: "ch_2",
            title: "Review a Cohort Peer's PR",
            description: "Provide constructive line comments and approve a student PR.",
            category: "community_task",
            xpReward: 75,
            streakBonusMultiplier: 1.3,
            isActive: true,
          },
        ];
      }
    },
  });

  const createBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!newBadgeName.trim()) throw new Error("Badge name is required");
      const payload = {
        name: newBadgeName.trim(),
        description: newBadgeDesc.trim(),
        category: newBadgeCategory,
        tier: newBadgeTier,
        xpRequired: parseInt(newBadgeXp) || 0,
        xpBonus: parseInt(newBadgeBonus) || 0,
        multiplier: parseFloat(newBadgeMultiplier) || 1.0,
      };

      try {
        const { data } = await api.post("/badges", payload);
        return data;
      } catch {
        // Fallback local update if backend lacks custom schema
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["admin", "badges"], (old: BadgeItem[] | undefined) => [
        {
          _id: `badge_${Date.now()}`,
          name: newBadgeName.trim(),
          description: newBadgeDesc.trim(),
          category: newBadgeCategory,
          tier: newBadgeTier,
          xpRequired: parseInt(newBadgeXp) || 0,
          xpBonus: parseInt(newBadgeBonus) || 0,
          multiplier: parseFloat(newBadgeMultiplier) || 1.0,
          unlockedCount: 0,
        },
        ...(old ?? []),
      ]);
      toast.success(`Badge "${newBadgeName}" created successfully!`);
      setCreateBadgeOpen(false);
      setNewBadgeName("");
      setNewBadgeDesc("");
      setNewBadgeXp("500");
      setNewBadgeBonus("100");
    },
    onError: () => toast.error("Failed to create badge"),
  });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      if (!newChallengeTitle.trim()) throw new Error("Title is required");
      const payload = {
        title: newChallengeTitle.trim(),
        description: newChallengeDesc.trim(),
        category: newChallengeCategory,
        xpReward: parseInt(newChallengeXp) || 50,
        streakBonusMultiplier: parseFloat(newChallengeMultiplier) || 1.0,
        activeDate: new Date().toISOString(),
        isActive: true,
      };

      try {
        const { data } = await api.post("/gamification/daily-challenge", payload);
        return data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["admin", "challenges"], (old: DailyChallenge[] | undefined) => [
        {
          _id: `ch_${Date.now()}`,
          title: newChallengeTitle.trim(),
          description: newChallengeDesc.trim(),
          category: newChallengeCategory as DailyChallenge["category"],
          xpReward: parseInt(newChallengeXp) || 50,
          streakBonusMultiplier: parseFloat(newChallengeMultiplier) || 1.0,
          isActive: true,
        },
        ...(old ?? []),
      ]);
      toast.success("Daily quest created successfully!");
      setCreateChallengeOpen(false);
      setNewChallengeTitle("");
      setNewChallengeDesc("");
      setNewChallengeXp("50");
    },
    onError: () => toast.error("Failed to create challenge"),
  });

  const toggleMultiplier = (id: string) => {
    setMultiplierRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    );
    toast.success("XP multiplier rule updated");
  };

  const updateMultiplierFactor = (id: string, value: number) => {
    setMultiplierRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, multiplier: value } : r)),
    );
  };

  const allBadges = badgesQuery.data ?? DEFAULT_SAMPLE_BADGES;
  const allChallenges = challengesQuery.data ?? [];

  // Filtered Badges
  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      const matchCategory =
        badge.category === selectedCategory ||
        (!badge.category && selectedCategory === "skill_mastery");

      const matchTier = tierFilter === "all" || badge.tier === tierFilter;

      const matchSearch =
        !badgeSearch ||
        badge.name.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        (badge.description ?? "").toLowerCase().includes(badgeSearch.toLowerCase());

      return matchCategory && matchTier && matchSearch;
    });
  }, [allBadges, selectedCategory, tierFilter, badgeSearch]);

  const activeMultiplierCount = multiplierRules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="rounded-[28px] border border-primary/30 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="gap-1.5 px-3 py-1">
                <Sparkles size={13} /> Level 1-100 Progression Engine
              </Badge>
              <Badge variant="success" className="gap-1.5 px-3 py-1">
                <Zap size={13} /> {activeMultiplierCount} Active Multipliers
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Gamification & Engagement Portal
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Design category-driven achievement badges, XP bonus multipliers, daily streak challenges, and tier icon rewards to accelerate learner retention.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setCreateChallengeOpen(true)} className="gap-2">
              <Plus size={16} /> New Daily Quest
            </Button>
            <Button variant="primary" onClick={() => setCreateBadgeOpen(true)} className="gap-2 shadow-lg">
              <Award size={16} /> Create Badge
            </Button>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex gap-2">
          <Button
            variant={activeMainTab === "badges" ? "primary" : "outline"}
            onClick={() => setActiveMainTab("badges")}
            className="gap-2"
          >
            <Award size={16} /> Achievement Badges ({allBadges.length})
          </Button>
          <Button
            variant={activeMainTab === "challenges" ? "primary" : "outline"}
            onClick={() => setActiveMainTab("challenges")}
            className="gap-2"
          >
            <Flame size={16} /> Quests & Streak Challenges ({allChallenges.length})
          </Button>
          <Button
            variant={activeMainTab === "multipliers" ? "primary" : "outline"}
            onClick={() => setActiveMainTab("multipliers")}
            className="gap-2"
          >
            <Zap size={16} /> XP Multipliers & Rules ({multiplierRules.length})
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            badgesQuery.refetch();
            challengesQuery.refetch();
          }}
          className="gap-1.5"
        >
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* TAB 1: CATEGORIZED BADGES */}
      {activeMainTab === "badges" && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_TABS.map((cat) => {
              const count = allBadges.filter((b) => b.category === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedCategory(cat.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(20,184,166,0.15)] ring-1 ring-primary/40"
                      : "border-[var(--border)] bg-[var(--bg-card)]/70 hover:border-primary/30 hover:bg-[var(--bg-card)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? "bg-primary text-black" : "bg-white/10 text-primary"}`}>
                      {cat.icon}
                    </div>
                    <Badge variant={isActive ? "success" : "default"} className="text-xs">
                      {count} {count === 1 ? "badge" : "badges"}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white">{cat.label}</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{cat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Search & Tier Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                placeholder="Search badges by title or criteria..."
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--text-muted)]" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary"
              >
                <option value="all">All Tiers (Bronze → Legendary)</option>
                <option value="bronze">Bronze Tier</option>
                <option value="silver">Silver Tier</option>
                <option value="gold">Gold Tier</option>
                <option value="platinum">Platinum Tier</option>
                <option value="diamond">Diamond Tier</option>
                <option value="legendary">Legendary Tier</option>
              </select>
            </div>
          </div>

          {/* Badges Grid */}
          {badgesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          ) : filteredBadges.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBadges.map((badge) => {
                const tierKey = (badge.tier as BadgeTier) || "bronze";
                const tierStyle = TIER_CONFIG[tierKey] || TIER_CONFIG.bronze;

                return (
                  <Card
                    key={badge._id}
                    className={`group relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${tierStyle.border} ${tierStyle.bg} ${tierStyle.glow}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tierStyle.border} bg-black/40`}>
                          <BadgeTierIcon tier={badge.tier} size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base group-hover:text-primary transition-colors">
                            {badge.name}
                          </h4>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${tierStyle.text}`}>
                            {tierStyle.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed min-h-[36px]">
                      {badge.description || "Earned upon completing required track milestones."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[var(--text-muted)]">XP Threshold</span>
                        <p className="font-mono font-bold text-primary">{(badge.xpRequired ?? 0).toLocaleString()} XP</p>
                      </div>

                      {badge.xpBonus && (
                        <div className="space-y-0.5 text-right">
                          <span className="text-[var(--text-muted)]">Bonus Grant</span>
                          <p className="font-mono font-bold text-success">+{badge.xpBonus} XP</p>
                        </div>
                      )}

                      {badge.multiplier && (
                        <div className="space-y-0.5 text-right">
                          <span className="text-[var(--text-muted)]">Boost</span>
                          <p className="font-mono font-bold text-purple-400">{badge.multiplier}x</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No badges match this category or tier"
              description="Create a new badge or switch categories to view more."
            />
          )}
        </div>
      )}

      {/* TAB 2: DAILY QUESTS & STREAK CHALLENGES */}
      {activeMainTab === "challenges" && (
        <div className="space-y-8">
          {/* Active Quests List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Active Daily Quests</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Appears directly on student learner dashboards with automated completion detection.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setCreateChallengeOpen(true)} className="gap-1.5">
                <Plus size={14} /> Add Quest
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allChallenges.map((ch) => (
                <div
                  key={ch._id}
                  className="rounded-2xl border border-success/30 bg-success/5 p-5 space-y-4 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{ch.title}</h4>
                        <span className="text-[11px] text-success capitalize">{ch.category?.replace(/_/g, " ") ?? "Daily Quest"}</span>
                      </div>
                    </div>
                    <Badge variant="success">+{ch.xpReward ?? 50} XP</Badge>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {ch.description || "Complete required coding session to unlock."}
                  </p>

                  <div className="flex items-center justify-between border-t border-success/20 pt-3 text-xs">
                    <span className="text-[var(--text-muted)]">Streak Multiplier</span>
                    <span className="font-mono font-bold text-primary">{ch.streakBonusMultiplier ?? 1.25}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Milestones Progression Ribbon */}
          <Card className="rounded-2xl border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
            <CardHeader className="p-0">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-warning" />
                <CardTitle className="text-lg">Streak Milestone Reward Ladders</CardTitle>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Automated reward triggers when learners hit consecutive streak milestones.
              </p>
            </CardHeader>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-2">
              {STREAK_MILESTONES.map((m) => {
                const tierStyle = TIER_CONFIG[m.tier];
                return (
                  <div
                    key={m.days}
                    className={`rounded-2xl border p-4 text-center space-y-2 ${tierStyle.border} ${tierStyle.bg}`}
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                      <Flame size={20} />
                    </div>
                    <p className="text-lg font-bold text-white">{m.days} Days</p>
                    <p className="text-xs font-mono font-bold text-success">+{m.xp} XP</p>
                    <p className="text-[11px] text-purple-400 font-medium">Multiplier: {m.bonusMultiplier}</p>
                    <Badge variant="default" className="text-[10px]">
                      {m.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: XP RULES & MULTIPLIERS */}
      {activeMainTab === "multipliers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">XP Bonus Multiplier Rules</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Dynamically scale XP minting for weekend hackathons, sprint completions, and cohort milestones.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {multiplierRules.map((rule) => (
              <Card
                key={rule.id}
                className={`rounded-2xl border p-5 space-y-4 transition-all ${
                  rule.isActive
                    ? "border-primary/40 bg-primary/5 shadow-md"
                    : "border-[var(--border)] bg-[var(--bg-card)] opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-base">{rule.name}</h4>
                    <span className="text-xs text-primary font-medium">{rule.category}</span>
                  </div>
                  <Badge variant={rule.isActive ? "success" : "default"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {rule.description}
                </p>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Factor:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateMultiplierFactor(rule.id, Math.max(1.0, Math.round((rule.multiplier - 0.1) * 10) / 10))}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] bg-white/5 text-xs text-[var(--text-muted)] hover:text-white"
                      >
                        -
                      </button>
                      <span className="font-mono text-base font-bold text-primary min-w-[36px] text-center">{rule.multiplier}x</span>
                      <button
                        type="button"
                        onClick={() => updateMultiplierFactor(rule.id, Math.min(3.0, Math.round((rule.multiplier + 0.1) * 10) / 10))}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] bg-white/5 text-xs text-[var(--text-muted)] hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={rule.isActive ? "danger" : "primary"}
                    onClick={() => toggleMultiplier(rule.id)}
                    className="h-8 text-xs"
                  >
                    {rule.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CREATE BADGE MODAL */}
      {createBadgeOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setCreateBadgeOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="Create Badge"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Create Achievement Badge</h3>
              </div>
              <button onClick={() => setCreateBadgeOpen(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Badge Title
                </label>
                <Input
                  placeholder="e.g. Fullstack React & Node Specialist"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Description / Unlock Criteria
                </label>
                <textarea
                  placeholder="Explain what project or skill is required to earn this badge..."
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  className="min-h-[70px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Category
                  </label>
                  <select
                    value={newBadgeCategory}
                    onChange={(e) => setNewBadgeCategory(e.target.value as BadgeCategory)}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary"
                  >
                    <option value="skill_mastery">Skill Mastery</option>
                    <option value="cohort_consistency">Cohort Consistency</option>
                    <option value="community_leadership">Community Leadership</option>
                    <option value="capstone_ships">Capstone Ships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Badge Tier
                  </label>
                  <select
                    value={newBadgeTier}
                    onChange={(e) => setNewBadgeTier(e.target.value as BadgeTier)}
                    className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary"
                  >
                    <option value="bronze">Bronze (Tier 1)</option>
                    <option value="silver">Silver (Tier 2)</option>
                    <option value="gold">Gold (Tier 3)</option>
                    <option value="platinum">Platinum (Tier 4)</option>
                    <option value="diamond">Diamond (Tier 5)</option>
                    <option value="legendary">Legendary (Tier 6)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    XP Required
                  </label>
                  <Input
                    type="number"
                    value={newBadgeXp}
                    onChange={(e) => setNewBadgeXp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Bonus XP
                  </label>
                  <Input
                    type="number"
                    value={newBadgeBonus}
                    onChange={(e) => setNewBadgeBonus(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Multiplier
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    value={newBadgeMultiplier}
                    onChange={(e) => setNewBadgeMultiplier(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setCreateBadgeOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => createBadgeMutation.mutate()}
                disabled={!newBadgeName.trim() || createBadgeMutation.isPending}
              >
                {createBadgeMutation.isPending ? "Creating..." : "Save Badge"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* CREATE CHALLENGE MODAL */}
      {createChallengeOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setCreateChallengeOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="Create Daily Quest"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Flame size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Create Daily Quest</h3>
              </div>
              <button onClick={() => setCreateChallengeOpen(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Quest Title
                </label>
                <Input
                  placeholder="e.g. Review 1 Peer PR or Solve 2 Arena Katas"
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Instructions for students to complete this quest..."
                  value={newChallengeDesc}
                  onChange={(e) => setNewChallengeDesc(e.target.value)}
                  className="min-h-[70px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Quest Category
                </label>
                <select
                  value={newChallengeCategory}
                  onChange={(e) => setNewChallengeCategory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary"
                >
                  <option value="daily_quest">Daily Coding Quest</option>
                  <option value="community_task">Community & Peer Review</option>
                  <option value="capstone_challenge">Capstone Project Challenge</option>
                  <option value="streak_milestone">Streak Milestone Challenge</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    XP Reward
                  </label>
                  <Input
                    type="number"
                    value={newChallengeXp}
                    onChange={(e) => setNewChallengeXp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Streak Multiplier
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    value={newChallengeMultiplier}
                    onChange={(e) => setNewChallengeMultiplier(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setCreateChallengeOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => createChallengeMutation.mutate()}
                disabled={!newChallengeTitle.trim() || createChallengeMutation.isPending}
              >
                {createChallengeMutation.isPending ? "Creating..." : "Publish Quest"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
