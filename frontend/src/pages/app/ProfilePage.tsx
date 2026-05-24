import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, Crown, Edit3, Medal, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import heroImage from "@/assets/hero.png";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { fetchMe } from "@/services/authService";
import { getDashboardPath, getSettingsPath } from "@/store/authStore";
import { getRankTitle } from "@/lib/utils";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <Skeleton className="h-80 rounded-[28px]" />
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.role ?? "student"],
    queryFn: fetchStudentDashboard,
    enabled: user?.role === "student",
  });

  const liveUser = meQuery.data ?? user;
  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;

  useEffect(() => {
    if (meQuery.data && meQuery.data !== user) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser, user]);

  if (meQuery.isError || dashboardQuery.isError) {
    return (
      <QueryError
        message="Unable to load profile."
        onRetry={() => {
          void meQuery.refetch();
          void dashboardQuery.refetch();
        }}
      />
    );
  }

  if (meQuery.isLoading || dashboardQuery.isLoading) return <ProfileSkeleton />;

  const xp = liveUser?.xp ?? 0;
  const level = liveUser?.level ?? 1;
  const rank = dashboard?.leaderboardPosition ?? 0;
  const streak = dashboard?.streak?.currentStreak ?? 0;
  const track = dashboard?.progressByTrack?.[0];
  const completion = track?.overallProgressPercent ?? 0;
  const badges = dashboard?.user?.badges ?? [];
  const recentActivity = dashboard?.recentXp?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-0">
        <div className="relative h-56">
          <img src={heroImage} alt="Profile banner" className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,24,0.1),rgba(7,12,20,0.96))]" />
          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <Badge variant="purple">Personal profile</Badge>
            <Badge variant="success">{liveUser?.role}</Badge>
          </div>
        </div>

        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border-4 border-[var(--bg-base)] bg-[var(--bg-card)] shadow-xl">
                <UserRound size={42} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Profile</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">{liveUser?.fullName ?? "Learner"}</h1>
                <p className="mt-2 text-[var(--text-secondary)]">{liveUser?.email ?? "No email on file"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="purple">{getRankTitle(level)}</Badge>
                  <Badge variant="success">Level {level}</Badge>
                  <Badge variant="default">#{rank || "--"}</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={getSettingsPath(liveUser?.role ?? "student")}>
                <Button variant="outline">
                  <Edit3 size={16} />
                  Edit profile
                </Button>
              </Link>
              <Link to={getDashboardPath(liveUser?.role ?? "student")}>
                <Button>
                  <Camera size={16} />
                  Open dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">XP</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{xp.toLocaleString()}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Crown size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Rank</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">#{rank || "--"}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <ShieldCheck size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Streak</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{streak} days</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Medal size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Badges</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{badges.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Learning progress</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">{track?.title ?? "No active track"}</h2>
            </div>
            <Badge variant="success">{completion}% complete</Badge>
          </div>
          <ProgressBar value={completion} max={100} className="mt-5" />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Lessons</p>
              <p className="mt-2 text-xl font-semibold text-white">{track?.lessons.completed ?? 0}/{track?.lessons.total ?? 0}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Projects</p>
              <p className="mt-2 text-xl font-semibold text-white">{track?.projects.approved ?? 0}/{track?.projects.total ?? 0}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Next tier</p>
              <p className="mt-2 text-xl font-semibold text-white">{getRankTitle(level + 1)}</p>
            </Card>
          </div>

          <div className="mt-6 space-y-3">
            {badges.length ? (
              badges.slice(0, 4).map((badge) => (
                <div key={badge._id ?? badge.name} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                  <div>
                    <p className="font-medium text-white">{badge.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{badge.category ?? "achievement"}</p>
                  </div>
                  <Badge variant="success">Earned</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="No badges yet" description="Earn your first badge by completing lessons and projects." />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <Badge variant="purple">Recent activity</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-white">Latest momentum</h2>
            <div className="mt-4 space-y-3">
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <div key={`${item.createdAt}-${item.reason}`} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">{item.reason}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      +{item.amount.toLocaleString()} XP
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No recent activity" description="Your latest actions will appear here." />
              )}
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <Badge variant="success">Profile actions</Badge>
            <div className="mt-4 space-y-3">
              <Link to="/app/achievements">
                <Button className="w-full" variant="outline">
                  Open achievements
                </Button>
              </Link>
              <Link to="/app/settings">
                <Button className="w-full" variant="primary">
                  Manage settings
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Account access is role-based, and profile updates stay consistent across the learning workspace.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
