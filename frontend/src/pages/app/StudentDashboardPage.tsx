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
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Top Welcome Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">Welcome back, {firstName}</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            {currentStreak > 0
              ? `${currentStreak}-day learning streak active. Continue building your track milestones.`
              : "Let's build something great today. Pick up where you left off."}
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] px-3 py-1.5">
            <Flame className="text-amber-400" size={14} />
            <span className="text-xs font-semibold text-white">{currentStreak}</span>
            <span className="text-[11px] text-zinc-500">Day Streak</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] px-3 py-1.5">
            <Zap className="text-emerald-400" size={14} />
            <span className="text-xs font-semibold text-white">{userXp.toLocaleString()}</span>
            <span className="text-[11px] text-zinc-500">XP (Lvl {userLevel})</span>
          </div>

          <Link to="/leaderboard">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#0E0E11] px-3 py-1.5 hover:border-zinc-700 transition-colors">
              <Trophy className="text-indigo-400" size={14} />
              <span className="text-xs font-semibold text-white">#{data?.leaderboardPosition ?? "12"}</span>
              <span className="text-[11px] text-zinc-500">Rank</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left 2 Cols: Main Learning Activity */}
        <div className="space-y-5 lg:col-span-2">
          {/* Live Classroom Alert / Quick Join Card */}
          {activeMeeting ? (
            <Card
              className={cn(
                "rounded-xl border p-4 transition-all",
                activeMeeting.status === "active"
                  ? "border-emerald-500/30 bg-[#0E0E11] shadow-sm"
                  : "border-[#27272A] bg-[#0E0E11]",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {activeMeeting.status === "active" ? (
                      <Badge variant="success" size="sm" className="gap-1 font-medium">
                        <Radio size={11} className="animate-pulse" /> Live Session Now
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm" className="gap-1">
                        <Video size={11} /> Upcoming Session
                      </Badge>
                    )}
                    <span className="text-xs text-zinc-400">
                      {new Date(activeMeeting.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold text-white truncate">
                    {activeMeeting.title || "Interactive Mentor Session"}
                  </h2>

                  <p className="text-xs text-zinc-400">
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
                      size="sm"
                      className={cn(
                        "gap-1.5 font-medium",
                        activeMeeting.status === "active" && "bg-emerald-600 hover:bg-emerald-500 text-white",
                      )}
                    >
                      <Radio size={13} className={activeMeeting.status === "active" ? "animate-pulse" : ""} />
                      {activeMeeting.status === "active" ? "Join Classroom" : "Enter Room"}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Active Track Progress & Next Recommended Lesson */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                    Active Track
                  </span>
                  <Badge variant="default" size="sm">
                    In Progress
                  </Badge>
                </div>
                <h2 className="mt-1 text-base font-bold text-white">{trackTitle}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {completedLessons} of {totalLessons} lessons completed ({completion}% complete)
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold font-mono text-white">{completion}%</span>
              </div>
            </div>

            <ProgressBar value={completion} max={100} className="mt-3.5 h-1.5 bg-[#27272A]" />

            {/* Recommended Next Lesson Box */}
            <div className="mt-4 rounded-lg border border-[#27272A] bg-[#141418] p-3.5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Next Up</span>
                    <span className="text-[11px] text-zinc-500">· ~20 mins</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {currentTrack?.title
                      ? `Mastering State & Event Handlers in ${currentTrack.title}`
                      : "Building Interactive Components & State Management"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Earn <span className="font-semibold text-emerald-400">+50 XP</span> upon completion
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/workspace"}>
                    <Button size="sm" className="gap-1 font-medium">
                      <Play size={13} className="fill-current" />
                      Resume Lesson
                    </Button>
                  </Link>
                  <Link to="/app/workspace">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Code2 size={13} />
                      IDE
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* ─── Physical Hub Arrival & Access Pass Widget ─── */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#141418] text-indigo-400 border border-[#27272A]">
                    <Building2 size={13} />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                    Physical Hub Arrival & Pass
                  </span>
                  {hubCheckedIn ? (
                    <Badge variant="success" size="sm" className="font-medium">
                      Checked In Today
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      Pass Active
                    </Badge>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white pt-0.5">Addis Ababa Bole Tech Hub · Desk #B-14</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <MapPin size={12} className="text-zinc-500" />
                  Bole Medhanialem Tech Park, Floor 3 · Open 08:30 AM – 08:00 PM
                </p>
              </div>

              {/* Hub Access Actions */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                {hubCheckedIn ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={14} />
                    Verified Arrival (+50 XP)
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleHubCheckIn}
                    className="gap-1 font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Zap size={13} />
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
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#27272A]">
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5">
                <span className="text-[10px] font-medium text-zinc-500 block">Mesh Pass ID</span>
                <span className="font-mono text-xs font-semibold text-zinc-200">PASS-ET-9482</span>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5">
                <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                  <Wifi size={11} className="text-emerald-400" /> Fiber WiFi
                </span>
                <span className="text-xs font-semibold text-zinc-200">EthioTech-5G-Hub</span>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5">
                <span className="text-[10px] font-medium text-zinc-500 block">Workstation</span>
                <span className="text-xs font-semibold text-zinc-200">Dual Monitor + UPS</span>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 block">QR Gate Pass</span>
                  <span className="text-xs font-semibold text-emerald-400">Ready to Scan</span>
                </div>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-500"
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/app/workspace" className="group">
              <Card className="h-full rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 transition-all hover:border-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                  <Code2 size={16} />
                </div>
                <h3 className="mt-2.5 text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  Coding Workspace
                </h3>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  In-browser editor, terminal runner, and multi-language presets.
                </p>
              </Card>
            </Link>

            <Link to="/app/projects" className="group">
              <Card className="h-full rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 transition-all hover:border-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                  <BookOpen size={16} />
                </div>
                <h3 className="mt-2.5 text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  Project Portfolio
                </h3>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Ship real-world portfolio tasks and get mentor review code scores.
                </p>
              </Card>
            </Link>

            <Link to="/app/progress" className="group">
              <Card className="h-full rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 transition-all hover:border-zinc-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                  <Trophy size={16} />
                </div>
                <h3 className="mt-2.5 text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  Progress & Badges
                </h3>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  Skill mastery radar, verified certificates, and achievement history.
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Col: Streak, Daily Challenge & Squad Activity */}
        <div className="space-y-5">
          {/* Daily XP Streak Card */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#141418] text-amber-400 border border-[#27272A]">
                  <Flame size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Daily Streak</h3>
                  <p className="text-[10px] text-zinc-500">Best: {longestStreak} days</p>
                </div>
              </div>
              <span className="text-base font-bold font-mono text-amber-400">{currentStreak}d</span>
            </div>

            {/* Weekly Streak Dots */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[#141418] border border-[#27272A] p-2.5">
              {daysOfWeek.map((day, idx) => {
                const isActive = idx <= currentDayIndex && currentStreak > 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-zinc-500">{day}</span>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all",
                        isActive
                          ? "bg-amber-400 text-black font-bold"
                          : idx === currentDayIndex
                            ? "border border-dashed border-amber-400/50 text-amber-400"
                            : "bg-[#0E0E11] border border-[#27272A] text-zinc-600",
                      )}
                    >
                      {isActive ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-center text-[11px] text-zinc-500">
              Solve 1 challenge today to keep your streak active.
            </p>
          </Card>

          {/* Today's Daily Challenge Card */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-indigo-400" />
                <h3 className="text-xs font-semibold text-white">Daily Challenge</h3>
              </div>
              {dailyChallengeCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <CheckCircle2 size={13} /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <Sparkles size={12} /> +{dailyChallenge?.xpReward ?? 25} XP
                </span>
              )}
            </div>

            <p className="mt-2 text-xs font-medium text-zinc-200">
              {dailyChallenge?.title ?? "Practice Daily Problem"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
              {dailyChallenge?.description ??
                "Complete one lesson quiz, submit coding task code, or ask a question in your squad."}
            </p>

            {dailyChallengeCompleted ? (
              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 py-2 text-center text-xs font-medium text-emerald-400">
                Challenge Reward Claimed
              </div>
            ) : (
              <Button
                size="sm"
                className="mt-3 w-full font-medium"
                disabled={completeChallengeMutation.isPending}
                onClick={() => completeChallengeMutation.mutate()}
              >
                {completeChallengeMutation.isPending ? "Claiming XP…" : "Claim +25 XP Reward"}
              </Button>
            )}
          </Card>

          {/* Squad Activity Card */}
          <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-indigo-400" />
                <h3 className="text-xs font-semibold text-white">Squad Activity</h3>
              </div>
              <Link
                to={squadPath || "/app/squads"}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                Open Hub <ArrowRight size={11} />
              </Link>
            </div>

            <div className="mt-2.5 rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {squad?.name || "Alpha Code Squad #4"}
                </span>
                <Badge variant="default" size="sm">
                  {squad?.groupXP ? `${squad.groupXP.toLocaleString()} XP` : "1,420 XP"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Active peers collaborating on track milestones and live study sessions.
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#27272A] pt-2 text-xs text-zinc-400">
                <span>4 active discussions</span>
                <Link to={squadPath || "/app/squads"} className="text-indigo-400 hover:text-white transition-colors">
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
