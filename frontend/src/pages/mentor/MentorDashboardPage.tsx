import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMentorDashboard, type MentorDashboardData } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { StatCard } from "@/components/composites/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Users, Video, Clock3, ClipboardList } from "lucide-react";

export function MentorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "mentor"],
    queryFn: fetchMentorDashboard,
    enabled: !!user,
  });
  const dashboard = data as MentorDashboardData | undefined;
  const firstName = dashboard?.mentor?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Mentor";
  const upcomingSessions = dashboard?.upcomingSessions ?? dashboard?.mySessions ?? [];
  const recentReviews = dashboard?.reviewsDone ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Mentor dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Welcome back, {firstName}. Here&apos;s your teaching overview.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Mentor score"
            value={Math.round(dashboard?.mentor?.mentorScore ?? 0)}
            sub="Out of 100"
            icon={<Star className="text-warning" size={20} />}
          />
          <StatCard
            label="Total sessions"
            value={dashboard?.mentor?.totalSessions ?? 24}
            icon={<Video className="text-primary" size={20} />}
          />
          <StatCard
            label="Active students"
            value={dashboard?.activeStudents ?? 18}
            icon={<Users className="text-secondary" size={20} />}
          />
          <StatCard
            label="Pending reviews"
            value={dashboard?.pendingReviews ?? 0}
            trend="Review queue"
            icon={<ClipboardList className="text-success" size={20} />}
          />
          <StatCard
            label="Contribution score"
            value={dashboard?.contributionMetrics?.quality ?? dashboard?.mentor?.mentorScore ?? 0}
            sub="Quality avg"
            icon={<Star className="text-warning" size={20} />}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
            <Link to="/mentor/sessions" className="text-sm text-primary">
              Manage all
            </Link>
          </CardHeader>
          {upcomingSessions.slice(0, 3).map((session, i) => (
            <div
              key={i}
              className="mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
            >
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(session.scheduledAt).toLocaleString()}
                </p>
              </div>
              <Badge variant="purple">{session.status ?? "scheduled"}</Badge>
            </div>
          ))}
          {!upcomingSessions.length && (
            <p className="text-sm text-[var(--text-muted)]">No upcoming mentor sessions yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contribution snapshot</CardTitle>
          </CardHeader>
          <div className="grid gap-3">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Students reached</p>
              <p className="mt-1 text-2xl font-bold">{dashboard?.activeStudents ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Feedback quality</p>
              <p className="mt-1 text-2xl font-bold">{dashboard?.contributionMetrics?.quality ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Review depth</p>
              <p className="mt-1 text-2xl font-bold">{dashboard?.contributionMetrics?.feedbackCount ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent reviews</CardTitle>
            <Link to="/mentor/reviews" className="text-sm text-primary">
              Open queue
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {recentReviews.slice(0, 3).map((review, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{review.project?.title ?? "Project review"}</p>
                  <Badge variant="success">{review.status ?? "reviewed"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {review.updatedAt ? new Date(review.updatedAt).toLocaleString() : "Recent"}
                </p>
              </div>
            ))}
            {!recentReviews.length && (
              <p className="text-sm text-[var(--text-muted)]">No reviewed submissions yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentor actions</CardTitle>
          </CardHeader>
          <div className="grid gap-3">
            <Link to="/mentor/sessions">
              <Button className="w-full" variant="primary">
                <Clock3 size={16} /> Schedule session
              </Button>
            </Link>
            <Link to="/mentor/reviews">
              <Button className="w-full" variant="secondary">
                <ClipboardList size={16} /> Review submissions
              </Button>
            </Link>
            <Link
              to={
                upcomingSessions[0]?._id
                  ? `/app/classroom/${upcomingSessions[0]._id}`
                  : "/mentor/sessions"
              }
            >
              <Button className="w-full" variant="outline">
                <Video size={16} /> Enter virtual classroom
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <Badge variant="purple">Mentor impact</Badge>
          <h3 className="mt-3 text-xl font-semibold">Recognition grows with every useful review</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Learners remember clarity, encouragement, and timely feedback. The platform now makes that contribution
            visible so your impact is recognized, not hidden.
          </p>
        </div>
        <div className="grid gap-2">
          <div className="rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Impact score</p>
            <p className="mt-1 text-2xl font-bold">{Math.round(dashboard?.contributionMetrics?.quality ?? 0)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
