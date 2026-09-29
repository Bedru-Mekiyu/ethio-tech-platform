import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Code2,
  Flame,
  MapPin,
  Play,
  Radio,
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
import { fetchMyHubBookings } from "@/services/hubsService";
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

  const { data: myBookings } = useQuery({
    queryKey: ["hubs", "myBookings"],
    queryFn: fetchMyHubBookings,
    enabled: !!user,
  });

  const activeBooking = useMemo(() => {
    if (!myBookings || myBookings.length === 0) return null;
    return myBookings.find((b) => b.status === "confirmed" || b.status === "checked_in") || null;
  }, [myBookings]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-slate-900"
    >
      {/* Top Welcome Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Welcome back, {firstName}</h1>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            {currentStreak > 0
              ? `${currentStreak}-day learning streak active. Continue building your track milestones.`
              : "Let's build something great today. Pick up where you left off."}
          </p>
        </div>

        {/* Quick Stat Badges & Planner Shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/app/calendar">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold shadow-xs whitespace-nowrap"
            >
              <CalendarDays size={13} />
              Study Planner
            </Button>
          </Link>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-xs">
            <Flame className="text-amber-500" size={14} />
            <span className="text-xs font-semibold text-slate-900">{currentStreak}</span>
            <span className="text-[11px] text-slate-600 font-medium">Day Streak</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-xs">
            <Zap className="text-[var(--secondary)]" size={14} />
            <span className="text-xs font-semibold text-slate-900">{userXp.toLocaleString()}</span>
            <span className="text-[11px] text-slate-600 font-medium">XP (Lvl {userLevel})</span>
          </div>

          <Link to="/leaderboard">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-xs hover:border-slate-300 transition-colors">
              <Trophy className="text-amber-600" size={14} />
              <span className="text-xs font-semibold text-slate-900">#{data?.leaderboardPosition ?? "—"}</span>
              <span className="text-[11px] text-slate-600 font-medium">Rank</span>
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
                "rounded-2xl border p-4.5 transition-all shadow-sm",
                activeMeeting.status === "active" ? "border-slate-300 bg-slate-50/70" : "border-slate-200/80 bg-white",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {activeMeeting.status === "active" ? (
                      <Badge
                        variant="default"
                        size="sm"
                        className="gap-1 font-semibold bg-slate-900 text-white shadow-xs"
                      >
                        <Radio size={11} className="animate-pulse" /> Live Session Now
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="gap-1 border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                      >
                        <Video size={11} /> Upcoming Session
                      </Badge>
                    )}
                    <span className="text-xs text-slate-600 font-medium font-mono">
                      {new Date(activeMeeting.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {activeMeeting.title || "Interactive Mentor Session"}
                  </h2>

                  <p className="text-xs text-slate-600 font-medium">
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
                        "gap-1.5 font-semibold shadow-xs",
                        activeMeeting.status === "active" && "bg-slate-900 hover:bg-slate-800 text-white",
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
          <Card className="rounded-2xl border-slate-200/80 bg-white p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 font-medium">
                    Active Track
                  </span>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                  >
                    In Progress
                  </Badge>
                </div>
                <h2 className="mt-1 text-base font-bold text-slate-900">{trackTitle}</h2>
                <p className="mt-0.5 text-xs text-slate-600 font-medium">
                  {completedLessons} of {totalLessons} lessons completed ({completion}% complete)
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold font-mono text-[var(--secondary)]">{completion}%</span>
              </div>
            </div>

            <ProgressBar value={completion} max={100} className="mt-3.5 h-2 bg-slate-100" />

            {/* Recommended Next Lesson Box */}
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-xs">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Next Up</span>
                    <span className="text-[11px] text-slate-600 font-medium">· ~20 mins</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentTrack?.title
                      ? `Mastering State & Event Handlers in ${currentTrack.title}`
                      : "Building Interactive Components & State Management"}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Earn <span className="font-semibold text-[var(--secondary)]">+50 XP</span> upon completion
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={currentTrack?.trackId ? `/app/tracks/${currentTrack.trackId}` : "/app/workspace"}>
                    <Button size="sm" className="gap-1 font-semibold shadow-xs whitespace-nowrap">
                      <Play size={13} className="fill-current" />
                      Resume Lesson
                    </Button>
                  </Link>
                  <Link to="/app/workspace">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-slate-200/80 bg-white font-semibold shadow-xs hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Code2 size={13} />
                      IDE
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* ─── Assigned Projects & Tasks ─── */}
          <Card className="rounded-2xl border-slate-200/80 bg-white p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100">
                  <BookOpen size={14} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Assigned Projects & Portfolio Tasks</h3>
              </div>
              <Link
                to="/app/projects"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                View All <ArrowRight size={11} />
              </Link>
            </div>

            {data?.assignedProjects && data.assignedProjects.length > 0 ? (
              <div className="mt-3.5 space-y-2.5">
                {data.assignedProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.projectId}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">{project.title}</span>
                        {project.difficulty && (
                          <Badge
                            variant="outline"
                            size="sm"
                            className="text-[10px] font-medium border-slate-200 bg-white"
                          >
                            {project.difficulty}
                          </Badge>
                        )}
                        <Badge
                          variant={project.category === "completed" ? "secondary" : "outline"}
                          size="sm"
                          className={cn(
                            "text-[10px] font-semibold",
                            project.category === "completed"
                              ? "border-emerald-200 bg-emerald-50/70 text-emerald-700"
                              : "border-slate-200 bg-white",
                          )}
                        >
                          {project.submissionStatus || project.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">{project.trackTitle}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[var(--secondary)]">
                          {project.completionPercent}%
                        </span>
                      </div>
                      <Link to="/app/projects">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2.5 border-slate-200 bg-white font-semibold shadow-xs hover:bg-slate-50 whitespace-nowrap"
                        >
                          Open Task
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3.5 rounded-xl border border-dashed border-slate-200 p-5 text-center bg-slate-50/40">
                <p className="text-xs text-slate-600 font-semibold">No individual project assignments pending.</p>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium">
                  Build production capstones and earn mentor reviews to populate your verified Skill Passport.
                </p>
                <Link to="/app/projects" className="mt-2.5 inline-block">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-slate-200 bg-white font-semibold shadow-xs hover:bg-slate-50 whitespace-nowrap"
                  >
                    Browse Project Catalog
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* ─── Physical Hub Arrival & Access Pass Widget ─── */}
          {activeBooking ? (
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100">
                      <Building2 size={14} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      Physical Hub Arrival & Pass
                    </span>
                    {activeBooking.status === "checked_in" || hubCheckedIn ? (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="border-emerald-200 bg-emerald-50/70 text-emerald-700 font-semibold"
                      >
                        Checked In Today
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                      >
                        Pass Active
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 pt-0.5">
                    {activeBooking.hubCity} Tech Hub · {activeBooking.workstationLabel}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-600 font-medium" />
                    {activeBooking.hubAddress} · Slot: {activeBooking.slotLabel} ({activeBooking.slotTimeRange})
                  </p>
                </div>

                {/* Hub Access Actions */}
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  {activeBooking.status === "checked_in" || hubCheckedIn ? (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Verified Arrival (+50 XP)
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleHubCheckIn}
                      className="gap-1 font-semibold shadow-xs whitespace-nowrap"
                    >
                      <Zap size={13} />
                      Check In (+50 XP)
                    </Button>
                  )}

                  <Link to="/hubs">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-200/80 bg-white hover:bg-slate-50 font-semibold shadow-xs whitespace-nowrap"
                    >
                      Book / Switch Desk
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hub Hardware & Connection Specs */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 border-t border-slate-100">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider block">
                    Pass Code
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">{activeBooking.passCode}</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider flex items-center gap-1">
                    <Wifi size={11} className="text-[var(--secondary)]" /> Connection
                  </span>
                  <span className="text-xs font-bold text-slate-800">High-Speed Fiber</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider block">
                    Visit Date
                  </span>
                  <span className="text-xs font-bold text-slate-800">{activeBooking.visitDate}</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 shadow-xs">
                  <span className="text-[10px] font-semibold text-slate-600 font-medium uppercase tracking-wider block">
                    Slot
                  </span>
                  <span className="text-xs font-bold text-slate-800">{activeBooking.slotLabel}</span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100">
                      <Building2 size={14} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      Regional Learning Hubs
                    </span>
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                    >
                      Free Access
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 pt-0.5">
                    Need reliable fiber internet or uninterrupted power?
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Reserve a workstation, GPU compute rig, or study desk at any of our regional learning hubs across
                    Ethiopia.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link to="/hubs">
                    <Button size="sm" className="gap-1 font-semibold shadow-xs whitespace-nowrap">
                      <Building2 size={13} />
                      Reserve Hub Seat
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Platform Navigation Shortcuts */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/app/workspace" className="group">
              <Card className="h-full rounded-xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-md shadow-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100 group-hover:scale-105 transition-transform">
                  <Code2 size={16} />
                </div>
                <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                  Coding Workspace
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium leading-relaxed">
                  In-browser editor, terminal runner, and multi-language presets.
                </p>
              </Card>
            </Link>

            <Link to="/app/projects" className="group">
              <Card className="h-full rounded-xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-md shadow-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100 group-hover:scale-105 transition-transform">
                  <BookOpen size={16} />
                </div>
                <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                  Project Portfolio
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium leading-relaxed">
                  Ship real-world portfolio tasks and get mentor review code scores.
                </p>
              </Card>
            </Link>

            <Link to="/app/calendar" className="group">
              <Card className="h-full rounded-xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-md shadow-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100 group-hover:scale-105 transition-transform">
                  <CalendarDays size={16} />
                </div>
                <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                  Study Planner
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium leading-relaxed">
                  Sprint calendar, study blocks, and mentor session schedule.
                </p>
              </Card>
            </Link>

            <Link to="/app/progress" className="group">
              <Card className="h-full rounded-xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-md shadow-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100 group-hover:scale-105 transition-transform">
                  <Trophy size={16} />
                </div>
                <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                  Progress & Badges
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium leading-relaxed">
                  Skill mastery radar, verified certificates, and achievement history.
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Col: Streak, Daily Challenge & Squad Activity */}
        <div className="space-y-5">
          {/* Daily XP Streak Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                  <Flame size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Daily Streak</h3>
                  <p className="text-[10px] text-slate-600 font-medium">Best: {longestStreak} days</p>
                </div>
              </div>
              <span className="text-base font-bold font-mono text-amber-600">{currentStreak}d</span>
            </div>

            {/* Weekly Streak Dots */}
            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 shadow-2xs">
              {daysOfWeek.map((day, idx) => {
                const isActive = idx <= currentDayIndex && currentStreak > 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-600 font-medium">{day}</span>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all",
                        isActive
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : idx === currentDayIndex
                            ? "border border-dashed border-slate-400 text-slate-800 bg-slate-100"
                            : "bg-white border border-slate-200 text-slate-600 font-medium",
                      )}
                    >
                      {isActive ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-center text-[11px] text-slate-600 font-medium">
              Solve 1 challenge today to keep your streak active.
            </p>
          </Card>

          {/* Today's Daily Challenge Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-[var(--secondary)]" />
                <h3 className="text-xs font-bold text-slate-900">Daily Challenge</h3>
              </div>
              {dailyChallengeCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--secondary)]">
                  <Zap size={12} /> +{dailyChallenge?.xpReward ?? 25} XP
                </span>
              )}
            </div>

            <p className="mt-2 text-xs font-bold text-slate-800">{dailyChallenge?.title ?? "Practice Daily Problem"}</p>
            <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
              {dailyChallenge?.description ??
                "Complete one lesson quiz, submit coding task code, or ask a question in your squad."}
            </p>

            {dailyChallengeCompleted ? (
              <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 py-2.5 text-center text-xs font-semibold text-emerald-800">
                Challenge Reward Claimed
              </div>
            ) : (
              <Button
                size="sm"
                className="mt-3 w-full font-semibold shadow-xs whitespace-nowrap"
                disabled={completeChallengeMutation.isPending}
                onClick={() => completeChallengeMutation.mutate()}
              >
                {completeChallengeMutation.isPending ? "Claiming XP…" : "Claim +25 XP Reward"}
              </Button>
            )}
          </Card>

          {/* Squad Activity Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-[var(--secondary)]" />
                <h3 className="text-xs font-bold text-slate-900">Squad Activity</h3>
              </div>
              <Link
                to={squadPath || "/app/squads"}
                className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 font-semibold"
              >
                Open Hub <ArrowRight size={11} />
              </Link>
            </div>

            {squad ? (
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 truncate">{squad.name}</span>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-blue-200/80 bg-blue-50/70 text-[var(--secondary)] font-semibold"
                  >
                    {squad.groupXP ? `${squad.groupXP.toLocaleString()} XP` : "0 XP"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">
                  Active squad peers collaborating on track milestones and peer code reviews.
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs text-slate-600 font-medium">
                  <span className="font-medium">{squad.members?.length || squad.memberCount || 1} members</span>
                  <Link
                    to={squadPath || "/app/squads"}
                    className="text-slate-900 font-semibold hover:text-primary transition-colors"
                  >
                    Open Squad Hub →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center bg-slate-50/40">
                <p className="text-xs text-slate-600 font-semibold">Not assigned to a study squad</p>
                <p className="mt-0.5 text-[11px] text-slate-600 font-medium">
                  Collaborate in 4–6 person peer squads with shared code reviews and sprint check-ins.
                </p>
                <Link to={squadPath || "/app/squads"} className="mt-2.5 inline-block">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-slate-200 bg-white font-semibold shadow-xs hover:bg-slate-50 whitespace-nowrap"
                  >
                    Join or Create Squad
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
