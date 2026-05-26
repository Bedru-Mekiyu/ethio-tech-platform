import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Flame, Target, Trophy, Zap } from "lucide-react";
import { fetchStudentDashboard } from "@/services/dashboardService";
import { completeDailyChallenge, fetchDailyChallenge } from "@/services/gamificationService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";

export function ProgressPage() {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["dashboard", "student"], queryFn: fetchStudentDashboard });
  const challengeQuery = useQuery({ queryKey: ["gamification", "daily-challenge"], queryFn: fetchDailyChallenge });

  const completeMutation = useMutation({
    mutationFn: completeDailyChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "daily-challenge"] });
    },
  });

  if (dashboardQuery.isError) {
    return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  }

  if (dashboardQuery.isLoading) {
    return <Skeleton className="h-64 w-full rounded-[24px]" />;
  }

  const dashboard = dashboardQuery.data;
  const challenge = challengeQuery.data?.challenge;
  const challengeCompleted =
    challengeQuery.data?.completed ?? dashboard?.dailyChallengeCompleted ?? false;

  return (
    <div className="page-shell space-y-6">
      <div>
        <Badge variant="purple">Progress hub</Badge>
        <h1 className="section-title mt-3 text-3xl">Your learning momentum</h1>
        <p className="section-copy mt-2 text-sm">
          Streaks, daily challenges, badges, and XP in one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="surface-panel p-6">
          <Flame className="text-warning" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">Streak</p>
          <p className="mt-2 text-3xl font-bold text-white">{dashboard?.streak?.currentStreak ?? 0} days</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Best: {dashboard?.streak?.longestStreak ?? 0} days
          </p>
        </Card>
        <Card className="surface-panel p-6">
          <Zap className="text-success" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">Total XP</p>
          <p className="mt-2 text-3xl font-bold text-white">{dashboard?.user?.xp ?? 0}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Level {dashboard?.user?.level ?? 1}</p>
        </Card>
        <Card className="surface-panel p-6">
          <Trophy className="text-primary" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">Leaderboard</p>
          <p className="mt-2 text-3xl font-bold text-white">#{dashboard?.leaderboardPosition ?? "—"}</p>
          <Link to="/leaderboard" className="mt-2 inline-block text-sm text-primary hover:underline">
            View public board
          </Link>
        </Card>
      </div>

      <Card className="surface-panel p-6">
        <CardHeader className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Target size={20} /> Daily challenge
            </CardTitle>
            {challengeCompleted ? <Badge variant="success">Completed</Badge> : null}
          </div>
        </CardHeader>
        <p className="mt-4 text-lg font-medium text-white">{challenge?.title ?? "No challenge today"}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{challenge?.description}</p>
        <p className="mt-3 text-success">+{challenge?.xpReward ?? 25} XP</p>
        {!challengeCompleted && challenge ? (
          <Button
            className="mt-4"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            Claim challenge reward
          </Button>
        ) : null}
      </Card>

      <Card className="surface-panel p-6">
        <CardTitle className="flex items-center gap-2">
          <Award size={20} /> Badges
        </CardTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          {(dashboard?.user?.badges ?? []).length ? (
            dashboard?.user?.badges?.map((badge) => (
              <Badge key={badge._id ?? badge.name} variant="purple">
                {badge.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Complete lessons to unlock badges.</p>
          )}
        </div>
        <Link to="/app/achievements" className="mt-4 inline-block text-sm text-primary hover:underline">
          View all achievements
        </Link>
      </Card>
    </div>
  );
}
