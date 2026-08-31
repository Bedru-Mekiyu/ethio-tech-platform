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
    <div className="space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
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
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" size={16} />
            </Link>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{liveUser?.fullName ?? "Learner"}</h1>
            <p className="mt-0.5 text-xs text-zinc-400">{liveUser?.email}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge variant="purple" size="sm">{getRankTitle(level)}</Badge>
              <Badge variant="default" size="sm">Level {level}</Badge>
              <Badge variant="success" size="sm">{xp.toLocaleString()} XP</Badge>
            </div>
          </div>
          <Link to={getSettingsPath(liveUser?.role ?? "student")}>
            <Button variant="outline" size="sm" className="text-xs text-zinc-300 gap-1.5">
              <Edit3 size={13} /> Edit Profile
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-white">{track?.title ?? "Current Track"}</h2>
            <Link to="/app/tracks" className="text-xs text-indigo-400 hover:underline">
              {track ? "View track" : "Browse tracks"}
            </Link>
          </div>
          {track ? (
            <>
              <ProgressBar value={completion} max={100} className="mt-4" />
              <p className="mt-2 text-xs text-zinc-400">
                {completion}% complete · {track.lessons.completed}/{track.lessons.total} lessons
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              Enroll in a track to see your progress here.
            </p>
          )}
        </Card>

        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-semibold text-white">Recent Achievements</h2>
            <Link to="/app/progress" className="text-xs text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          {badges.length ? (
            <div className="mt-4 space-y-2">
              {badges.slice(0, 4).map((badge) => (
                <div
                  key={badge._id ?? badge.name}
                  className="flex items-center gap-2.5 rounded-lg border border-[#27272A] bg-[#141418] p-2.5"
                >
                  <Award size={14} className="text-indigo-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{badge.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{badge.category ?? "achievement"}</p>
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

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Link to="/app/certificates" className="block">
          <Card className="border-[#27272A] bg-[#0E0E11] p-4 transition hover:border-zinc-700 shadow-sm">
            <p className="text-xs text-zinc-400">Certificates</p>
            <p className="mt-0.5 text-xs font-medium text-white">View earned certificates →</p>
          </Card>
        </Link>
        <Link to="/app/settings" className="block">
          <Card className="border-[#27272A] bg-[#0E0E11] p-4 transition hover:border-zinc-700 shadow-sm">
            <p className="text-xs text-zinc-400">Settings</p>
            <p className="mt-0.5 text-xs font-medium text-white">Manage account & privacy →</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
