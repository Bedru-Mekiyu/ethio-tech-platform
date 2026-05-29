import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { completeDailyChallenge } from "@/services/gamificationService";
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
import { usePageTitle } from "@/hooks/usePageTitle";
import { motion } from "framer-motion";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="h-[28rem] rounded-[24px]" />
        <Skeleton className="h-[28rem] rounded-[24px]" />
      </div>
      <Skeleton className="h-32 rounded-[20px]" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="h-[24rem] rounded-[20px]" />
        <Skeleton className="h-[24rem] rounded-[20px]" />
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
    <motion.div
      whileHover={{ y: -3, scale: 1.01, borderColor: "rgba(0,210,255,0.2)" }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 cursor-pointer hover:bg-white/8 hover:shadow-[0_8px_20px_rgba(0,210,255,0.04)]"
    >
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <span className="text-primary">{icon}</span>
        <span className="text-[10px] uppercase font-bold tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white tracking-tight">{value}</p>
    </motion.div>
  );
}

export function StudentDashboardPage() {
  usePageTitle("Dashboard");
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { classroomPath, squadPath } = useQuickNavLinks();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const completeChallengeMutation = useMutation({
    mutationFn: completeDailyChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const dashboard = data as StudentDashboardData | undefined;
  const firstName =
    dashboard?.user?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Learner";
  const currentTrack = dashboard?.progressByTrack?.[0];
  const latestSubmission = dashboard?.recentSubmissions?.[0];
  const currentStreak = dashboard?.streak?.currentStreak ?? 0;
  const completion = currentTrack?.overallProgressPercent ?? 0;
  const onboarding = dashboard?.onboarding;
  const dailyChallenge = dashboard?.dailyChallenge;
  const dailyChallengeCompleted = dashboard?.dailyChallengeCompleted ?? false;
  const nextActions = dashboard?.nextActions ?? [];
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top Section */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <motion.div variants={cardVariants} className="h-full">
          <Card className="hero-shell relative overflow-hidden p-6 h-full border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,210,255,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.1),transparent_35%)]" />
            <div className="relative flex flex-col h-full justify-between">
              <div>
                <Badge className="mb-4" showDot variant="purple">Current learning path</Badge>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                      Welcome back, {firstName}
                    </h1>
                    <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                      Keep your momentum going. The next milestone is close, and your mentors are already
                      tracking your progress.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3 backdrop-blur-sm shadow-sm select-none">
                    <p className="text-[10px] uppercase font-bold tracking-[0.24em] text-[var(--text-muted)]">
                      Rank
                    </p>
                    <p className="mt-1 text-base font-bold text-primary">
                      {getRankTitle(dashboard?.user?.level ?? user?.level ?? 1)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                      Level {dashboard?.user?.level ?? user?.level ?? 1}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)]/50 p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                      <Badge variant={currentTrack ? "default" : "purple"} className="mb-3">
                        {currentTrack ? "In progress" : "Pick a track"}
                      </Badge>
                      <h2 className="text-xl font-bold text-white tracking-tight">{currentTitle}</h2>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {currentSubtitle}
                      </p>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                        <span>Progress</span>
                        <span className="text-white font-bold">{completion}%</span>
                      </div>
                      <ProgressBar value={completion} max={100} showGlow color="gradient" size="sm" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/tracks"}>
                        <Button size="md" className="font-semibold shadow-sm">
                          {currentTrack ? "Continue learning" : "Browse tracks"}
                        </Button>
                      </Link>
                      <Link to={latestSubmission ? "/app/sessions" : "/app/achievements"}>
                        <Button variant="outline" size="md" className="font-semibold">
                          {latestSubmission ? "View latest feedback" : "See achievements"}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <StatChip
                      label="XP"
                      value={`${(dashboard?.user?.xp ?? user?.xp ?? 0).toLocaleString()} XP`}
                      icon={<Sparkles size={15} />}
                    />
                    <StatChip
                      label="Leaderboard"
                      value={`#${dashboard?.leaderboardPosition ?? 0}`}
                      icon={<Trophy size={15} />}
                    />
                    <StatChip
                      label="Badges"
                      value={`${recentBadges.length}`}
                      icon={<Award size={15} />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="surface-panel overflow-hidden p-0 border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl h-full min-h-[28rem] relative">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.12),rgba(6,10,18,0.94))]" />
            <img
              src={heroImage}
              alt="Immersive dashboard preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full border border-primary/25 bg-[rgba(5,10,20,0.86)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary font-bold shadow-sm">
              Live learning
            </div>
            <Card className="absolute right-4 top-4 max-w-[180px] border-primary/20 bg-[rgba(8,14,24,0.92)] p-4 shadow-lg backdrop-blur-[4px]">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)]">
                Active sessions
              </p>
              <p className="mt-1 text-2xl font-bold text-white">{upcomingSessions.length}</p>
              <p className="text-xs font-semibold text-success mt-0.5">Mentor rooms ready</p>
            </Card>
            <Card className="absolute bottom-4 left-4 right-4 border-secondary/15 bg-[rgba(8,14,24,0.92)] p-4 shadow-lg backdrop-blur-[6px]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <PlayCircle size={20} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-[0.22em] text-[var(--text-muted)]">
                    Next action
                  </p>
                  <p className="truncate text-sm font-bold text-white mt-0.5">
                    {currentTrack ? "Continue your current module" : "Join your first learning track"}
                  </p>
                </div>
              </div>
            </Card>
          </Card>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <motion.div variants={cardVariants}>
        <Card className="surface-panel grid gap-4 p-4 md:grid-cols-4 border border-white/5 bg-[rgba(16,20,28,0.3)] shadow-md">
          {[
            {
              title: "Current streak",
              value: `${currentStreak} days`,
              desc: currentStreak > 0 ? "Keep the rhythm alive." : "Start today to build momentum.",
            },
            {
              title: "Recent XP",
              value: `${dashboard?.recentXp?.length ?? 0}`,
              desc: "XP events earned from your recent tasks.",
            },
            {
              title: "Focus mode",
              value: currentTrack ? "Active" : "Ready",
              desc: "Designed for deep work & reviews.",
            },
            {
              title: "Sessions ready",
              value: `${upcomingSessions.length}`,
              desc: "Live virtual classrooms available.",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2, scale: 1.005, borderColor: "rgba(255,255,255,0.15)" }}
              className="rounded-2xl border border-[var(--border)] bg-white/3 p-4 transition-colors duration-200"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{stat.title}</p>
              <p className="mt-2 text-2xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </Card>
      </motion.div>

      {/* Middle Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <motion.div variants={cardVariants}>
          <Card className="surface-panel p-6 border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge variant="purple" showDot>Launch checklist</Badge>
                <h2 className="mt-3.5 text-2xl font-bold text-white tracking-tight">Onboarding progress</h2>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  The fastest path to a useful learning loop is track enrollment, one lesson, one project, one session, and one squad.
                </p>
              </div>
              <div className="min-w-[185px] shrink-0 rounded-2xl border border-primary/15 bg-primary/8 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Checklist Complete</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {onboarding?.completed ?? 0}/{onboarding?.total ?? 0}
                </p>
                <ProgressBar value={onboarding?.percent ?? 0} max={100} color="primary" size="sm" className="mt-3.5" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(onboarding?.items ?? []).map((item) => {
                const Icon = item.completed ? CheckCircle2 : Circle;
                return (
                  <Link key={item.key} to={item.href}>
                    <motion.div
                      whileHover={{ x: 3, scale: 1.005, borderColor: "rgba(0,210,255,0.25)", backgroundColor: "rgba(255,255,255,0.06)" }}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/4 p-4 transition-all duration-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-3 text-xs font-semibold text-white">
                        <Icon size={18} className={item.completed ? "text-success shrink-0" : "text-[var(--text-muted)] shrink-0"} />
                        {item.label}
                      </span>
                      <ArrowRight size={15} className="text-[var(--text-muted)] shrink-0" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="surface-panel p-6 border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl">
            <Badge variant="success" showDot>Daily challenge</Badge>
            <h2 className="mt-3.5 text-2xl font-bold text-white tracking-tight">
              {dailyChallenge?.title ?? "Build a habit today"}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {dailyChallenge?.description ??
                "Complete one lesson, review one project requirement, or ask one useful question in your squad to keep your streak alive."}
            </p>
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white/3 p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Streaking Reward</p>
              <p className="mt-2 text-lg font-bold text-success">+{dailyChallenge?.xpReward ?? 25} XP</p>
            </div>
            <div className="mt-5">
              {dailyChallengeCompleted ? (
                <p className="flex items-center gap-2 text-xs font-semibold text-success bg-success/8 border border-success/15 rounded-xl px-4 py-3 shadow-sm select-none">
                  <CheckCircle2 size={16} />
                  Challenge claimed! Fantastic work today.
                </p>
              ) : (
                <Button
                  className="w-full font-bold shadow-sm"
                  disabled={completeChallengeMutation.isPending || !dailyChallenge}
                  onClick={() => completeChallengeMutation.mutate()}
                >
                  {completeChallengeMutation.isPending ? "Claiming reward…" : "Claim daily challenge XP"}
                </Button>
              )}
              {completeChallengeMutation.isError ? (
                <p className="mt-2 text-xs font-medium text-danger">Could not complete challenge. Try again.</p>
              ) : null}
            </div>
            <div className="mt-5 space-y-2.5">
              {(nextActions.length ? nextActions : [{ label: "Open your learning track", href: "/app/tracks" }]).map((action) => (
                <Link key={`${action.href}-${action.label}`} to={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.005, borderColor: "rgba(0,210,255,0.25)" }}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/4 px-4 py-3.5 text-xs font-semibold text-white transition-all duration-200"
                  >
                    {action.label}
                    <ArrowRight size={15} className="text-primary shrink-0" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Live & Achievements Bottom Section */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <motion.div variants={cardVariants}>
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.45)] p-6 shadow-xl h-full flex flex-col justify-between">
            <div>
              <CardHeader className="mb-6 p-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white tracking-tight">Upcoming live sessions</CardTitle>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                    Stay connected to mentor-led sessions and collaborative classroom work.
                  </p>
                </div>
                <Link to="/app/sessions" className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors shrink-0">
                  View all
                </Link>
              </CardHeader>

              {upcomingSessions.length ? (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 3).map((session, index) => (
                    <div
                      key={session._id ?? `${session.title}-${index}`}
                      className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-white/3 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="purple" size="sm" showDot>Live cohort</Badge>
                          <span className="text-[11px] text-[var(--text-muted)] font-medium">
                            {session.scheduledAt ? timeFormatter.format(new Date(session.scheduledAt)) : "Scheduled soon"}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-white tracking-tight">{session.title}</h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {session.status === "live" ? "Mentor is already online." : "Join when the room opens."}
                        </p>
                      </div>
                      {session._id ? (
                        <Link to={`/app/classroom/${session._id}`} className="shrink-0">
                          <Button size="sm" className="w-full md:w-auto font-semibold shadow-sm">
                            Join now
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No live sessions scheduled"
                  description="Your mentor or cohort will appear here as soon as sessions are published."
                  actionLabel="Browse tracks"
                  onAction={() => navigate("/app/tracks")}
                />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.45)] p-6 shadow-xl flex flex-col justify-between">
            <div>
              <CardHeader className="mb-6 p-0 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white tracking-tight">Recent badges</CardTitle>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                    Recognition from lessons, projects, sessions, and XP milestones.
                  </p>
                </div>
                <Link to="/app/achievements" className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors shrink-0">
                  View all
                </Link>
              </CardHeader>

              {recentBadges.length ? (
                <div className="grid gap-3">
                  {recentBadges.slice(0, 3).map((badge, index) => {
                    const meta = getBadgeMeta(badge.category);
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={badge._id ?? `${badge.name}-${index}`}
                        whileHover={{ x: 2 }}
                        className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white/3 p-4"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-sm">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-white leading-tight">{badge.name}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {badge.category ? badge.category : "Achievement unlocked"}
                          </p>
                        </div>
                        <Badge variant={meta.tone} size="sm" showDot>{badge.category ?? "badge"}</Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No badges yet"
                  description="Finish lessons, participate in sessions, and ship projects to unlock recognition."
                  actionLabel="Open tracks"
                  onAction={() => navigate("/app/tracks")}
                />
              )}

              {dashboard?.recentXp?.length ? (
                <div className="mt-6 rounded-xl border border-[var(--border)] bg-white/4 p-4 shadow-inner">
                  <div className="mb-3.5 flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    XP Stream
                  </div>
                  <div className="space-y-3">
                    {dashboard.recentXp.slice(0, 3).map((event, index) => (
                      <div key={`${event.reason}-${event.createdAt}-${index}`} className="flex items-start justify-between gap-4 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-white leading-snug truncate">{event.reason}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {timeFormatter.format(new Date(event.createdAt))}
                          </p>
                        </div>
                        <p className="font-bold text-success shrink-0 font-mono">+{event.amount} XP</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Community Pulse Card */}
      <motion.div variants={cardVariants}>
        <Card className="grid gap-6 rounded-2xl border border-white/5 bg-[linear-gradient(185deg,rgba(16,23,37,0.7),rgba(8,12,20,0.85))] p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,210,255,0.06),transparent_35%)] pointer-events-none" />
          <div className="relative">
            <Badge variant="success" showDot>Community pulse</Badge>
            <h3 className="mt-3.5 text-2xl font-bold text-white tracking-tight">Your squad and mentors are ready when you are.</h3>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
              Keep momentum with live classrooms, collaboration rooms, and mentor feedback loops that
              stay synchronized across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 relative z-10">
            <Link to={classroomPath}>
              <Button className="font-bold shadow-sm">Join classroom</Button>
            </Link>
            <Link to={squadPath}>
              <Button variant="outline" className="font-bold">Open squad room</Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

