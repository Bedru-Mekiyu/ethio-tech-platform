import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crown, Flame, Lock, Rocket, Target, Trophy, Zap } from "lucide-react";

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
import { completeDailyChallenge } from "@/services/gamificationService";
import { fetchXpHistory } from "@/services/xpService";
import { cn } from "@/lib/utils";

type Tab = "overview" | "badges" | "activity";
type BadgeFilter = "all" | "earned" | "locked";

const milestones = [
  { label: "Starter", xp: 0, note: "Complete the first learning steps." },
  { label: "Builder", xp: 750, note: "Ship your first project submission." },
  { label: "Explorer", xp: 1750, note: "Join live sessions and earn feedback." },
  { label: "Leader", xp: 3500, note: "Stay consistent and support your squad." },
];

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

export function ProgressPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });
  const badgesQuery = useQuery({ queryKey: ["badges"], queryFn: fetchBadges });
  const historyQuery = useQuery({ queryKey: ["xp", "history"], queryFn: fetchXpHistory });

  const completeMutation = useMutation({
    mutationFn: completeDailyChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
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
  const mappedBadges = useMemo(
    () => badges.map((b) => ({ ...b, earned: earnedNames.has(b.name) })),
    [badges, earnedNames],
  );
  const filteredBadges = useMemo(() => {
    if (badgeFilter === "earned") return mappedBadges.filter((b) => b.earned);
    if (badgeFilter === "locked") return mappedBadges.filter((b) => !b.earned);
    return mappedBadges;
  }, [mappedBadges, badgeFilter]);

  const currentTrack = dashboard?.progressByTrack?.[0];
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const dailyChallenge = dashboard?.dailyChallenge;
  const dailyChallengeCompleted = dashboard?.dailyChallengeCompleted ?? false;
  const nextMilestone = milestones.find((m) => xp < m.xp) ?? milestones[milestones.length - 1];
  const xpLogs = historyQuery.data ?? [];

  if (dashboardQuery.isError) return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  if (dashboardQuery.isLoading) return <ProgressSkeleton />;

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-medium transition",
      active
        ? "bg-primary text-[var(--bg-base)]"
        : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white",
    );

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Your progress</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Streaks, badges, and XP in one place.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {(["overview", "badges", "activity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tabClass(tab === t)}
          >
            {t === "overview" ? "Overview" : t === "badges" ? "Badges" : "Activity"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
              <Flame className="text-warning" size={18} />
              <p className="mt-3 text-3xl font-bold text-white">{dashboard?.streak?.currentStreak ?? 0}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                day streak · best {dashboard?.streak?.longestStreak ?? 0}
              </p>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
              <Zap className="text-success" size={18} />
              <p className="mt-3 text-3xl font-bold text-white">{xp.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-secondary)]">total XP · level {level}</p>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
              <Trophy className="text-primary" size={18} />
              <p className="mt-3 text-3xl font-bold text-white">#{dashboard?.leaderboardPosition ?? "—"}</p>
              <Link to="/leaderboard" className="text-xs text-primary hover:underline">
                View leaderboard
              </Link>
            </Card>
          </div>

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {currentTrack?.title ?? "Enroll in a track"}
              </h2>
              {currentTrack ? (
                <Link to={`/app/tracks/${currentTrack.trackId}`} className="text-sm text-primary hover:underline">
                  Open track
                </Link>
              ) : (
                <Link to="/app/tracks" className="text-sm text-primary hover:underline">
                  Browse tracks
                </Link>
              )}
            </div>
            {currentTrack ? (
              <>
                <ProgressBar value={currentTrack.overallProgressPercent} max={100} className="mt-4" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {currentTrack.overallProgressPercent}% complete · {currentTrack.lessons.completed}/
                  {currentTrack.lessons.total} lessons
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Pick a learning track to see your progress here.
              </p>
            )}
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-primary" />
                <h2 className="text-lg font-semibold text-white">Today's challenge</h2>
              </div>
              {dailyChallengeCompleted ? <Badge variant="success">Completed</Badge> : null}
            </div>
            <p className="mt-3 text-sm text-white">{dailyChallenge?.title ?? "Build a habit today"}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {dailyChallenge?.description ??
                "Complete one lesson, review a project requirement, or ask a question in your squad."}
            </p>
            <p className="mt-2 text-sm text-success">+{dailyChallenge?.xpReward ?? 25} XP</p>
            {!dailyChallengeCompleted && dailyChallenge ? (
              <Button
                className="mt-4"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
              >
                {completeMutation.isPending ? "Claiming…" : "Claim reward"}
              </Button>
            ) : null}
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Next milestone</h2>
              <span className="text-sm text-[var(--text-secondary)]">
                {xp} / {nextMilestone.xp} XP
              </span>
            </div>
            <ProgressBar value={Math.min(xp, nextMilestone.xp)} max={nextMilestone.xp} className="mt-3" />
            <p className="mt-3 text-sm text-white">{nextMilestone.label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{nextMilestone.note}</p>
          </Card>
        </div>
      )}

      {tab === "badges" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(["all", "earned", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={badgeFilter === f}
                onClick={() => setBadgeFilter(f)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition",
                  badgeFilter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white",
                )}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBadges.length ? (
              filteredBadges.map((b) => (
                <Card
                  key={b._id}
                  className={cn(
                    "flex gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-4",
                    !b.earned && "opacity-80",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                      b.earned ? "bg-primary/20 text-primary" : "bg-white/5 text-[var(--text-muted)]",
                    )}
                  >
                    {b.earned ? <BadgeCheck size={20} /> : <Lock size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{b.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{b.description}</p>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {b.earned ? "Earned" : `${b.xpRequired ?? 0} XP to unlock`}
                    </p>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                title="No badges in this filter"
                description="Try another filter to see earned and locked milestones."
              />
            )}
          </div>

          <Card className="border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-semibold text-white">Milestones</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {milestones.map((m) => {
                const complete = xp >= m.xp;
                return (
                  <div
                    key={m.label}
                    className={cn(
                      "rounded-2xl border p-4",
                      complete ? "border-primary/30 bg-primary/10" : "border-[var(--border)] bg-white/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{m.label}</p>
                      {complete ? (
                        <Crown size={14} className="text-primary" />
                      ) : (
                        <Rocket size={14} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{m.note}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {m.xp} XP
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">XP history</h2>
            <p className="text-sm text-[var(--text-secondary)]">{xpLogs.length} events</p>
          </div>
          {historyQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : xpLogs.length === 0 ? (
            <EmptyState
              title="No XP yet"
              description="Complete lessons, projects, and sessions to start earning XP."
            />
          ) : (
            <div className="space-y-2">
              {xpLogs.map((log) => (
                <Card
                  key={log._id}
                  className="flex items-center justify-between border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div>
                    <p className="font-medium text-white">{log.reason ?? "XP earned"}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(log.createdAt).toLocaleString()}
                      {log.sourceType ? ` · ${log.sourceType}` : ""}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">+{log.amount}</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
