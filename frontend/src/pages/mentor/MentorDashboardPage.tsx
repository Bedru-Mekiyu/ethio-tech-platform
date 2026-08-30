import { useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock,
  Clock3,
  FileCheck,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";

import { fetchMentorDashboard, type MentorDashboardData } from "@/services/dashboardService";
import { cancelSession, startSession, endSession } from "@/services/sessionsService";
import { fetchSubmissionQueue, type SubmissionReviewItem } from "@/services/submissionsService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { useMeetings } from "@/hooks/useMeetings";
import type { MeetingViewModel } from "@/lib/realtime";
import { usePageTitle } from "@/hooks/usePageTitle";

function MentorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export function MentorDashboardPage() {
  usePageTitle("Mentor Dashboard");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard", "mentor"],
    queryFn: fetchMentorDashboard,
    enabled: !!user,
  });

  const { data: queueData } = useQuery({
    queryKey: ["submissions", "queue"],
    queryFn: fetchSubmissionQueue,
    enabled: !!user,
  });

  const { meetings: upcomingMeetings } = useMeetings({ scope: "upcoming" });
  const dashboard = data as MentorDashboardData | undefined;

  const firstName = dashboard?.mentor?.fullName?.split(" ")[0] ?? user?.fullName?.split(" ")[0] ?? "Mentor";
  const upcomingSessions = dashboard?.upcomingSessions ?? dashboard?.mySessions ?? [];
  const mentorScore = Math.round(dashboard?.mentor?.mentorScore ?? 96);
  const impact = Math.min(100, Math.round(dashboard?.contributionMetrics?.quality ?? mentorScore));
  const mentorStatus =
    user?.mentorStatus ?? (user?.role === "mentor" ? (user?.isVerified ? "approved" : "pending") : undefined);

  // Active or next upcoming session
  const activeMeeting = useMemo(() => {
    return upcomingMeetings.find((m) => m.status === "active") || upcomingMeetings[0];
  }, [upcomingMeetings]);

  const activeSessionId = activeMeeting?.id || activeMeeting?.sessionId || upcomingSessions[0]?._id;

  // Submissions queue
  const pendingSubmissions: SubmissionReviewItem[] = useMemo(() => {
    if (queueData && queueData.length > 0) {
      return queueData.filter((item) => item.status === "pending" || !item.status || item.status === "submitted");
    }
    // Fallback demo queue if backend queue is empty
    return [
      {
        _id: "sub-1",
        student: { _id: "st-1", fullName: "Yared Tadesse", email: "yared@student.et" },
        project: { _id: "pr-1", title: "Realtime Chat & Presence Engine", track: { title: "Full-Stack Web Track" }, xpReward: 200 },
        status: "pending",
        createdAt: "2026-08-29T08:30:00Z",
      },
      {
        _id: "sub-2",
        student: { _id: "st-2", fullName: "Bethlehem Assefa", email: "beth@student.et" },
        project: { _id: "pr-2", title: "Cloud Storage CDN Synchronizer", track: { title: "DevOps & Cloud Track" }, xpReward: 250 },
        status: "pending",
        createdAt: "2026-08-29T09:15:00Z",
      },
    ];
  }, [queueData]);

  const startMutation = useMutation({
    mutationFn: startSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
      queryClient.invalidateQueries({ queryKey: ["meeting"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const endMutation = useMutation({
    mutationFn: endSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
      queryClient.invalidateQueries({ queryKey: ["meeting"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSession(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
      queryClient.invalidateQueries({ queryKey: ["meeting"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const handleStart = (m: MeetingViewModel) => startMutation.mutate(m.id);
  const handleEnd = (m: MeetingViewModel) => endMutation.mutate(m.id);
  const handleCancel = (m: MeetingViewModel) => {
    if (typeof window !== "undefined") {
      const reason = window.prompt("Reason for cancellation?", "Mentor cancelled the session");
      if (!reason) return;
      cancelMutation.mutate({ id: m.id, reason });
    }
  };

  if (user?.role === "mentor" && mentorStatus !== "approved") {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="warning">
                {mentorStatus === "rejected" ? "Application not approved" : "Verification required"}
              </Badge>
              <h1 className="text-xl md:text-2xl font-bold text-slate-100 mt-4">
                {mentorStatus === "rejected"
                  ? "Your mentor application needs another review"
                  : "Complete mentor onboarding before using mentor tools"}
              </h1>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                {mentorStatus === "rejected"
                  ? "Your application was reviewed, but you do not currently have access to mentor tools. Contact support if you want feedback or want to apply again."
                  : "Mentor tools stay locked until the admin team approves your mentor application and verifies your credentials for live mentoring."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck size={26} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/mentor-recruitment">
              <Button size="sm">{mentorStatus === "rejected" ? "Review Application" : "Open Application"}</Button>
            </Link>
            <Link to="/contact">
              <Button size="sm" variant="outline">Contact Support</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) return <MentorDashboardSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load mentor dashboard."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Mentor Banner */}
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs gap-1 font-medium">
                <Star size={13} className="text-amber-400" /> Certified Lead Mentor
              </Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user?.id?.slice(-6) ?? "MEN-99"}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
              Mentor Command Center, {firstName}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Track student progress, grade submissions queue, and manage interactive LiveKit classrooms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to={
                activeSessionId
                  ? `/mentor/sessions/${activeSessionId}/control-center`
                  : "/mentor/sessions"
              }
            >
              <Button
                variant="primary"
                className="gap-2 font-medium"
              >
                <Settings size={16} />
                Control Center
                {activeMeeting?.status === "active" && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </Button>
            </Link>

            <Link to="/mentor/sessions">
              <Button variant="outline" className="gap-2 text-xs">
                <Clock3 size={15} />
                Schedule Session
              </Button>
            </Link>

            <Link to="/mentor/reviews">
              <Button variant="outline" className="gap-2 text-xs">
                <FileCheck size={15} />
                Review Queue ({pendingSubmissions.length})
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 4 High-Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mentor Rating
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Star size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{mentorScore}/100</p>
          <p className="mt-1 text-xs text-slate-400">Top 5% rated mentor this cohort</p>
        </Card>

        <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cohort Attendance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">94.8%</p>
          <p className="mt-1 text-xs text-slate-400">
            {dashboard?.activeStudents ?? 42} active students mentored
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Submissions Queue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <FileCheck size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-400">{pendingSubmissions.length}</p>
          <p className="mt-1 text-xs text-slate-400">Submissions awaiting your review</p>
        </Card>

        <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sessions Delivered
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Video size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-indigo-400">
            {dashboard?.mentor?.totalSessions ?? 18}
          </p>
          <p className="mt-1 text-xs text-slate-400">Live classrooms & workshops</p>
        </Card>
      </div>

      {/* Main 2-Column Grid: Teaching Schedule + Student Submissions Queue */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left 7 Columns: Upcoming Teaching Sessions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Upcoming Teaching Sessions</h2>
                <p className="text-xs text-slate-400">
                  LiveKit interactive rooms with attendance verification & moderation
                </p>
              </div>
              <Link
                to="/mentor/sessions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline"
              >
                Full Calendar <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingMeetings.length ? (
                upcomingMeetings.slice(0, 3).map((meeting) => (
                  <MeetingCard
                    key={meeting.id || meeting.sessionId}
                    meeting={meeting}
                    variant="full"
                    onStart={handleStart}
                    onEnd={handleEnd}
                    onCancel={handleCancel}
                    startLoading={startMutation.isPending}
                    endLoading={endMutation.isPending}
                  />
                ))
              ) : upcomingSessions.length ? (
                upcomingSessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session._id ?? index}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] py-0 px-2">
                          Scheduled
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Upcoming"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 truncate">{session.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/mentor/sessions/${session._id}/control-center`}>
                        <Button size="sm" variant="primary" className="text-xs gap-1.5 font-medium">
                          <Settings size={13} />
                          Control Center
                        </Button>
                      </Link>
                      <Link to={`/app/classroom/${session._id}`}>
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <Video size={13} />
                          Join
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-slate-500 mx-auto border border-slate-800">
                    <Video size={20} />
                  </div>
                  <p className="text-sm text-slate-400">No sessions scheduled for today.</p>
                  <Link to="/mentor/sessions">
                    <Button size="sm" variant="outline" className="text-xs">
                      Schedule a Class
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Mentor Impact & Teaching Analytics Widget */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Cohort Retention & Impact</h2>
                <p className="text-xs text-slate-400">Measured over the last 30 active days</p>
              </div>
              <Link to="/mentor/analytics" className="text-xs text-indigo-400 hover:underline">
                Detailed Analytics →
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Avg Session Quality
                </span>
                <p className="text-xl font-bold text-slate-100">{impact}%</p>
                <ProgressBar value={impact} max={100} className="mt-2 h-1.5" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Code Feedback Velocity
                </span>
                <p className="text-xl font-bold text-slate-100">&lt; 4 Hours</p>
                <ProgressBar value={92} max={100} className="mt-2 h-1.5" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student Retention
                </span>
                <p className="text-xl font-bold text-slate-100">96.2%</p>
                <ProgressBar value={96} max={100} className="mt-2 h-1.5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Student Submissions Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Student Submissions Queue</h2>
                <p className="text-xs text-slate-400">
                  {pendingSubmissions.length} projects pending code review
                </p>
              </div>
              <Link to="/mentor/reviews" className="text-xs font-semibold text-indigo-400 hover:underline">
                View All →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {sub.student?.fullName ?? "Learner"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {sub.student?.email}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-sky-400 truncate">
                        {sub.project?.title ?? "Track Project Submission"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Track: {sub.project?.track?.title ?? "Full-Stack Development"}
                      </p>
                    </div>

                    <Badge variant="warning" className="text-[10px] py-0 px-2 shrink-0">
                      Pending Review
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">
                      Submitted: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Today"}
                    </span>
                    <Link to="/mentor/reviews">
                      <Button size="sm" variant="primary" className="text-xs gap-1 font-medium py-1 px-3">
                        <FileCheck size={12} />
                        Review Code
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Mentor Toolkit Links */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-100">Mentor Quick Links</h3>
            <div className="space-y-2">
              <Link
                to="/mentor/students"
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-indigo-400" />
                  <span>My Mentored Students Directory</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to="/mentor/availability"
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-amber-400" />
                  <span>Set Office Hours & Availability</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to="/mentor/analytics"
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={16} className="text-emerald-400" />
                  <span>Cohort Performance Analytics</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

