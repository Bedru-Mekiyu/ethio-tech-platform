import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Camera, Edit3 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { getMyProfile } from "@/services/userService";
import { getSettingsPath } from "@/store/authStore";
import { getRankTitle } from "@/lib/utils";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const profileQuery = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  if (profileQuery.isError || dashboardQuery.isError) {
    return (
      <QueryError
        onRetry={() => {
          profileQuery.refetch();
          dashboardQuery.refetch();
        }}
      />
    );
  }

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  const liveUser = profileQuery.data ?? user;
  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;
  const xp = dashboard?.user?.xp ?? user?.xp ?? 0;
  const level = dashboard?.user?.level ?? user?.level ?? 1;
  const track = dashboard?.progressByTrack?.[0];
  const completion = track?.overallProgressPercent ?? 0;
  const badges = dashboard?.user?.badges ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative shrink-0">
            <Avatar
              src={liveUser?.avatarUrl ?? liveUser?.avatar}
              name={liveUser?.fullName ?? "Learner"}
              userId={liveUser?.id}
              role={liveUser?.role === "mentor" ? "mentor" : "student"}
              size="lg"
            />
            <Link
              to={getSettingsPath(liveUser?.role ?? "student")}
              aria-label="Change avatar in settings"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" size={18} />
            </Link>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{liveUser?.fullName ?? "Learner"}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{liveUser?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="purple">{getRankTitle(level)}</Badge>
              <Badge variant="default">Level {level}</Badge>
              <Badge variant="success">{xp.toLocaleString()} XP</Badge>
            </div>
          </div>
          <Link to={getSettingsPath(liveUser?.role ?? "student")}>
            <Button variant="outline">
              <Edit3 size={15} /> Edit profile
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{track?.title ?? "Current track"}</h2>
            <Link to="/app/tracks" className="text-sm text-primary hover:underline">
              {track ? "View track" : "Browse tracks"}
            </Link>
          </div>
          {track ? (
            <>
              <ProgressBar value={completion} max={100} className="mt-4" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {completion}% complete · {track.lessons.completed}/{track.lessons.total} lessons
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Enroll in a track to see your progress here.
            </p>
          )}
        </Card>

        <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
            <Link to="/app/progress" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {badges.length ? (
            <div className="mt-4 space-y-2">
              {badges.slice(0, 4).map((badge) => (
                <div
                  key={badge._id ?? badge.name}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/3 p-3"
                >
                  <Award size={16} className="text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{badge.name}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{badge.category ?? "achievement"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No badges yet"
              description="Earn your first badge by completing lessons."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/app/certificates" className="block">
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition hover:border-primary/40">
            <p className="text-sm text-[var(--text-secondary)]">Certificates</p>
            <p className="mt-1 text-white">View earned certificates →</p>
          </Card>
        </Link>
        <Link to="/app/settings" className="block">
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition hover:border-primary/40">
            <p className="text-sm text-[var(--text-secondary)]">Settings</p>
            <p className="mt-1 text-white">Manage account & privacy →</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
