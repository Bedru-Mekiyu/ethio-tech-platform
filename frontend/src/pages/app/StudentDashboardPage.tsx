import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Sparkles, Target } from "lucide-react";

import { fetchStudentDashboard } from "@/services/dashboardService";
import { completeDailyChallenge } from "@/services/gamificationService";
import { useAuthStore } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import { usePageTitle } from "@/hooks/usePageTitle";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

export function StudentDashboardPage() {
  usePageTitle("Home");
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { classroomPath } = useQuickNavLinks();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });

  const completeChallengeMutation = useMutation({
    mutationFn: completeDailyChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <DashboardSkeleton />;

  const firstName = data?.user?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "there";
  const currentTrack = data?.progressByTrack?.[0];
  const currentStreak = data?.streak?.currentStreak ?? 0;
  const completion = currentTrack?.overallProgressPercent ?? 0;
  const dailyChallenge = data?.dailyChallenge;
  const dailyChallengeCompleted = data?.dailyChallengeCompleted ?? false;
  const nextSession = upcomingMeetings[0];

  const trackTitle = currentTrack?.title ?? "Choose a learning track";
  const trackSubtitle = currentTrack
    ? `${completion}% complete · ${currentTrack.lessons.completed}/${currentTrack.lessons.total} lessons`
    : "Enroll in a track to see your progress and earn XP.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {currentStreak > 0
            ? `${currentStreak}-day streak · keep going.`
            : "Pick up where you left off."}
        </p>
      </div>

      <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Current track</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{trackTitle}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{trackSubtitle}</p>
          </div>
          <span className="text-2xl font-bold text-white">{completion}%</span>
        </div>
        <ProgressBar value={completion} max={100} className="mt-4" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/tracks"}>
            <Button>{currentTrack ? "Continue learning" : "Browse tracks"}</Button>
          </Link>
          {nextSession ? (
            <Link to={classroomPath}>
              <Button variant="outline">Join classroom</Button>
            </Link>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-white">Next session</h2>
          </div>
          {nextSession ? (
            <div className="mt-4">
              <MeetingCard meeting={nextSession} variant="full" />
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No sessions scheduled. New ones will appear here.
            </p>
          )}
        </Card>

        <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-white">Today's challenge</h2>
            {dailyChallengeCompleted ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 size={14} /> Done
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-white">
            {dailyChallenge?.title ?? "Build a habit today"}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {dailyChallenge?.description ??
              "Complete one lesson, review a project, or ask a question in your squad."}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm text-success">
            <Sparkles size={14} /> +{dailyChallenge?.xpReward ?? 25} XP
          </p>
          {dailyChallengeCompleted ? null : (
            <Button
              className="mt-4 w-full"
              disabled={completeChallengeMutation.isPending || !dailyChallenge}
              onClick={() => completeChallengeMutation.mutate()}
            >
              {completeChallengeMutation.isPending ? "Claiming…" : "Claim reward"}
            </Button>
          )}
        </Card>
      </div>

      {nextSession ? null : (
        <EmptyState
          title="Ready to start?"
          description="Browse tracks to find your next learning path."
          actionLabel="Open tracks"
          onAction={() => navigate("/app/tracks")}
        />
      )}
    </div>
  );
}
