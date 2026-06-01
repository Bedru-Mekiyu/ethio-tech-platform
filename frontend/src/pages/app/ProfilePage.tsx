import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, Crown, Edit3, Medal, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";
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
import { getDashboardPath, getSettingsPath } from "@/store/authStore";
import { getRankTitle } from "@/lib/utils";
import { motion } from "framer-motion";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-[24px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-[16px]" />
        <Skeleton className="h-24 rounded-[16px]" />
        <Skeleton className="h-24 rounded-[16px]" />
        <Skeleton className="h-24 rounded-[16px]" />
      </div>
      <Skeleton className="h-80 rounded-[24px]" />
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMyProfile,
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-0">
          <div className="relative h-56 md:h-72 lg:h-96">
            <SmartImage
              unsplashId={MEDIA_CATEGORIES.dashboard.stats.xp}
              alt="Profile banner"
              className="h-full w-full object-cover"
              wrapperClassName="h-full w-full border-0 bg-transparent"
              width={1200}
              quality={85}
              hoverEffect="zoom"
            />
          </div>

          <div className="relative -mt-14 px-6 pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-5">
                <div className="relative group shrink-0 select-none">
                  <Avatar
                    src={liveUser?.avatarUrl ?? liveUser?.avatar}
                    name={liveUser?.fullName ?? "Learner"}
                    userId={liveUser?.id}
                    role={liveUser?.role === "mentor" ? "mentor" : "student"}
                    size="xl"
                    className="h-28 w-28 rounded-2xl border-4 border-[var(--bg-base)] text-2xl shadow-xl group-hover:scale-105 transition-all duration-300"
                  />
                  <Link
                    to={getSettingsPath(liveUser?.role ?? "student")}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    aria-label="Change avatar in settings"
                    title="Change Avatar"
                  >
                    <Camera className="text-white h-6 w-6 transform scale-75 group-hover:scale-100 transition-transform duration-200 drop-shadow-lg" />
                  </Link>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Profile</p>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1.5">{liveUser?.fullName ?? "Learner"}</h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">{liveUser?.email ?? "No email on file"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="purple" size="sm">{getRankTitle(level)}</Badge>
                    <Badge variant="success" size="sm">Level {level}</Badge>
                    <Badge variant="default" size="sm">#{rank || "--"}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link to={getSettingsPath(liveUser?.role ?? "student")}>
                  <Button variant="outline" className="font-semibold shadow-sm">
                    <Edit3 size={15} className="mr-0.5" />
                    Edit profile
                  </Button>
                </Link>
                <Link to={getDashboardPath(liveUser?.role ?? "student")}>
                  <Button className="font-semibold shadow-sm">
                    Open dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Overview Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: <Sparkles size={15} />, label: "XP", value: xp.toLocaleString() },
          { icon: <Crown size={15} />, label: "Rank", value: `#${rank || "--"}` },
          { icon: <ShieldCheck size={15} />, label: "Streak", value: `${streak} days` },
          { icon: <Medal size={15} />, label: "Badges", value: `${badges.length}` },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -3, scale: 1.01, borderColor: "rgba(0,210,255,0.2)" }}
            className="rounded-2xl border border-[var(--border)] bg-[rgba(16,20,28,0.45)] p-4 shadow-sm cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <span className="text-primary">{stat.icon}</span>
              <span className="text-[10px] uppercase font-bold tracking-[0.22em]">{stat.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <Badge variant="purple" showDot>Learning progress</Badge>
                  <h2 className="mt-3 text-xl font-bold text-white tracking-tight">{track?.title ?? "No active track"}</h2>
                </div>
                <Badge variant="success">{completion}% complete</Badge>
              </div>
              <ProgressBar value={completion} max={100} showGlow color="gradient" size="md" />
              
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Lessons", value: `${track?.lessons.completed ?? 0}/${track?.lessons.total ?? 0}` },
                  { label: "Projects", value: `${track?.projects.approved ?? 0}/${track?.projects.total ?? 0}` },
                  { label: "Next tier", value: getRankTitle(level + 1) },
                ].map((c, i) => (
                  <Card key={i} className="border border-[var(--border)] bg-white/4 p-4 shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{c.label}</p>
                    <p className="mt-2 text-base font-bold text-white truncate">{c.value}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              {badges.length ? (
                badges.slice(0, 4).map((badge) => (
                  <div key={badge._id ?? badge.name} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/3 p-4">
                    <div>
                      <p className="font-semibold text-xs text-white leading-tight">{badge.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 capitalize">{badge.category ?? "achievement"}</p>
                    </div>
                    <Badge variant="success" size="sm" showDot>Earned</Badge>
                  </div>
                ))
              ) : (
                <EmptyState title="No badges yet" description="Earn your first badge by completing lessons and projects." />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-6">
            <Badge variant="purple" showDot>Recent activity</Badge>
            <h2 className="mt-3.5 text-xl font-bold text-white tracking-tight">Latest momentum</h2>
            <div className="mt-4 space-y-2.5">
              {recentActivity.length ? (
                recentActivity.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--border)] bg-white/3 p-4">
                    <p className="text-xs font-semibold text-white leading-snug">{item.reason}</p>
                    <p className="mt-1 text-[11px] font-bold text-success font-mono">
                      +{item.amount.toLocaleString()} XP
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title="No recent activity" description="Your latest actions will appear here." />
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-6">
            <Badge variant="success">Profile actions</Badge>
            <div className="mt-4.5 flex flex-col gap-2.5">
              <Link to="/app/achievements">
                <Button className="w-full font-semibold" variant="outline">
                  Open achievements
                </Button>
              </Link>
              <Link to="/app/settings">
                <Button className="w-full font-semibold" variant="primary">
                  Manage settings
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-secondary)] font-medium">
              Account access is role-based, and profile updates stay consistent across the learning workspace.
            </p>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
