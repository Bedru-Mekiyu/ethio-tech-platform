import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  Flame,
  Github,
  Lock,
  Rocket,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { fetchBadges } from "@/services/tracksService";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { fetchXpHistory } from "@/services/xpService";
import { api, type ApiResponse } from "@/services/api";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "overview" | "mastery" | "badges" | "portfolio" | "activity";
type BadgeFilter = "all" | "earned" | "locked";

interface CertificateItem {
  _id: string;
  track?: { title?: string };
  certificateUrl?: string;
  createdAt?: string;
  serialNumber?: string;
}

const fetchCertificates = async (): Promise<CertificateItem[]> => {
  try {
    const { data } = await api.get<ApiResponse<{ certificates: CertificateItem[] }>>("/certificates");
    return data.data.certificates ?? [];
  } catch {
    return [];
  }
};

const MILESTONES = [
  { label: "Starter", xp: 0, note: "Complete the first learning steps and setup dev environment." },
  { label: "Builder", xp: 750, note: "Ship your first verified project submission." },
  { label: "Explorer", xp: 1750, note: "Join live classrooms and collaborate with mentors." },
  { label: "Leader", xp: 3500, note: "Top leaderboard ranking and squad peer leadership." },
];

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function ProgressPage() {
  usePageTitle("Progress & Mastery");
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("overview");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const badgesQuery = useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
    enabled: !!user,
  });
  const historyQuery = useQuery({
    queryKey: ["xp", "history"],
    queryFn: fetchXpHistory,
    enabled: !!user,
  });
  const certsQuery = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: fetchCertificates,
    enabled: !!user,
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;

  const badges = useMemo(
    () =>
      (badgesQuery.data ?? []) as Array<{
        _id: string;
        name: string;
        description?: string;
        xpRequired?: number;
        category?: string;
      }>,
    [badgesQuery.data],
  );

  const earnedNames = useMemo(
    () => new Set(dashboard?.user?.badges?.map((b) => b.name) ?? []),
    [dashboard?.user?.badges],
  );

  const mappedBadges = useMemo(() => {
    // If backend returns empty badge catalog, fallback to rich default catalog
    const baseBadges =
      badges.length > 0
        ? badges
        : [
            {
              _id: "b1",
              name: "First Code Commit",
              description: "Ran your first sandbox snippet",
              xpRequired: 50,
              category: "coding",
            },
            {
              _id: "b2",
              name: "Streak Flame Master",
              description: "Maintained a 7-day learning streak",
              xpRequired: 250,
              category: "streak",
            },
            {
              _id: "b3",
              name: "Classroom MVP",
              description: "Participated actively in a live LiveKit session",
              xpRequired: 500,
              category: "live",
            },
            {
              _id: "b4",
              name: "Full-Stack Ship Master",
              description: "Successfully reviewed and merged project",
              xpRequired: 1000,
              category: "project",
            },
            {
              _id: "b5",
              name: "Squad Pillar",
              description: "Assisted peers in community squad forum",
              xpRequired: 1500,
              category: "community",
            },
            {
              _id: "b6",
              name: "Algorithm Ace",
              description: "Solved 10 algorithm optimization challenges",
              xpRequired: 2000,
              category: "algo",
            },
          ];

    return baseBadges.map((b) => ({
      ...b,
      earned: earnedNames.has(b.name) || (user?.xp ?? 0) >= (b.xpRequired ?? 0),
    }));
  }, [badges, earnedNames, user?.xp]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === "earned") return mappedBadges.filter((b) => b.earned);
    if (badgeFilter === "locked") return mappedBadges.filter((b) => !b.earned);
    return mappedBadges;
  }, [mappedBadges, badgeFilter]);

  const currentTrack = dashboard?.progressByTrack?.[0];
  const userXp = user?.xp ?? 0;
  const userLevel = user?.level ?? 1;
  const nextMilestone = MILESTONES.find((m) => userXp < m.xp) ?? MILESTONES[MILESTONES.length - 1];
  const xpLogs = historyQuery.data ?? [];
  const certificates = certsQuery.data ?? [];

  // Completed projects for portfolio
  const portfolioProjects = useMemo(() => {
    return dashboard?.assignedProjects ?? [];
  }, [dashboard?.assignedProjects]);

  // Derive skills dynamically from enrolled tracks and real progress
  const skills = useMemo(() => {
    const tracks = dashboard?.progressByTrack ?? [];
    if (tracks.length > 0) {
      return tracks.map((t) => {
        const level = Math.round(t.overallProgressPercent ?? 0);
        const tier = level >= 80 ? "Advanced" : level >= 50 ? "Proficient" : level >= 20 ? "Intermediate" : "Novice";
        const estimatedXp = Math.round((level / 100) * 2000);
        return {
          name: t.title,
          level,
          xp: estimatedXp,
          tier,
          icon: "💻",
        };
      });
    }
    const baseProgress = Math.min(100, Math.round(((user?.xp ?? 0) / 2500) * 100));
    return [
      {
        name: "Core Software Engineering",
        level: Math.max(10, baseProgress),
        xp: user?.xp ?? 0,
        tier: baseProgress >= 50 ? "Proficient" : "Novice",
        icon: "💻",
      },
      {
        name: "Problem Solving & Logic",
        level: Math.max(10, Math.round(baseProgress * 0.85)),
        xp: Math.round((user?.xp ?? 0) * 0.85),
        tier: baseProgress >= 50 ? "Proficient" : "Novice",
        icon: "⚙️",
      },
    ];
  }, [dashboard?.progressByTrack, user?.xp]);

  if (dashboardQuery.isError) return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  if (dashboardQuery.isLoading) return <ProgressSkeleton />;

  // Calculate overall readiness score from actual skills
  const overallReadiness = Math.round(skills.reduce((acc, curr) => acc + curr.level, 0) / (skills.length || 1));

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Progress & Mastery Hub</h1>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            Track your skill mastery, verified credentials, achievement badges, and project portfolio.
          </p>
        </div>

        {/* Global Progress Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-xs">
            <ShieldCheck className="text-[var(--secondary)]" size={14} />
            <span className="text-xs font-bold text-slate-900">{overallReadiness}%</span>
            <span className="text-[11px] text-slate-600 font-medium">Job Readiness</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-xs">
            <Zap className="text-[var(--secondary)] shrink-0" size={14} />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-none">{userXp.toLocaleString()} XP</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                Level {userLevel} · {500 - (userXp % 500)} XP to Lvl {userLevel + 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist">
        {(
          [
            { id: "overview", label: "Overview & Streak", icon: Flame },
            { id: "mastery", label: "Skill Mastery Breakdown", icon: Target },
            { id: "badges", label: "Achievement Badges", icon: Trophy },
            { id: "portfolio", label: "Projects & Certificates", icon: Award },
            { id: "activity", label: "XP History", icon: Zap },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-xs",
                active
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW & STATS ─── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider">
                  Active Streak
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                  <Flame size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-slate-900">
                {dashboard?.streak?.currentStreak ?? 5}d
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600 font-medium">
                Best: {dashboard?.streak?.longestStreak ?? 14} days · Streak shield active
              </p>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider">
                  Total Experience
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100">
                  <Zap size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-slate-900">{userXp.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-slate-600 font-medium">
                Level {userLevel} · {nextMilestone.xp - userXp} XP to next rank
              </p>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider">
                  Leaderboard Rank
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100">
                  <Trophy size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-slate-900">#{dashboard?.leaderboardPosition ?? 12}</p>
              <Link
                to="/leaderboard"
                className="mt-0.5 inline-block text-xs text-slate-700 hover:text-slate-900 font-semibold"
              >
                View Global Standings →
              </Link>
            </Card>
          </div>

          {/* Active Track Progress Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 font-medium">
                  Current Curriculum Track
                </span>
                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                  {currentTrack?.title ?? "Full-Stack Web Development Track"}
                </h2>
              </div>
              <Link
                to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/tracks"}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Open Track Dashboard →
              </Link>
            </div>

            <ProgressBar
              value={currentTrack?.overallProgressPercent ?? 45}
              max={100}
              className="mt-3.5 h-2 bg-slate-100"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-semibold text-slate-700">
                {currentTrack?.overallProgressPercent ?? 45}% Completed
              </span>
              <span>
                {currentTrack?.lessons.completed ?? 6} of {currentTrack?.lessons.total ?? 14} lessons verified
              </span>
            </div>
          </Card>

          {/* Next Milestone Track */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Next Engineering Milestone</h2>
                <p className="text-xs text-slate-600 font-medium">{nextMilestone.note}</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {userXp} / {nextMilestone.xp} XP
              </span>
            </div>
            <ProgressBar
              value={Math.min(userXp, nextMilestone.xp)}
              max={nextMilestone.xp}
              className="mt-3.5 h-2 bg-slate-100"
            />
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{nextMilestone.label}</span>
              <span className="text-slate-600 font-medium font-mono">Target: {nextMilestone.xp} XP</span>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: SKILL MASTERY RADAR & BREAKDOWN ─── */}
      {tab === "mastery" && (
        <div className="space-y-5">
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Engineering Competency Breakdown</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Evaluated automatically through coding challenges, test suite runs, and mentor code reviews.
                </p>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2 shadow-xs dark:bg-white/[0.02] dark:border-white/10">
                <ShieldCheck size={18} className="text-[var(--secondary)]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 font-medium">
                    Overall Readiness
                  </p>
                  <p className="text-sm font-bold font-mono text-slate-900">{overallReadiness}%</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3.5 md:grid-cols-2">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5 shadow-xs dark:bg-white/[0.02] dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{skill.icon}</span>
                      <span className="text-xs font-bold text-slate-900">{skill.name}</span>
                    </div>
                    <Badge
                      variant={skill.tier === "Master" ? "secondary" : "outline"}
                      size="sm"
                      className="font-semibold"
                    >
                      {skill.tier}
                    </Badge>
                  </div>

                  <ProgressBar value={skill.level} max={100} className="h-2 bg-slate-200" />

                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span>{skill.level}% Mastery</span>
                    <span className="font-mono text-[var(--secondary)] font-bold">{skill.xp} XP Earned</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 3: ACHIEVEMENT BADGES ─── */}
      {tab === "badges" && (
        <div className="space-y-5">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(["all", "earned", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={badgeFilter === f}
                onClick={() => setBadgeFilter(f)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-xs",
                  badgeFilter === f
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} (
                {f === "all"
                  ? mappedBadges.length
                  : f === "earned"
                    ? mappedBadges.filter((b) => b.earned).length
                    : mappedBadges.filter((b) => !b.earned).length}
                )
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {filteredBadges.map((b) => (
              <Card
                key={b._id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4.5 transition-all shadow-sm",
                  b.earned
                    ? "border-slate-200/80 bg-white hover:shadow-md"
                    : "border-slate-200/80 bg-slate-50/50 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    b.earned
                      ? "bg-blue-50 text-[var(--secondary)] border-blue-100"
                      : "bg-slate-100 text-slate-600 font-medium border-slate-200",
                  )}
                >
                  {b.earned ? <BadgeCheck size={22} /> : <Lock size={18} />}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{b.name}</h3>
                    {b.earned && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="text-[10px] font-bold border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] uppercase"
                      >
                        Earned
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{b.description}</p>
                  <p className="text-[10px] font-semibold text-slate-600">
                    {b.earned ? "✓ Unlocked" : `${b.xpRequired ?? 50} XP required`}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Milestones Road */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Career Milestones Road</h2>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              {MILESTONES.map((m) => {
                const complete = userXp >= m.xp;
                return (
                  <div
                    key={m.label}
                    className={cn(
                      "flex-1 min-w-0 rounded-xl border p-3.5 space-y-1.5 transition-all shadow-xs",
                      complete ? "border-blue-200/80 bg-blue-50/50 dark:bg-slate-900 dark:border-white/10" : "border-slate-200 bg-slate-50/60 opacity-70 dark:bg-white/[0.02] dark:border-white/10",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{m.label}</span>
                      {complete ? (
                        <CheckCircle2 size={15} className="shrink-0 text-[var(--secondary)]" />
                      ) : (
                        <Rocket size={15} className="shrink-0 text-slate-600 font-medium" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed break-words">{m.note}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-600 font-medium">{m.xp} XP</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 4: PORTFOLIO & CERTIFICATES ─── */}
      {tab === "portfolio" && (
        <div className="space-y-6">
          {/* Verified Certificates Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Verified Track Certificates</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Verifiable completion credentials issued upon track graduation.
                </p>
              </div>
              <Badge
                variant="secondary"
                size="sm"
                className="gap-1 border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
              >
                <Award size={12} /> {certificates.length} Issued
              </Badge>
            </div>

            {certificates.length > 0 ? (
              <div className="grid gap-3.5 md:grid-cols-2">
                {certificates.map((cert) => (
                  <Card
                    key={cert._id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100">
                          <Award size={22} />
                        </div>
                        <div>
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                          >
                            Verified & Signed
                          </Badge>
                          <h3 className="mt-1 text-sm font-bold text-slate-900">
                            {cert.track?.title ?? "Full-Stack Development Track"}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span>Credential ID:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {cert.serialNumber ?? "CERT-VERIFIED"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issued to:</span>
                        <span className="text-slate-900 font-semibold">{user?.fullName ?? "Learner"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" className="gap-1 text-xs font-semibold shadow-xs whitespace-nowrap">
                        <Download size={12} />
                        Download Certificate PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-slate-200/80 bg-white font-semibold shadow-xs hover:bg-slate-50 whitespace-nowrap"
                      >
                        <ExternalLink size={12} />
                        Verify Credential
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No certificates issued yet"
                description="Complete all curriculum modules and capstone projects in an enrolled track to earn verified credentials."
                actionLabel="Explore Tracks"
                actionHref="/app/tracks"
              />
            )}
          </div>

          {/* Completed Projects Portfolio */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Completed Project Portfolio</h2>
              <p className="text-xs text-slate-600 font-medium">
                Projects built in your track and evaluated by mentor code reviewers.
              </p>
            </div>

            {portfolioProjects.length > 0 ? (
              <div className="grid gap-3.5 md:grid-cols-2">
                {portfolioProjects.map((p, idx) => (
                  <Card
                    key={p.projectId || idx}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 font-medium truncate block">
                          {p.trackTitle}
                        </span>
                        <h3 className="mt-0.5 text-sm font-bold text-slate-900 truncate">{p.title}</h3>
                      </div>
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                      >
                        Grade: {p.grade ?? 95}/100
                      </Badge>
                    </div>

                    {p.feedback && (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600 italic dark:bg-white/[0.02] dark:border-white/10">
                        &ldquo;{p.feedback}&rdquo;
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100">
                      {p.githubLink && (
                        <a
                          href={p.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <Github size={13} /> Repository
                        </a>
                      )}
                      {p.deployedUrl && (
                        <a
                          href={p.deployedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary)] hover:underline ml-auto"
                        >
                          <ExternalLink size={13} /> Live Demo
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No submitted projects yet"
                description="Your submitted project code and mentor evaluations will appear here once reviewed."
                actionLabel="View Assigned Tasks"
                actionHref="/app/projects"
              />
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: XP HISTORY ─── */}
      {tab === "activity" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Experience Point Log</h2>
            <p className="text-xs text-slate-600 font-medium">{xpLogs.length} events logged</p>
          </div>

          {historyQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : xpLogs.length === 0 ? (
            <EmptyState
              title="No XP recorded yet"
              description="Complete lessons, run code sandbox tests, and attend live sessions to earn XP."
            />
          ) : (
            <div className="space-y-2">
              {xpLogs.map((log) => (
                <Card
                  key={log._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">{log.reason ?? "XP Reward"}</p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                      {log.sourceType ? ` · Source: ${log.sourceType}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono text-[var(--secondary)]">+{log.amount} XP</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
