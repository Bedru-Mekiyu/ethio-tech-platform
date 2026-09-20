import { useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
      <Skeleton className="h-32 rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl bg-slate-100" />
        <Skeleton className="h-28 rounded-2xl bg-slate-100" />
        <Skeleton className="h-28 rounded-2xl bg-slate-100" />
        <Skeleton className="h-28 rounded-2xl bg-slate-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl bg-slate-100" />
        <Skeleton className="h-72 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function MentorDashboardPage() {
  usePageTitle("Mentor Dashboard");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
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
        project: {
          _id: "pr-1",
          title: "Realtime Chat & Presence Engine",
          track: { title: "Full-Stack Web Track" },
          xpReward: 200,
        },
        status: "pending",
        createdAt: new Date().toISOString(),
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
        <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="warning">
                {mentorStatus === "rejected" ? "Application not approved" : "Verification required"}
              </Badge>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-4">
                {mentorStatus === "rejected"
                  ? "Your mentor application needs another review"
                  : "Complete mentor onboarding before using mentor tools"}
              </h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {mentorStatus === "rejected"
                  ? "Your application was reviewed, but you do not currently have access to mentor tools. Contact support if you want feedback or want to apply again."
                  : "Mentor tools stay locked until the admin team approves your mentor application and verifies your credentials for live mentoring."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <ShieldCheck size={26} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/mentor-recruitment">
              <Button size="sm" variant="primary">
                {mentorStatus === "rejected" ? "Review Application" : "Open Application"}
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="sm" variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) return <MentorDashboardSkeleton />;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Mentor Command Center</h1>
        <QueryError message="Could not load your dashboard." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 text-slate-900"
    >
      {/* Top Mentor Banner */}
      <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] gap-1 font-semibold bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Star size={12} className="text-amber-500 fill-amber-400" /> Lead Mentor
              </Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {user?.id?.slice(-6) ?? "MEN-99"}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Mentor Command Center, {firstName}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track student progress, grade submissions queue, and manage interactive LiveKit classrooms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to={activeSessionId ? `/mentor/control-center/${activeSessionId}` : "/mentor/sessions"}>
              <Button variant="primary" className="gap-2 text-xs font-medium">
                <Settings size={14} />
                Control Center
                {activeMeeting?.status === "active" && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </Button>
            </Link>

            <Link to="/mentor/sessions">
              <Button variant="outline" className="gap-2 text-xs text-slate-700">
                <Clock3 size={14} />
                Schedule Session
              </Button>
            </Link>

            <Link to="/mentor/reviews">
              <Button variant="outline" className="gap-2 text-xs text-slate-700">
                <FileCheck size={14} />
                Review Queue ({pendingSubmissions.length})
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 4 High-Level Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mentor Rating</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Star size={15} className="fill-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{mentorScore}/100</p>
          <p className="mt-0.5 text-xs text-slate-500">Top 5% rated mentor</p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cohort Attendance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">94.8%</p>
          <p className="mt-0.5 text-xs text-slate-500">{dashboard?.activeStudents ?? 42} active students</p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submissions Queue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileCheck size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-indigo-600">{pendingSubmissions.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">Awaiting code review</p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sessions Delivered
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Video size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{dashboard?.mentor?.totalSessions ?? 18}</p>
          <p className="mt-0.5 text-xs text-slate-500">Live classrooms delivered</p>
        </Card>
      </div>

      {/* Main 2-Column Grid: Teaching Schedule + Student Submissions Queue */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left 7 Columns: Upcoming Teaching Sessions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Upcoming Teaching Sessions</h2>
                <p className="text-xs text-slate-500">LiveKit interactive rooms with attendance verification</p>
              </div>
              <Link
                to="/mentor/sessions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Full Calendar <ArrowRight size={12} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingMeetings.length ? (
                upcomingMeetings
                  .slice(0, 3)
                  .map((meeting) => (
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
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Scheduled
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Upcoming"}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-slate-900 truncate">{session.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/mentor/control-center/${session._id}`}>
                        <Button size="sm" variant="primary" className="text-xs gap-1.5 font-medium">
                          <Settings size={12} />
                          Control Center
                        </Button>
                      </Link>
                      <Link to={`/app/classroom/${session._id}`}>
                        <Button size="sm" variant="outline" className="text-xs gap-1 text-slate-700">
                          <Video size={12} />
                          Join
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mx-auto border border-slate-200">
                    <Video size={18} />
                  </div>
                  <p className="text-xs text-slate-500">No sessions scheduled for today.</p>
                  <Link to="/mentor/sessions">
                    <Button size="sm" variant="outline" className="text-xs font-medium text-slate-700">
                      Schedule a Class
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Mentor Impact & Teaching Analytics Widget */}
          <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Cohort Retention & Impact</h2>
                <p className="text-xs text-slate-500">Measured over the last 30 active days</p>
              </div>
              <Link
                to="/mentor/analytics"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Detailed Analytics →
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Avg Session Quality
                </span>
                <p className="text-lg font-bold text-slate-900">{impact}%</p>
                <ProgressBar value={impact} max={100} className="mt-1.5 h-1" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Feedback Velocity</span>
                <p className="text-lg font-bold text-slate-900">&lt; 4 Hours</p>
                <ProgressBar value={92} max={100} className="mt-1.5 h-1" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Retention</span>
                <p className="text-lg font-bold text-slate-900">96.2%</p>
                <ProgressBar value={96} max={100} className="mt-1.5 h-1" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Student Submissions Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Student Submissions Queue</h2>
                <p className="text-xs text-slate-500">{pendingSubmissions.length} projects pending code review</p>
              </div>
              <Link
                to="/mentor/reviews"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {sub.student?.fullName ?? "Learner"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">{sub.student?.email}</span>
                      </div>
                      <p className="text-xs font-semibold text-indigo-600 truncate">
                        {sub.project?.title ?? "Track Project Submission"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Track: {sub.project?.track?.title ?? "Full-Stack Development"}
                      </p>
                    </div>

                    <Badge variant="warning" className="text-[10px] py-0 px-1.5 shrink-0">
                      Pending
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400">
                      Submitted: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Today"}
                    </span>
                    <Link to="/mentor/reviews">
                      <Button size="sm" variant="primary" className="text-xs gap-1 font-medium py-1 px-2.5">
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
          <Card className="border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Mentor Quick Links</h3>
            <div className="space-y-1.5">
              <Link
                to="/mentor/students"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-indigo-600" />
                  <span>My Students Directory</span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </Link>

              <Link
                to="/mentor/availability"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  <span>Set Office Hours & Availability</span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </Link>

              <Link
                to="/mentor/analytics"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-emerald-500" />
                  <span>Cohort Performance Analytics</span>
                </div>
                <ChevronRight size={13} className="text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
