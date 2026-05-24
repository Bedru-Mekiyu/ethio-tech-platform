import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { getRankTitle } from "@/lib/utils";

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { classroomPath, squadPath } = useQuickNavLinks();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });
  const dashboard = data as StudentDashboardData | undefined;

  const firstName =
    dashboard?.user?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Learner";

  if (isError) {
    return <QueryError onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {firstName}!</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Keep building — your next rank is close.
          </p>
        </div>
        <Link to="/app/tracks">
          <Button>Resume</Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card>
          <Badge variant="purple" className="mb-3">
            Current module
          </Badge>
          <h2 className="text-2xl font-bold">
            {dashboard?.progressByTrack?.[0]?.title ?? "Choose a learning track"}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0}% complete
          </p>
          <Link
            to={
              dashboard?.progressByTrack?.[0]?.trackId
                ? `/app/tracks/${dashboard.progressByTrack[0].trackId}`
                : "/app/tracks"
            }
            className="mt-4 inline-block"
          >
            <Button>Resume session</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming live sessions</CardTitle>
            <Link to="/app/tracks" className="text-sm text-primary">
              Browse tracks
            </Link>
          </CardHeader>
          {(dashboard?.upcomingSessions ?? []).slice(0, 2).map((s) => (
            <div
              key={s._id ?? s.title}
              className="mb-3 flex justify-between rounded-lg border border-[var(--border)] p-4"
            >
              <span>{s.title}</span>
              {s._id ? (
                <Link to={`/app/classroom/${s._id}`}>
                  <Button size="sm">Join now</Button>
                </Link>
              ) : null}
            </div>
          ))}
          {!dashboard?.upcomingSessions?.length && (
            <p className="text-sm text-[var(--text-muted)]">No upcoming sessions yet.</p>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent badges</CardTitle>
            <Link to="/app/achievements" className="text-sm text-primary">
              View all
            </Link>
          </CardHeader>
          <p className="text-sm text-[var(--text-muted)]">
            Rank: {getRankTitle(dashboard?.user?.level ?? user?.level ?? 1)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(dashboard?.user?.badges ?? []).slice(0, 4).map((badge) => (
              <Badge key={badge._id ?? badge.name} variant="purple">
                {badge.name}
              </Badge>
            ))}
          </div>
          {!dashboard?.user?.badges?.length && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Finish lessons and projects to unlock your first badge.
            </p>
          )}
          {dashboard?.recentXp?.length ? (
            <div className="mt-4 space-y-2">
              {dashboard.recentXp.slice(0, 3).map((event, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                  <p className="font-medium">+{event.amount} XP</p>
                  <p className="text-[var(--text-muted)]">{event.reason}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <Badge variant="success">Community pulse</Badge>
          <h3 className="mt-3 text-xl font-semibold">Your squad and mentors are waiting</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Keep momentum with live classroom sessions, squad rooms, and mentor feedback.
          </p>
        </div>
        <div className="grid gap-2">
          <Link to={classroomPath}>
            <Button className="w-full">Join classroom</Button>
          </Link>
          <Link to={squadPath}>
            <Button className="w-full" variant="outline">
              Open squad room
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
