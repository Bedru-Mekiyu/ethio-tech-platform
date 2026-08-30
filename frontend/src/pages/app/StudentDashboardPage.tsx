import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Code2,
  Flame,
  MapPin,
  Play,
  Radio,
  Sparkles,
  Target,
  Trophy,
  Users,
  Video,
  Wifi,
  Zap,
} from "lucide-react";

import { fetchStudentDashboard } from "@/services/dashboardService";
import { completeDailyChallenge } from "@/services/gamificationService";
import { fetchMyPeerGroups } from "@/services/peerGroupsService";
import { useAuthStore } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { useMeetings } from "@/hooks/useMeetings";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

export function StudentDashboardPage() {
  usePageTitle("Student Dashboard");
  const user = useAuthStore((s) => s.user);
  const { classroomPath, squadPath } = useQuickNavLinks();
  const queryClient = useQueryClient();

  // Hub Check-In state
  const todayKey = new Date().toISOString().slice(0, 10);
  const [hubCheckedIn, setHubCheckedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hub_checkin_${todayKey}`) === "true";
    } catch {
      return false;
    }
  });
  const [hubXpAwarded, setHubXpAwarded] = useState<boolean>(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });

  const { data: squadGroups } = useQuery({
    queryKey: ["peerGroups", "mine"],
    queryFn: fetchMyPeerGroups,
    enabled: !!user,
  });

  const completeChallengeMutation = useMutation({
    mutationFn: completeDailyChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });

  const activeMeeting = useMemo(() => {
    return upcomingMeetings.find((m) => m.status === "active") || upcomingMeetings[0];
  }, [upcomingMeetings]);

  const squad = squadGroups?.[0];

  const handleHubCheckIn = () => {
    setHubCheckedIn(true);
    setHubXpAwarded(true);
    try {
      localStorage.setItem(`hub_checkin_${todayKey}`, "true");
    } catch {
      // ignore storage errors
    }
  };

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <DashboardSkeleton />;

  const firstName = data?.user?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Learner";
  const currentTrack = data?.progressByTrack?.[0];
  const currentStreak = data?.streak?.currentStreak ?? user?.level ?? 0;
  const longestStreak = data?.streak?.longestStreak ?? currentStreak;
  const completion = currentTrack?.overallProgressPercent ?? 0;
  const dailyChallenge = data?.dailyChallenge;
  const dailyChallengeCompleted = data?.dailyChallengeCompleted ?? false;
  const userXp = (user?.xp ?? 0) + (hubXpAwarded ? 50 : 0);
  const userLevel = user?.level ?? 1;

  const trackTitle = currentTrack?.title ?? "Full-Stack Web Development";
  const completedLessons = currentTrack?.lessons?.completed ?? 0;
  const totalLessons = currentTrack?.lessons?.total ?? 12;

  // Days of week active visual
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {currentStreak > 0
              ? `${currentStreak}-day learning streak active. Continue building your track milestones.`
              : "Let's build something great today. Pick up where you left off."}
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2">
            <Flame className="text-amber-400" size={16} />
            <span className="text-sm font-semibold text-slate-100">{currentStreak}</span>
            <span className="text-xs text-slate-400">Day Streak</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2">
            <Zap className="text-emerald-400" size={16} />
            <span className="text-sm font-semibold text-slate-100">{userXp.toLocaleString()}</span>
            <span className="text-xs text-slate-400">XP (Lvl {userLevel})</span>
          </div>

          <Link to="/leaderboard">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 hover:border-slate-700 transition-colors">
              <Trophy className="text-indigo-400" size={16} />
              <span className="text-sm font-semibold text-slate-100">
                #{data?.leaderboardPosition ?? "12"}
              </span>
              <span className="text-xs text-slate-400">Rank</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main Learning Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Live Classroom Alert / Quick Join Card */}
          {activeMeeting ? (
            <Card
              className={cn(
                "rounded-2xl border p-5 transition-all",
                activeMeeting.status === "active"
                  ? "border-emerald-500/30 bg-slate-900/95 shadow-sm"
                  : "border-slate-800 bg-slate-900/90",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    {activeMeeting.status === "active" ? (
                      <Badge variant="success" className="gap-1 px-2 py-0.5 font-medium">
                        <Radio size={12} className="animate-pulse" /> Live Session Now
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1 px-2 py-0.5">
                        <Video size={12} /> Upcoming Session
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(activeMeeting.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-slate-100 truncate">
                    {activeMeeting.title || "Interactive Mentor Session"}
                  </h2>

                  <p className="text-xs text-slate-400">
                    Mentor: {activeMeeting.mentorName || "Instructor"} · Live coding & Q&A
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={
                      activeMeeting.id
                        ? `/app/classroom/${activeMeeting.id}`
                        : activeMeeting.sessionId
                          ? `/app/classroom/${activeMeeting.sessionId}`
                          : classroomPath
                    }
                  >
                    <Button
                      variant="primary"
                      className={cn(
                        "gap-2 font-medium",
                        activeMeeting.status === "active" && "bg-emerald-600 hover:bg-emerald-500 text-white",
                      )}
                    >
                      <Radio size={15} className={activeMeeting.status === "active" ? "animate-pulse" : ""} />
                      {activeMeeting.status === "active" ? "Join Classroom" : "Enter Room"}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Active Track Progress & Next Recommended Lesson */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    Active Track
                  </span>
                  <Badge variant="default" className="text-[10px] py-0 px-2">
                    In Progress
                  </Badge>
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-slate-100">{trackTitle}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {completedLessons} of {totalLessons} lessons completed ({completion}% complete)
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold text-slate-100">{completion}%</span>
              </div>
            </div>

            <ProgressBar value={completion} max={100} className="mt-4 h-2" />

            {/* Recommended Next Lesson Box */}
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                      Next Up
                    </span>
                    <span className="text-[11px] text-slate-400">· ~20 mins</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {currentTrack?.title
                      ? `Mastering State & Event Handlers in ${currentTrack.title}`
                      : "Building Interactive Components & State Management"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Earn <span className="font-semibold text-emerald-400">+50 XP</span> upon completion
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={
                      currentTrack?.trackId
                        ? `/app/tracks/${currentTrack.trackId}`
                        : "/app/coding-workspace"
                    }
                  >
                    <Button size="sm" className="gap-1.5 font-medium">
                      <Play size={14} className="fill-current" />
                      Resume Lesson
                    </Button>
                  </Link>
                  <Link to="/app/coding-workspace">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Code2 size={14} />
                      IDE
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* ─── Physical Hub Arrival & Access Pass Widget ─── */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Building2 size={16} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Physical Hub Arrival & Pass
                  </span>
                  {hubCheckedIn ? (
                    <Badge variant="success" className="text-[10px] py-0 px-2 font-medium">
                      Checked In Today
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] py-0 px-2">
                      Pass Active
                    </Badge>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-100 pt-1">
                  Addis Ababa Bole Tech Hub · Desk #B-14
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  Bole Medhanialem Tech Park, Floor 3 · Open 08:30 AM – 08:00 PM
                </p>
              </div>

              {/* Hub Access Actions */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                {hubCheckedIn ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={15} />
                    Verified Arrival (+50 XP)
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleHubCheckIn}
                    className="gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Zap size={14} />
                    Check In (+50 XP)
                  </Button>
                )}

                <Link to="/hubs">
                  <Button size="sm" variant="outline" className="text-xs">
                    Book / Switch Desk
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hub Hardware & Connection Specs */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-800/80">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                <span className="text-[10px] font-medium text-slate-400 block">Mesh Pass ID</span>
                <span className="font-mono text-xs font-semibold text-slate-200">PASS-ET-9482</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Wifi size={11} className="text-emerald-400" /> Fiber WiFi
                </span>
                <span className="text-xs font-semibold text-slate-200">EthioTech-5G-Hub</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
                <span className="text-[10px] font-medium text-slate-400 block">Workstation</span>
                <span className="text-xs font-semibold text-slate-200">Dual Monitor + UPS</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">QR Gate Pass</span>
                  <span className="text-xs font-semibold text-emerald-400">Ready to Scan</span>
                </div>
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                  aria-hidden="true"
                >
                  <rect width="5" height="5" x="3" y="3" rx="1" />
                  <rect width="5" height="5" x="16" y="3" rx="1" />
                  <rect width="5" height="5" x="3" y="16" rx="1" />
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                  <path d="M21 21v.01" />
                  <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  <path d="M3 12h.01" />
                  <path d="M12 3h.01" />
                  <path d="M12 16v.01" />
                  <path d="M16 12h1" />
                  <path d="M21 12v.01" />
                  <path d="M12 21v-1" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Quick Platform Navigation Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/app/coding-workspace" className="group">
              <Card className="h-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
                  <Code2 size={18} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                  Coding Workspace
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  In-browser editor, terminal runner, and multi-language presets.
                </p>
              </Card>
            </Link>

            <Link to="/app/projects" className="group">
              <Card className="h-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                  <BookOpen size={18} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                  Project Portfolio
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Ship real-world portfolio tasks and get mentor review code scores.
                </p>
              </Card>
            </Link>

            <Link to="/app/progress" className="group">
              <Card className="h-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Trophy size={18} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                  Progress & Badges
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Skill mastery radar, verified certificates, and achievement history.
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Col: Streak, Daily Challenge & Squad Activity */}
        <div className="space-y-6">
          {/* Daily XP Streak Card */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Flame size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Daily Streak</h3>
                  <p className="text-[11px] text-slate-400">Best: {longestStreak} days</p>
                </div>
              </div>
              <span className="text-xl font-bold text-amber-400">{currentStreak}d</span>
            </div>

            {/* Weekly Streak Dots */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950/50 p-3">
              {daysOfWeek.map((day, idx) => {
                const isActive = idx <= currentDayIndex && currentStreak > 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400">{day}</span>
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                        isActive
                          ? "bg-amber-400 text-slate-950 font-bold"
                          : idx === currentDayIndex
                            ? "border border-dashed border-amber-400/50 text-amber-400"
                            : "bg-slate-800/80 text-slate-500",
                      )}
                    >
                      {isActive ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Solve 1 challenge today to keep your streak active.
            </p>
          </Card>

          {/* Today's Daily Challenge Card */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Daily Challenge</h3>
              </div>
              {dailyChallengeCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={14} /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <Sparkles size={13} /> +{dailyChallenge?.xpReward ?? 25} XP
                </span>
              )}
            </div>

            <p className="mt-3 text-sm font-medium text-slate-200">
              {dailyChallenge?.title ?? "Practice Daily Problem"}
            </p>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {dailyChallenge?.description ??
                "Complete one lesson quiz, submit coding task code, or ask a question in your squad."}
            </p>

            {dailyChallengeCompleted ? (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-center text-xs font-semibold text-emerald-400">
                Challenge Reward Claimed
              </div>
            ) : (
              <Button
                className="mt-4 w-full"
                disabled={completeChallengeMutation.isPending}
                onClick={() => completeChallengeMutation.mutate()}
              >
                {completeChallengeMutation.isPending ? "Claiming XP…" : "Claim +25 XP Reward"}
              </Button>
            )}
          </Card>

          {/* Squad Activity Card */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100">Squad Activity</h3>
              </div>
              <Link
                to={squadPath || "/app/squads"}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                Open Hub <ArrowRight size={12} />
              </Link>
            </div>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {squad?.name || "Alpha Code Squad #4"}
                </span>
                <Badge variant="default" className="text-[10px] py-0 px-2">
                  {squad?.groupXP ? `${squad.groupXP.toLocaleString()} XP` : "1,420 XP"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Active peers collaborating on track milestones and live study sessions.
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                <span>4 active discussions</span>
                <Link to={squadPath || "/app/squads"} className="text-indigo-400 hover:text-slate-100 transition-colors">
                  Join Chat →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


