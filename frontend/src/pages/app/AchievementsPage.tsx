import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Crown, Lock, Rocket, Trophy } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { fetchBadges } from "@/services/tracksService";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

type BadgeTab = "all" | "earned" | "locked";

const milestones = [
  { label: "Starter", xp: 0, note: "Complete the first learning steps." },
  { label: "Builder", xp: 750, note: "Ship your first project submission." },
  { label: "Explorer", xp: 1750, note: "Join live sessions and earn feedback." },
  { label: "Leader", xp: 3500, note: "Stay consistent and support your squad." },
];

function AchievementsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <Skeleton className="h-12 rounded-full" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-52 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
      </div>
    </div>
  );
}

export function AchievementsPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<BadgeTab>("all");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const badgesQuery = useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
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
    [badgesQuery.data]
  );
  const earnedNames = useMemo(
    () => new Set(dashboard?.user?.badges?.map((badge) => badge.name) ?? []),
    [dashboard?.user?.badges]
  );

  const mapped = useMemo(
    () =>
      badges.map((badge) => ({
        ...badge,
        earned: earnedNames.has(badge.name),
      })),
    [badges, earnedNames]
  );

  const filtered = useMemo(() => {
    if (tab === "earned") return mapped.filter((badge) => badge.earned);
    if (tab === "locked") return mapped.filter((badge) => !badge.earned);
    return mapped;
  }, [mapped, tab]);

  const currentTrack = dashboard?.progressByTrack?.[0];
  const recentBadges = dashboard?.user?.badges ?? [];
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const totalTrackProgress = currentTrack?.overallProgressPercent ?? 0;
  const nextMilestone = milestones.find((milestone) => xp < milestone.xp) ?? milestones[milestones.length - 1];

  if (dashboardQuery.isError || badgesQuery.isError) {
    return (
      <QueryError
        message="Unable to load achievements."
        onRetry={() => {
          void dashboardQuery.refetch();
          void badgesQuery.refetch();
        }}
      />
    );
  }

  if (dashboardQuery.isLoading || badgesQuery.isLoading) return <AchievementsSkeleton />;

  return (
    <div className="page-shell space-y-8">
      <div className="hero-shell p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Achievements</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Achievements & Progression</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Track your learning milestones, unlock badges, and see the next stretch goal at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="purple">{recentBadges.length} earned</Badge>
            <Badge variant="success">{level} level</Badge>
            <Link to="/app/xp">
              <Badge className="cursor-pointer">View XP history</Badge>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="surface-panel p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Crown size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Level</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{level}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{xp.toLocaleString()} XP total</p>
        </Card>
        <Card className="surface-panel p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Trophy size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Current track</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{totalTrackProgress}%</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{currentTrack?.title ?? "No active track"}</p>
        </Card>
        <Card className="surface-panel p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Rocket size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Next goal</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{nextMilestone.label}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{nextMilestone.note}</p>
        </Card>
      </div>

      <Card className="surface-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="purple">Milestone road</Badge>
            <h2 className="section-title mt-3 text-2xl">Badge roadmap</h2>
          </div>
          <div className="min-w-[220px] max-w-md flex-1">
            <ProgressBar value={Math.min(xp, 3500)} max={3500} color="primary" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">Progress toward the leader tier</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {milestones.map((milestone) => {
            const complete = xp >= milestone.xp;
            return (
              <div
                key={milestone.label}
                className={cn(
                  "rounded-2xl border p-4",
                  complete ? "border-primary/30 bg-primary/10" : "border-[var(--border)] bg-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{milestone.label}</p>
                  {complete ? <Badge variant="success">Reached</Badge> : <Badge variant="default">Next</Badge>}
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{milestone.note}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{milestone.xp} XP</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        {(["all", "earned", "locked"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition",
              tab === value
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
            )}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length ? (
            filtered.map((badge) => (
              <Card
                key={badge._id}
                className={cn(
                  "flex gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-4",
                  !badge.earned && "opacity-80"
                )}
              >
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    badge.earned ? "bg-primary/20 text-primary" : "bg-white/5 text-[var(--text-muted)]"
                  )}
                >
                  {badge.earned ? <BadgeCheck size={22} /> : <Lock size={22} />}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{badge.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
                  <Badge variant={badge.earned ? "success" : "default"} className="mt-2">
                    {badge.earned ? "Earned" : `${badge.xpRequired ?? 0} XP to unlock`}
                  </Badge>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No badges in this filter"
              description="Try another filter to see your earned and locked milestones."
            />
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5">
            <Badge variant="purple">Badge showcase</Badge>
            <h3 className="mt-3 text-xl font-semibold text-white">Recent wins</h3>
            <div className="mt-4 space-y-3">
              {recentBadges.length ? (
                recentBadges.slice(0, 4).map((badge, index) => (
                  <div key={badge._id ?? `${badge.name}-${index}`} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">{badge.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{badge.category ?? "achievement"}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No earned badges yet" description="Your first milestones will appear here." />
              )}
            </div>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-5">
            <Badge variant="success">Next action</Badge>
            <h3 className="mt-3 text-xl font-semibold text-white">Keep momentum alive</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Complete lessons, submit projects, and join live sessions to unlock the next progression tier.
            </p>
            <Link to="/app/projects" className="mt-4 inline-flex">
              <Button>Open project hub</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
