import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  ExternalLink,
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

function QueueAgeBadge({ createdAt }: { createdAt?: string }) {
  const [now] = useState(() => Date.now());
  if (!createdAt) return null;
  const elapsedMs = now - new Date(createdAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

  if (elapsedDays >= 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400">
        Needs review · {elapsedDays}d in queue
      </span>
    );
  }
  if (elapsedHours >= 24) {
    return <span className="text-[10px] font-medium text-slate-600">Waiting {elapsedDays}d</span>;
  }
  return <span className="text-[10px] font-medium text-emerald-700">New · {Math.max(1, elapsedHours)}h ago</span>;
}

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
  const mentorScore = dashboard?.mentor?.mentorScore ? Math.round(dashboard.mentor.mentorScore) : null;
  const impact = dashboard?.contributionMetrics?.quality
    ? Math.min(100, Math.round(dashboard.contributionMetrics.quality))
    : mentorScore;
  const mentorStatus =
    user?.mentorStatus ?? (user?.role === "mentor" ? (user?.isVerified ? "approved" : "pending") : undefined);

  // Active or next upcoming session
  const activeMeeting = useMemo(() => {
    return upcomingMeetings.find((m) => m.status === "active") || upcomingMeetings[0];
  }, [upcomingMeetings]);

  const activeSessionId = activeMeeting?.id || activeMeeting?.sessionId || upcomingSessions[0]?._id;

  // Submissions queue
  const pendingSubmissions: SubmissionReviewItem[] = useMemo(() => {
    if (!queueData) return [];
    return queueData.filter((item) => item.status === "pending" || !item.status || item.status === "submitted");
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
    const isRejected = mentorStatus === "rejected";
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 sm:py-10">
        <Card className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge variant={isRejected ? "outline" : "secondary"}>
                {isRejected ? "Application Status Update" : "Admissions Review in Progress"}
              </Badge>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isRejected
                  ? "Your mentor application needs another review"
                  : "Complete mentor onboarding before using mentor tools"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isRejected
                  ? "Your application was reviewed, but you do not currently have access to mentor tools. Contact support if you want feedback or want to apply again."
                  : "Mentor tools stay locked until the admin team approves your mentor application and verifies your credentials for live mentoring."}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
              <ShieldCheck size={26} />
            </div>
          </div>

          {/* Status Progression Checklist */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 sm:p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {isRejected ? "Review Outcome & Follow-Up:" : "Admissions Verification Status:"}
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Application details and professional credentials submitted</span>
              </li>
              <li className="flex items-center gap-2.5">
                {isRejected ? (
                  <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 ml-1 mr-0.5 shrink-0" />
                ) : (
                  <Clock3 size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />
                )}
                <span>
                  {isRejected
                    ? "Admissions review completed — feedback available upon request"
                    : "Mentor admissions verification in progress (typically 2–3 business days)"}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 ml-1 mr-0.5 shrink-0" />
                <span>
                  {isRejected
                    ? "Re-application eligible after further senior engineering experience"
                    : "Session controls, video rooms, and code review queue access unlocked"}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-white/10">
            <Link to="/mentor-recruitment">
              <Button size="md" variant="primary" className="font-semibold shadow-xs">
                {isRejected ? "Review Application" : "Open Application"}
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="md" variant="outline" className="font-semibold shadow-xs">
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
        <h1 className="text-2xl font-bold text-slate-900">Mentor Dashboard</h1>
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
      <Card className="border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm dark:shadow-[var(--shadow-live-indicator)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] gap-1 font-semibold bg-slate-100 text-slate-900 border-slate-200 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"
              >
                <Star size={12} className="text-amber-500 fill-amber-400" /> Lead Mentor
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-medium">
                ID: {user?.id?.slice(-6) ?? "MEN-99"}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Mentor Dashboard, {firstName}
            </h1>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {activeMeeting ? (
                <>
                  <span className="font-semibold text-slate-900">
                    {activeMeeting.status === "active" ? "Active room in progress" : "Upcoming session scheduled"}
                  </span>
                  {" · "}
                  {activeMeeting.title || "Live Mentorship Session"}
                  {" · "}
                </>
              ) : null}
              <span className={pendingSubmissions.length > 0 ? "font-semibold text-amber-700" : "text-slate-600"}>
                {pendingSubmissions.length === 1
                  ? "1 project submission awaiting code review"
                  : `${pendingSubmissions.length} project submissions awaiting review`}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to={activeSessionId ? `/mentor/control-center/${activeSessionId}` : "/mentor/sessions"}>
              <Button variant="primary" className="gap-2 text-xs font-medium">
                <Settings size={14} />
                Session Controls
                {activeMeeting?.status === "active" && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
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
                Review Queue
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 4 High-Level Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Mentor Rating</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400">
              <Star size={15} className="fill-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{mentorScore ? `${mentorScore}/100` : "—"}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            {mentorScore ? "Verified mentor evaluation" : "Awaiting student reviews"}
          </p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Cohort Engagement</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
              <Users size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {dashboard?.contributionMetrics?.engagement
              ? `${Math.round(dashboard.contributionMetrics.engagement)}%`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            {dashboard?.activeStudents !== undefined
              ? `${dashboard.activeStudents} active mentees`
              : "Assigned cohort mentees"}
          </p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Submissions Queue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
              <FileCheck size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{pendingSubmissions.length}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            {pendingSubmissions.length === 1
              ? "1 project awaiting review"
              : `${pendingSubmissions.length} projects awaiting review`}
          </p>
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Sessions Delivered
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
              <Video size={15} />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {dashboard?.mentor?.totalSessions ?? dashboard?.mySessions?.length ?? 0}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">Live classrooms delivered</p>
        </Card>
      </div>

      {/* Main 2-Column Grid: Teaching Schedule + Student Submissions Queue */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left 7 Columns: Upcoming Teaching Sessions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Upcoming Teaching Sessions</h2>
                <p className="text-xs font-medium text-slate-600">
                  LiveKit interactive rooms with attendance verification
                </p>
              </div>
              <Link
                to="/mentor/sessions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
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
                    />
                  ))
              ) : upcomingSessions.length ? (
                upcomingSessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-3.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900 border border-slate-200 shrink-0 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                        <Video size={16} />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{session.title}</p>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-500" />
                            {new Date(session.scheduledAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock3 size={11} className="text-slate-500" />
                            {new Date(session.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 mt-2 sm:mt-0">
                      <Link to={`/mentor/control-center/${session._id}`}>
                        <Button size="sm" variant="outline" className="text-xs gap-1 py-1 px-2 text-slate-700">
                          <Settings size={12} /> Controls
                        </Button>
                      </Link>
                      <Link to={`/app/classroom/${session._id}`}>
                        <Button size="sm" variant="primary" className="text-xs gap-1 py-1 px-2.5 font-medium">
                          Launch <ExternalLink size={12} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:bg-white/[0.02] dark:border-white/10">
                  <Clock3 size={28} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-medium text-slate-600">No upcoming live classrooms scheduled</p>
                  <Link to="/mentor/sessions">
                    <Button size="sm" variant="outline" className="mt-3 text-xs">
                      Schedule New Session
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Mentor Impact & Teaching Analytics Widget */}
          <Card className="border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Cohort Retention & Impact</h2>
                <p className="text-xs font-medium text-slate-600">Measured over the last 30 active days</p>
              </div>
              <Link to="/mentor/students" className="text-xs font-semibold text-primary hover:underline">
                View Students →
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Session Quality</span>
                <p className="text-lg font-bold text-slate-900">{impact ? `${impact}%` : "—"}</p>
                <ProgressBar value={impact ?? 0} max={100} className="mt-1.5 h-1" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Reviews Delivered</span>
                <p className="text-lg font-bold text-slate-900">
                  {dashboard?.contributionMetrics?.feedbackCount
                    ? `${dashboard.contributionMetrics.feedbackCount} reviews`
                    : "Active Queue"}
                </p>
                <ProgressBar
                  value={dashboard?.contributionMetrics?.feedbackCount ? 100 : 0}
                  max={100}
                  className="mt-1.5 h-1"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Mentee Engagement</span>
                <p className="text-lg font-bold text-slate-900">
                  {dashboard?.contributionMetrics?.engagement
                    ? `${Math.round(dashboard.contributionMetrics.engagement)}%`
                    : "—"}
                </p>
                <ProgressBar value={dashboard?.contributionMetrics?.engagement ?? 0} max={100} className="mt-1.5 h-1" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Student Submissions Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Student Submissions Queue</h2>
                <p className="text-xs font-medium text-slate-600">
                  {pendingSubmissions.length} projects pending code review
                </p>
              </div>
              <Link to="/mentor/reviews" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {pendingSubmissions.length > 0 ? (
                pendingSubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-3.5 space-y-2.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {sub.student?.fullName ?? "Learner"}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono font-medium truncate">
                            {sub.student?.email}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {sub.project?.title ?? "Track Project Submission"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-600">
                          Track: {sub.project?.track?.title ?? "Core Track"}
                        </p>
                      </div>

                      <Badge variant="warning" className="text-[10px] py-0 px-1.5 shrink-0">
                        Pending
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-slate-500">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Recently"}
                        </span>
                        <QueueAgeBadge createdAt={sub.createdAt} />
                      </div>
                      <Link to="/mentor/reviews">
                        <Button size="sm" variant="primary" className="text-xs gap-1 font-medium py-1 px-2.5">
                          <FileCheck size={12} />
                          Review Code
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:bg-white/[0.02] dark:border-white/10">
                  <FileCheck size={28} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Review queue is clear</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                    No student submissions awaiting code review.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Mentor Toolkit Links */}
          <Card className="border-slate-200 bg-white p-4 space-y-2.5 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Mentor Quick Links</h3>
            <div className="space-y-1.5">
              <Link
                to="/mentor/students"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-2.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-900" />
                  <span>My Students Directory</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>

              <Link
                to="/mentor/availability"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-2.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  <span>Set Office Hours & Availability</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>

              <Link
                to="/mentor/reviews"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-white/[0.02] dark:border-white/10 p-2.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileCheck size={14} className="text-slate-900" />
                  <span>Student Code Review Queue</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
