import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, ClipboardList, Flame, ShieldCheck, Star, Users, Video } from "lucide-react";
import { fetchMentorDashboard, type MentorDashboardData } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { getRankTitle } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

function MentorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = "primary",
  note,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "primary" | "secondary" | "success" | "warning";
  note?: string;
}) {
  const toneClass =
    tone === "secondary"
      ? "bg-secondary/10 text-secondary"
      : tone === "success"
        ? "bg-success/10 text-success"
        : tone === "warning"
          ? "bg-warning/10 text-warning"
          : "bg-primary/10 text-primary";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
      <p className="mt-4 stat-label">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {note ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{note}</p> : null}
    </Card>
  );
}

export function MentorDashboardPage() {
  usePageTitle("Mentor Dashboard");
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard", "mentor"],
    queryFn: fetchMentorDashboard,
    enabled: !!user,
  });
  const dashboard = data as MentorDashboardData | undefined;
  const firstName = dashboard?.mentor?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Mentor";
  const upcomingSessions = dashboard?.upcomingSessions ?? dashboard?.mySessions ?? [];
  const recentReviews = dashboard?.reviewsDone ?? [];
  const mentorScore = Math.round(dashboard?.mentor?.mentorScore ?? 0);
  const impact = Math.min(100, Math.round(dashboard?.contributionMetrics?.quality ?? mentorScore));
  const mentorStatus = user?.mentorStatus ?? (user?.role === "mentor" ? (user?.isVerified ? "approved" : "pending") : undefined);

  if (user?.role === "mentor" && mentorStatus !== "approved") {
    return (
      <div className="space-y-6">
        <Card className="rounded-[28px] border-warning/30 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(14,20,32,0.98))] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="warning">
                {mentorStatus === "rejected" ? "Application not approved" : "Verification required"}
              </Badge>
              <h1 className="section-title mt-4">
                {mentorStatus === "rejected"
                  ? "Your mentor application needs another review"
                  : "Complete mentor onboarding before using mentor tools"}
              </h1>
              <p className="mt-3 text-[var(--text-secondary)]">
                {mentorStatus === "rejected"
                  ? "Your application was reviewed, but you do not currently have access to mentor tools. Contact support if you want feedback or want to apply again."
                  : mentorStatus === "pending"
                    ? "Your mentor application is under review. Mentor tools stay locked until the admin team approves your application and verifies your account for live mentoring."
                    : "Mentor tools stay locked until the admin team approves your mentor application and verifies your account for live mentoring."}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <ShieldCheck size={24} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              mentorStatus === "pending" ? "Application waiting in review" : "Mentor profile flagged for review",
              "Admin checks experience, expertise, and availability",
              "Approved mentors unlock sessions and reviews",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Step {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/mentor-recruitment">
              <Button>{mentorStatus === "rejected" ? "Review application path" : "Open application"}</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Contact support</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) return <MentorDashboardSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load mentor dashboard."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Mentor dashboard</Badge>
            <h1 className="section-title">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Keep your teaching rhythm visible with upcoming sessions, review momentum, and learner impact in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/mentor/sessions">
              <Button>
                <Clock3 size={16} />
                Schedule session
              </Button>
            </Link>
            <Link to="/mentor/reviews">
              <Button variant="outline">
                <ClipboardList size={16} />
                Review queue
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Mentor score" value={mentorScore} icon={<Star size={18} />} note="Out of 100" />
        <MetricCard label="Total sessions" value={dashboard?.mentor?.totalSessions ?? 0} icon={<Video size={18} />} note="Delivered and scheduled" />
        <MetricCard label="Active students" value={dashboard?.activeStudents ?? 0} icon={<Users size={18} />} note="Learners in your circle" />
        <MetricCard label="Pending reviews" value={dashboard?.pendingReviews ?? 0} icon={<ClipboardList size={18} />} tone="warning" note="Queue needs attention" />
        <MetricCard label="Impact score" value={`${impact}%`} icon={<Flame size={18} />} tone="success" note="Quality weighted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Today&apos;s sessions</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Teaching schedule</h2>
            </div>
            <Link to="/mentor/sessions" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              View calendar <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingSessions.slice(0, 3).map((session, index) => (
              <div
                key={session._id ?? `${session.title}-${index}`}
                className="flex flex-col gap-4 rounded-[22px] border border-[var(--border)] bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple">Live cohort</Badge>
                    <span className="text-xs text-[var(--text-muted)]">
                      {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Scheduled soon"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{session.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {session.status === "live" ? "Mentor is already online." : "Join when the room opens."}
                  </p>
                </div>
                {session._id ? (
                  <Link to={`/app/classroom/${session._id}`}>
                    <Button size="sm" variant="outline">
                      Enter room
                    </Button>
                  </Link>
                ) : null}
              </div>
            ))}

            {!upcomingSessions.length ? (
              <div className="py-6">
                <p className="text-sm text-[var(--text-muted)]">No upcoming mentor sessions yet.</p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="success">Your impact</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Learner trust</h2>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              {getRankTitle(Math.max(1, Math.round(mentorScore / 10)))}
            </div>
          </div>
          <div className="mt-6 grid place-items-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-primary/25 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.18),rgba(8,14,24,0.96)_58%)]">
              <div className="absolute inset-5 rounded-full border border-white/10" />
              <div className="text-center">
                <p className="text-3xl font-semibold text-white">{mentorScore}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">score</p>
              </div>
            </div>
          </div>
          <ProgressBar value={impact} max={100} className="mt-6" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Recognition grows when reviews are clear, timely, and useful for the learner.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Recent reviews</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Project feedback queue</h2>
            </div>
            <Link to="/mentor/reviews" className="text-sm text-primary hover:underline">
              Open queue
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentReviews.slice(0, 3).map((review, i) => (
              <div key={i} className="rounded-[22px] border border-[var(--border)] bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{review.project?.title ?? "Project review"}</p>
                  <Badge variant="success">{review.status ?? "reviewed"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {review.updatedAt ? new Date(review.updatedAt).toLocaleString() : "Recent"}
                </p>
              </div>
            ))}
            {!recentReviews.length && <p className="text-sm text-[var(--text-muted)]">No reviewed submissions yet.</p>}
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div>
            <Badge variant="success">Mentor actions</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-white">Quick commands</h2>
          </div>
          <div className="mt-5 grid gap-3">
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
            <Link to={upcomingSessions[0]?._id ? `/app/classroom/${upcomingSessions[0]._id}` : "/mentor/sessions"}>
              <Button className="w-full" variant="outline">
                <Video size={16} /> Enter virtual classroom
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
