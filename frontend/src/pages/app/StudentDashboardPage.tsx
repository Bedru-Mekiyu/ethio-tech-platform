import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Trophy,
  Zap,
  ShieldCheck,
  BadgeCheck,
  Award,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { getRankTitle } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const badgeMeta = {
  system: { icon: ShieldCheck, tone: "purple" as const },
  mentor: { icon: GraduationCap, tone: "success" as const },
  project: { icon: BookOpen, tone: "default" as const },
  session: { icon: CalendarClock, tone: "warning" as const },
  badge: { icon: Award, tone: "purple" as const },
  xp: { icon: Zap, tone: "success" as const },
};

function getBadgeMeta(category?: string) {
  const normalized = category?.toLowerCase();
  return normalized && normalized in badgeMeta
    ? badgeMeta[normalized as keyof typeof badgeMeta]
    : { icon: BadgeCheck, tone: "default" as const };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="h-[28rem] rounded-[28px]" />
        <Skeleton className="h-[28rem] rounded-[28px]" />
      </div>
      <Skeleton className="h-32 rounded-[24px]" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="h-[24rem] rounded-[24px]" />
        <Skeleton className="h-[24rem] rounded-[24px]" />
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { classroomPath, squadPath } = useQuickNavLinks();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const dashboard = data as StudentDashboardData | undefined;
  const firstName =
    dashboard?.user?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Learner";
  const currentTrack = dashboard?.progressByTrack?.[0];
  const latestSubmission = dashboard?.recentSubmissions?.[0];
  const currentStreak = dashboard?.streak?.currentStreak ?? 0;
  const completion = currentTrack?.overallProgressPercent ?? 0;
  const currentTitle = currentTrack?.title ?? latestSubmission?.project?.title ?? "Choose a learning track";
  const currentSubtitle = currentTrack
    ? `${completion}% complete with project work and mentor checkpoints.`
    : latestSubmission
      ? `Latest submission: ${latestSubmission.status ?? "in review"}`
      : "Start a track to unlock live sessions, project feedback, and XP growth.";

  if (isError) {
    return <QueryError onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentBadges = dashboard?.user?.badges ?? [];
  const upcomingSessions = dashboard?.upcomingSessions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="relative overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(16,23,37,0.96),rgba(7,12,20,0.98))] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,210,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.12),transparent_30%)]" />
          <div className="relative">
            <Badge className="mb-4">Current learning path</Badge>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="mt-3 text-[var(--text-secondary)]">
                  Keep your momentum going. The next milestone is close, and your mentors are already
                  tracking your progress.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Rank
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {getRankTitle(dashboard?.user?.level ?? user?.level ?? 1)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Level {dashboard?.user?.level ?? user?.level ?? 1}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-base)]/60 p-5">
                <Badge variant="purple" className="mb-3">
                  {currentTrack ? "In progress" : "Pick a track"}
                </Badge>
                <h2 className="text-2xl font-semibold text-white">{currentTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  {currentSubtitle}
                </p>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                    <span>Progress</span>
                    <span>{completion}%</span>
                  </div>
                  <ProgressBar value={completion} max={100} className="h-2.5" />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/tracks"}>
                    <Button size="lg">
                      {currentTrack ? "Continue learning" : "Browse tracks"}
                    </Button>
                  </Link>
                  <Link to={latestSubmission ? "/app/sessions" : "/app/achievements"}>
                    <Button variant="outline" size="lg">
                      {latestSubmission ? "View latest feedback" : "See achievements"}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <StatChip
                  label="XP"
                  value={`${(dashboard?.user?.xp ?? user?.xp ?? 0).toLocaleString()} XP`}
                  icon={<Sparkles size={16} />}
                />
                <StatChip
                  label="Leaderboard"
                  value={`#${dashboard?.leaderboardPosition ?? 0}`}
                  icon={<Trophy size={16} />}
                />
                <StatChip
                  label="Badges"
                  value={`${recentBadges.length}`}
                  icon={<Award size={16} />}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-0">
          <div className="relative h-full min-h-[28rem]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.18),rgba(6,10,18,0.92))]" />
            <img
              src={heroImage}
              alt="Immersive dashboard preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full border border-primary/25 bg-[rgba(5,10,20,0.86)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
              Live learning
            </div>
            <Card className="absolute right-4 top-4 max-w-[180px] border-primary/30 bg-[rgba(8,14,24,0.94)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Active sessions
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{upcomingSessions.length}</p>
              <p className="text-xs text-success">Mentor rooms ready</p>
            </Card>
            <Card className="absolute bottom-4 left-4 right-4 border-secondary/20 bg-[rgba(8,14,24,0.94)] p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <PlayCircle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Next action
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    {currentTrack ? "Continue your current module" : "Join your first learning track"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>

      <Card className="grid gap-4 rounded-[24px] border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Current streak</p>
          <p className="mt-2 text-2xl font-semibold text-white">{currentStreak} days</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {currentStreak > 0 ? "Keep the rhythm alive." : "Start today to build momentum."}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Recent XP</p>
          <p className="mt-2 text-2xl font-semibold text-white">{dashboard?.recentXp?.length ?? 0}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Events earned from your activity.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Focus mode</p>
          <p className="mt-2 text-2xl font-semibold text-white">{currentTrack ? "On" : "Off"}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Designed for deep work and review.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Sessions ready</p>
          <p className="mt-2 text-2xl font-semibold text-white">{upcomingSessions.length}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Live classroom slots available.</p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="mb-6 p-0">
            <div>
              <CardTitle>Upcoming live sessions</CardTitle>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Stay connected to mentor-led sessions and collaborative classroom work.
              </p>
            </div>
            <Link to="/app/sessions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>

          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : upcomingSessions.length ? (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session, index) => (
                <div
                  key={session._id ?? `${session.title}-${index}`}
                  className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="purple">Live cohort</Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {session.scheduledAt ? timeFormatter.format(new Date(session.scheduledAt)) : "Scheduled soon"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-white">{session.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {session.status === "live" ? "Mentor is already online." : "Join when the room opens."}
                    </p>
                  </div>
                  {session._id ? (
                    <Link to={`/app/classroom/${session._id}`}>
                      <Button size="sm" className="w-full md:w-auto">
                        Join now
                      </Button>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No live sessions are scheduled yet"
              description="Your mentor or cohort will appear here as soon as sessions are published."
              actionLabel="Browse tracks"
              onAction={() => navigate("/app/tracks")}
            />
          )}
        </Card>

        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="mb-6 p-0">
            <div>
              <CardTitle>Recent badges</CardTitle>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Recognition from lessons, projects, mentor sessions, and XP milestones.
              </p>
            </div>
            <Link to="/app/achievements" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>

          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-2xl" />
          ) : recentBadges.length ? (
            <div className="grid gap-3">
              {recentBadges.slice(0, 3).map((badge, index) => {
                const meta = getBadgeMeta(badge.category);
                const Icon = meta.icon;
                return (
                  <div
                    key={badge._id ?? `${badge.name}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{badge.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {badge.category ? badge.category : "Achievement unlocked"}
                      </p>
                    </div>
                    <Badge variant={meta.tone}>{badge.category ?? "badge"}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No badges yet"
              description="Finish lessons, participate in sessions, and ship projects to unlock recognition."
              actionLabel="Open learning tracks"
              onAction={() => navigate("/app/tracks")}
            />
          )}

          {dashboard?.recentXp?.length ? (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles size={16} className="text-primary" />
                Recent XP
              </div>
              <div className="space-y-2">
                {dashboard.recentXp.slice(0, 3).map((event, index) => (
                  <div key={`${event.reason}-${event.createdAt}-${index}`} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-white">{event.reason}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {timeFormatter.format(new Date(event.createdAt))}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success">+{event.amount} XP</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="grid gap-4 rounded-[24px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,23,37,0.9),rgba(8,12,20,0.96))] p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <Badge variant="success">Community pulse</Badge>
          <h3 className="mt-3 text-2xl font-semibold text-white">Your squad and mentors are ready when you are.</h3>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Keep momentum with live classrooms, collaboration rooms, and mentor feedback loops that
            stay synchronized across the platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={classroomPath}>
            <Button>Join classroom</Button>
          </Link>
          <Link to={squadPath}>
            <Button variant="outline">Open squad room</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
