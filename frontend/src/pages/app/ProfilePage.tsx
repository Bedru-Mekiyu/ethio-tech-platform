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
      <Skeleton className="h-32 rounded-2xl bg-zinc-100" />
      <Skeleton className="h-64 rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "student";

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
    enabled: !!user,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user && isStudent,
  });

  if (profileQuery.isError || (isStudent && dashboardQuery.isError)) {
    return (
      <QueryError
        onRetry={() => {
          profileQuery.refetch();
          if (isStudent) dashboardQuery.refetch();
        }}
      />
    );
  }

  if (profileQuery.isLoading || (isStudent && dashboardQuery.isLoading)) {
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
    <div className="space-y-6 text-zinc-900">
      <Card className="border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <Avatar
              src={liveUser?.avatarUrl ?? liveUser?.avatar}
              name={liveUser?.fullName ?? "Learner"}
              userId={liveUser?.id}
              role={liveUser?.role === "mentor" ? "mentor" : "student"}
              size="lg"
              className="border-2 border-zinc-200"
            />
            <Link
              to={getSettingsPath(liveUser?.role ?? "student")}
              aria-label="Change avatar in settings"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-900/50 opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" size={16} />
            </Link>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">{liveUser?.fullName ?? "Learner"}</h1>
            <p className="mt-0.5 text-xs text-zinc-500">{liveUser?.email}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {isStudent ? (
                <>
                  <Badge variant="outline" size="sm">
                    {getRankTitle(level)}
                  </Badge>
                  <Badge variant="default" size="sm">
                    Level {level}
                  </Badge>
                  <Badge variant="success" size="sm">
                    {xp.toLocaleString()} XP
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="default" size="sm" className="capitalize font-semibold">
                    {liveUser?.role?.replace("_", " ") ?? "Staff"}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {liveUser?.isVerified ? "Verified" : "Active"}
                  </Badge>
                  {liveUser?.status && (
                    <Badge variant="success" size="sm" className="capitalize">
                      {liveUser.status}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
          <Link to={getSettingsPath(liveUser?.role ?? "student")}>
            <Button variant="outline" size="sm" className="text-xs text-zinc-700 gap-1.5">
              <Edit3 size={13} /> Edit Profile
            </Button>
          </Link>
        </div>
      </Card>

      {isStudent ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">{track?.title ?? "Current Track"}</h2>
              <Link
                to="/app/tracks"
                className="text-xs font-semibold text-[#b91c1c] hover:text-[#991b1b] hover:underline"
              >
                {track ? "View track" : "Browse tracks"}
              </Link>
            </div>
            {track ? (
              <>
                <ProgressBar value={completion} max={100} className="mt-4" />
                <p className="mt-2 text-xs text-zinc-500">
                  {completion}% complete · {track.lessons.completed}/{track.lessons.total} lessons
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">Enroll in a track to see your progress here.</p>
            )}
          </Card>

          <Card className="border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Recent Achievements</h2>
              <Link
                to="/app/progress"
                className="text-xs font-semibold text-[#b91c1c] hover:text-[#991b1b] hover:underline"
              >
                View all
              </Link>
            </div>
            {badges.length ? (
              <div className="mt-4 space-y-2">
                {badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge._id ?? badge.name}
                    className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5"
                  >
                    <Award size={14} className="text-[#b91c1c] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{badge.name}</p>
                      <p className="text-[10px] text-zinc-400 capitalize">{badge.category ?? "achievement"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No badges yet" description="Earn your first badge by completing lessons." />
            )}
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Account Information</h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Account Type</span>
                <span className="font-semibold text-zinc-900 capitalize">{liveUser?.role?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Email Address</span>
                <span className="font-medium text-zinc-900">{liveUser?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Account Status</span>
                <span className="font-semibold text-zinc-900 capitalize">{liveUser?.status ?? "active"}</span>
              </div>
              {liveUser?.bio && (
                <div className="pt-1">
                  <span className="text-zinc-500 block mb-1">Bio</span>
                  <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">{liveUser.bio}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Quick Navigation</h2>
            <div className="mt-4 space-y-2">
              <Link
                to={getSettingsPath(liveUser?.role ?? "student")}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
              >
                <span>Edit Account & Password Settings</span>
                <span>→</span>
              </Link>
              <Link
                to={
                  liveUser?.role === "mentor"
                    ? "/mentor"
                    : liveUser?.role === "parent"
                      ? "/parent"
                      : ["admin", "super_admin", "moderator", "reviewer", "support"].includes(liveUser?.role ?? "")
                        ? "/admin"
                        : "/app/dashboard"
                }
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
              >
                <span>Return to Role Dashboard</span>
                <span>→</span>
              </Link>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2">
        {isStudent && (
          <Link to="/app/certificates" className="block group">
            <Card className="border-zinc-200 bg-white p-4 transition-all hover:border-zinc-400 hover:shadow-md shadow-sm">
              <p className="text-xs font-medium text-zinc-500">Certificates</p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-900 group-hover:text-[#b91c1c] transition-colors">
                View earned certificates →
              </p>
            </Card>
          </Link>
        )}
        <Link to={getSettingsPath(liveUser?.role ?? "student")} className="block group">
          <Card className="border-zinc-200 bg-white p-4 transition-all hover:border-zinc-400 hover:shadow-md shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Settings</p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-900 group-hover:text-[#b91c1c] transition-colors">
              Manage account & privacy →
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
