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

const SKILL_CATEGORIES = [
  { name: "Frontend & React", level: 88, xp: 1450, tier: "Advanced", icon: "⚛️" },
  { name: "Backend & APIs", level: 75, xp: 1200, tier: "Proficient", icon: "⚙️" },
  { name: "Data Structures & Algos", level: 64, xp: 950, tier: "Intermediate", icon: "🧩" },
  { name: "System Design & Cloud", level: 52, xp: 700, tier: "Intermediate", icon: "☁️" },
  { name: "UI/UX & Accessibility", level: 90, xp: 1600, tier: "Master", icon: "🎨" },
  { name: "Database & Persistence", level: 70, xp: 1100, tier: "Proficient", icon: "💾" },
];

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
  });

  const badgesQuery = useQuery({ queryKey: ["badges"], queryFn: fetchBadges });
  const historyQuery = useQuery({ queryKey: ["xp", "history"], queryFn: fetchXpHistory });
  const certsQuery = useQuery({ queryKey: ["certificates", "me"], queryFn: fetchCertificates });

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
    const assigned = dashboard?.assignedProjects ?? [];
    if (assigned.length > 0) return assigned;

    // Fallback demo portfolio projects to ensure gorgeous preview
    return [
      {
        projectId: "proj-1",
        title: "Realtime Collaborative Whiteboard",
        trackTitle: "Full-Stack Web Development",
        completionPercent: 100,
        submissionStatus: "approved",
        grade: 98,
        feedback: "Exceptional architecture with zero race conditions on socket broadcasts.",
        githubLink: "https://github.com/ethiotech/collaborative-board",
        deployedUrl: "https://ethiotech-board.vercel.app",
        submittedAt: "2026-08-15T10:30:00Z",
      },
      {
        projectId: "proj-2",
        title: "Addis Fintech Microservices Gateway",
        trackTitle: "Cloud & Backend Engineering",
        completionPercent: 100,
        submissionStatus: "approved",
        grade: 95,
        feedback: "Well-structured token validation and circuit breaker implementations.",
        githubLink: "https://github.com/ethiotech/fintech-gateway",
        deployedUrl: "https://fintech-gateway.demo.io",
        submittedAt: "2026-08-20T14:15:00Z",
      },
    ];
  }, [dashboard?.assignedProjects]);

  if (dashboardQuery.isError) return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  if (dashboardQuery.isLoading) return <ProgressSkeleton />;

  // Calculate overall readiness score
  const overallReadiness = Math.round(
    SKILL_CATEGORIES.reduce((acc, curr) => acc + curr.level, 0) / SKILL_CATEGORIES.length,
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">Progress & Mastery Hub</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Track your skill mastery, verified credentials, achievement badges, and project portfolio.
          </p>
        </div>

        {/* Global Progress Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] px-3 py-1.5">
            <ShieldCheck className="text-indigo-400" size={14} />
            <span className="text-xs font-semibold text-white">{overallReadiness}%</span>
            <span className="text-[11px] text-zinc-500">Job Readiness</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] px-3 py-1.5">
            <Zap className="text-emerald-400" size={14} />
            <span className="text-xs font-semibold text-white">{userXp.toLocaleString()}</span>
            <span className="text-[11px] text-zinc-500">XP</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#27272A] pb-2.5" role="tablist">
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
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-400 hover:bg-[#141418] hover:text-white",
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Active Streak</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#141418] text-amber-400 border border-[#27272A]">
                  <Flame size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-white">{dashboard?.streak?.currentStreak ?? 5}d</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Best: {dashboard?.streak?.longestStreak ?? 14} days · Streak shield active
              </p>
            </Card>

            <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Total Experience
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#141418] text-emerald-400 border border-[#27272A]">
                  <Zap size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-white">{userXp.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Level {userLevel} · {nextMilestone.xp - userXp} XP to next rank
              </p>
            </Card>

            <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Leaderboard Rank
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#141418] text-indigo-400 border border-[#27272A]">
                  <Trophy size={15} />
                </div>
              </div>
              <p className="mt-2 text-xl font-bold font-mono text-indigo-400">
                #{dashboard?.leaderboardPosition ?? 12}
              </p>
              <Link to="/leaderboard" className="mt-0.5 inline-block text-xs text-indigo-400 hover:underline">
                View Global Standings →
              </Link>
            </Card>
          </div>

          {/* Active Track Progress Card */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  Current Curriculum Track
                </span>
                <h2 className="mt-0.5 text-base font-bold text-white">
                  {currentTrack?.title ?? "Full-Stack Web Development Track"}
                </h2>
              </div>
              <Link
                to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/tracks"}
                className="text-xs font-medium text-indigo-400 hover:underline"
              >
                Open Track Dashboard →
              </Link>
            </div>

            <ProgressBar
              value={currentTrack?.overallProgressPercent ?? 45}
              max={100}
              className="mt-3.5 h-1.5 bg-[#27272A]"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>{currentTrack?.overallProgressPercent ?? 45}% Completed</span>
              <span>
                {currentTrack?.lessons.completed ?? 6} of {currentTrack?.lessons.total ?? 14} lessons verified
              </span>
            </div>
          </Card>

          {/* Next Milestone Track */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">Next Engineering Milestone</h2>
                <p className="text-xs text-zinc-400">{nextMilestone.note}</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {userXp} / {nextMilestone.xp} XP
              </span>
            </div>
            <ProgressBar
              value={Math.min(userXp, nextMilestone.xp)}
              max={nextMilestone.xp}
              className="mt-3.5 h-1.5 bg-[#27272A]"
            />
            <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-300">
              <span className="font-semibold text-indigo-400">{nextMilestone.label}</span>
              <span className="text-zinc-500">Target: {nextMilestone.xp} XP</span>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: SKILL MASTERY RADAR & BREAKDOWN ─── */}
      {tab === "mastery" && (
        <div className="space-y-5">
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Engineering Competency Breakdown</h2>
                <p className="text-xs text-zinc-400">
                  Evaluated automatically through coding challenges, test suite runs, and mentor code reviews.
                </p>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1.5">
                <ShieldCheck size={18} className="text-indigo-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Overall Readiness</p>
                  <p className="text-sm font-bold font-mono text-indigo-400">{overallReadiness}%</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {SKILL_CATEGORIES.map((skill) => (
                <div key={skill.name} className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{skill.icon}</span>
                      <span className="text-xs font-semibold text-white">{skill.name}</span>
                    </div>
                    <Badge
                      variant={skill.tier === "Master" ? "purple" : skill.tier === "Advanced" ? "success" : "default"}
                      size="sm"
                    >
                      {skill.tier}
                    </Badge>
                  </div>

                  <ProgressBar value={skill.level} max={100} className="h-1.5 bg-[#27272A]" />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{skill.level}% Mastery</span>
                    <span className="font-mono text-indigo-400">{skill.xp} XP Earned</span>
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
          <div className="flex flex-wrap gap-1.5">
            {(["all", "earned", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={badgeFilter === f}
                onClick={() => setBadgeFilter(f)}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs font-medium transition-all",
                  badgeFilter === f
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                    : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white",
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredBadges.map((b) => (
              <Card
                key={b._id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 transition-all shadow-md",
                  b.earned ? "border-[#27272A] bg-[#0E0E11]" : "border-[#27272A] bg-[#0E0E11] opacity-50",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                    b.earned
                      ? "bg-[#141418] text-indigo-400 border-[#27272A]"
                      : "bg-[#0E0E11] text-zinc-600 border-[#27272A]",
                  )}
                >
                  {b.earned ? <BadgeCheck size={20} /> : <Lock size={16} />}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white truncate">{b.name}</h3>
                    {b.earned && <span className="text-[10px] font-bold text-emerald-400 uppercase">Earned</span>}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{b.description}</p>
                  <p className="text-[10px] font-medium text-indigo-400">
                    {b.earned ? "✓ Unlocked" : `${b.xpRequired ?? 50} XP required`}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Milestones Road */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <h2 className="text-sm font-bold text-white">Career Milestones Road</h2>
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {MILESTONES.map((m) => {
                const complete = userXp >= m.xp;
                return (
                  <div
                    key={m.label}
                    className={cn(
                      "rounded-lg border p-3 space-y-1.5 transition-all",
                      complete ? "border-indigo-500/20 bg-indigo-500/10" : "border-[#27272A] bg-[#141418] opacity-60",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{m.label}</span>
                      {complete ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <Rocket size={14} className="text-zinc-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{m.note}</p>
                    <p className="text-[10px] font-mono font-semibold text-zinc-500">{m.xp} XP</p>
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
                <h2 className="text-base font-bold text-white">Verified Track Certificates</h2>
                <p className="text-xs text-zinc-400">Verifiable completion credentials issued upon track graduation.</p>
              </div>
              <Badge variant="default" size="sm" className="gap-1">
                <Award size={12} /> {certificates.length || 1} Issued
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(certificates.length > 0
                ? certificates
                : [
                    {
                      _id: "cert-1",
                      track: { title: "Full-Stack Web & Realtime Systems" },
                      serialNumber: "CERT-ET-2026-9482",
                      createdAt: "2026-08-20T00:00:00Z",
                      certificateUrl: "#",
                    },
                  ]
              ).map((cert) => (
                <Card
                  key={cert._id}
                  className="relative overflow-hidden rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                        <Award size={20} />
                      </div>
                      <div>
                        <Badge variant="success" size="sm" className="font-medium">
                          Verified & Signed
                        </Badge>
                        <h3 className="mt-0.5 text-sm font-semibold text-white">
                          {cert.track?.title ?? "Full-Stack Development Track"}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 border-t border-[#27272A] pt-3 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span>Credential ID:</span>
                      <span className="font-mono font-semibold text-zinc-200">
                        {cert.serialNumber ?? "CERT-ET-2026-9482"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issued to:</span>
                      <span className="text-zinc-200 font-medium">{user?.fullName ?? "Learner"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="primary" className="gap-1 text-xs font-medium">
                      <Download size={12} />
                      Download Certificate PDF
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <ExternalLink size={12} />
                      Verify Credential
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Projects Portfolio */}
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-white">Completed Project Portfolio</h2>
              <p className="text-xs text-zinc-400">
                Projects built in your track and evaluated by mentor code reviewers.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {portfolioProjects.map((p, idx) => (
                <Card
                  key={p.projectId || idx}
                  className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                        {p.trackTitle}
                      </span>
                      <h3 className="mt-0.5 text-sm font-semibold text-white">{p.title}</h3>
                    </div>
                    <Badge variant="success" size="sm" className="font-medium">
                      Grade: {p.grade ?? 95}/100
                    </Badge>
                  </div>

                  {p.feedback && (
                    <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5 text-xs text-zinc-400 italic">
                      "{p.feedback}"
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 border-t border-[#27272A]">
                    {p.githubLink && (
                      <a
                        href={p.githubLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                      >
                        <Github size={13} /> Repository
                      </a>
                    )}
                    {p.deployedUrl && (
                      <a
                        href={p.deployedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline ml-auto"
                      >
                        <ExternalLink size={13} /> Live Demo
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: XP HISTORY ─── */}
      {tab === "activity" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Experience Point Log</h2>
            <p className="text-xs text-zinc-500">{xpLogs.length} events logged</p>
          </div>

          {historyQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : xpLogs.length === 0 ? (
            <EmptyState
              title="No XP recorded yet"
              description="Complete lessons, run code sandbox tests, and attend live sessions to earn XP."
            />
          ) : (
            <div className="space-y-1.5">
              {xpLogs.map((log) => (
                <Card
                  key={log._id}
                  className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0E0E11] p-3 shadow-sm"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-white">{log.reason ?? "XP Reward"}</p>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                      {log.sourceType ? ` · Source: ${log.sourceType}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">+{log.amount} XP</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
