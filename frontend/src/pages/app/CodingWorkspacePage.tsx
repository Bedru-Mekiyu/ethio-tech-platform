import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Code2,
  Layers3,
  PlayCircle,
  Rocket,
  MessageSquareText,
  FileCode2,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { fetchTrackById, fetchLessonById, type TrackSummary, type LessonDetail } from "@/services/tracksService";

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[24px]" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Skeleton className="min-h-[32rem] rounded-[28px]" />
        <Skeleton className="min-h-[32rem] rounded-[28px]" />
      </div>
    </div>
  );
}

function buildStarterSnippet(lesson?: LessonDetail | null, track?: TrackSummary | null) {
  const componentName = (lesson?.title || track?.title || "LearningCard")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

  const lessonLabel = lesson?.title || track?.title || "Your lesson";
  return `export function ${componentName}() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Learning focus</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">${lessonLabel}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Keep the component small, accessible, and easy to review.
      </p>
    </section>
  );
}`;
}

export function CodingWorkspacePage() {
  const navigate = useNavigate();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;
  const primaryTrackId = dashboard?.progressByTrack?.[0]?.trackId ?? dashboard?.user?.enrolledTracks?.[0]?._id;

  const trackQuery = useQuery({
    queryKey: ["track", primaryTrackId],
    queryFn: () => fetchTrackById(primaryTrackId!),
    enabled: !!primaryTrackId,
  });

  const primaryTrack = trackQuery.data;
  const primaryLessonId = primaryTrack?.modules?.[0]?.lessons?.[0]?._id;

  const lessonQuery = useQuery({
    queryKey: ["lesson", primaryLessonId],
    queryFn: () => fetchLessonById(primaryLessonId!),
    enabled: !!primaryLessonId,
  });

  const lesson = lessonQuery.data;

  const snippet = useMemo(() => buildStarterSnippet(lesson ?? null, primaryTrack ?? null), [lesson, primaryTrack]);
  const progress = dashboard?.progressByTrack?.[0]?.overallProgressPercent ?? 0;
  const assignedProjects = dashboard?.assignedProjects ?? [];
  const recentSubmissions = dashboard?.recentSubmissions ?? [];

  if (dashboardQuery.isError || trackQuery.isError || lessonQuery.isError) {
    return (
      <QueryError
        message="Unable to load the workspace."
        onRetry={() => {
          void dashboardQuery.refetch();
          void trackQuery.refetch();
          void lessonQuery.refetch();
        }}
      />
    );
  }

  if (dashboardQuery.isLoading || (primaryTrackId && trackQuery.isLoading) || (primaryLessonId && lessonQuery.isLoading)) {
    return <WorkspaceSkeleton />;
  }

  if (!primaryTrack) {
    return (
      <EmptyState
        title="No active track yet"
        description="Enroll in a learning track to unlock the guided coding workspace."
        actionLabel="Browse tracks"
        onAction={() => {
          navigate("/app/tracks");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge className="mb-1">Lesson workspace</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {lesson?.title ?? primaryTrack.title ?? "Building your first React component"}
            </h1>
            <p className="max-w-2xl text-[var(--text-secondary)]">
              Work through the lesson, inspect the starter snippet, and keep your notes aligned with the current track.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={lesson?._id ? `/app/lessons/${lesson._id}` : `/app/tracks/${primaryTrack._id}`}>
                <Button>
                  <PlayCircle size={16} />
                  Continue lesson
                </Button>
              </Link>
              <Link to="/app/projects/submit">
                <Button variant="outline">
                  <Rocket size={16} />
                  Submit project
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[28rem]">
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Track</p>
              <p className="mt-2 text-lg font-semibold text-white">{primaryTrack.title}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Progress</p>
              <p className="mt-2 text-lg font-semibold text-white">{progress}%</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Projects</p>
              <p className="mt-2 text-lg font-semibold text-white">{assignedProjects.length}</p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[28px] border-[var(--border)] bg-[var(--bg-card)]">
            <div className="relative min-h-[22rem] md:min-h-[26rem] lg:min-h-[30rem]">
              <SmartImage
                unsplashId={MEDIA_CATEGORIES.classroom.immersive[1].unsplashId}
                alt={MEDIA_CATEGORIES.classroom.immersive[1].alt}
                wrapperClassName="h-full w-full border-none bg-transparent"
                className="h-full w-full object-cover"
                width={900}
                quality={85}
                hoverEffect="zoom"
              />
            </div>
            <div className="grid gap-3 p-6 lg:grid-cols-[1fr_240px]">
              <div>
                <p className="stat-label">Instructor hint</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {lesson?.title ?? "Build your first React component"}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Keep the layout simple, readable, and easy to extend.
                </p>
              </div>
              <div>
                <p className="stat-label">Next step</p>
                <p className="mt-2 text-sm text-white">
                  {lesson?.videoUrl ? "Open the lesson video and follow along." : "Review the starter snippet and complete the task."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="purple">JSX</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-white">Starter code preview</h2>
              </div>
              <Button variant="secondary" size="sm">
                Save draft
              </Button>
            </div>
            <pre className="mt-5 overflow-x-auto rounded-[24px] border border-[var(--border)] bg-[#08101c] p-5 text-sm leading-7 text-cyan-100">
              <code>{snippet}</code>
            </pre>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="purple">Lesson notes</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-white">Learn, discuss, and move fast</h2>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">{recentSubmissions.length} recent submissions</Badge>
                <Badge variant="default">{dashboard?.upcomingSessions?.length ?? 0} sessions next</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                  <p className="stat-label">Lesson content</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                    {lesson?.content || "The lesson content will guide you through the core implementation and review checkpoints."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                  <p className="stat-label">Discussion</p>
                  <div className="mt-4 space-y-3">
                    {(recentSubmissions.slice(0, 3).length ? recentSubmissions.slice(0, 3) : [{ project: { title: "No discussion yet" }, status: "waiting" }]).map((entry, index) => (
                      <div key={`${entry.project?.title ?? "note"}-${index}`} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MessageSquareText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{entry.project?.title ?? "Workspace note"}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Status: {entry.status ?? "draft"} · Review and iterate with your mentor.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <BookOpen size={14} />
                    <span className="text-xs uppercase tracking-[0.22em]">Progress</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{progress}% complete</p>
                  <ProgressBar value={progress} max={100} className="mt-3" />
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Keep the pace calm and steady. The workspace highlights the next step without overwhelming you.
                  </p>
                </Card>

                <Card className="border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Layers3 size={14} />
                    <span className="text-xs uppercase tracking-[0.22em]">Track focus</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">{primaryTrack.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {primaryTrack.description || "Build practical skills through compact lessons and project checkpoints."}
                  </p>
                </Card>

                <Card className="border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <FileCode2 size={14} />
                    <span className="text-xs uppercase tracking-[0.22em]">Resources</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                    <p>• Follow the starter snippet and keep components accessible.</p>
                    <p>• Save drafts locally while reviewing the lesson.</p>
                    <p>• Open the project hub when you’re ready to submit work.</p>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-0">
            <div className="border-b border-[var(--border)] p-5">
              <Badge variant="purple">Workspace status</Badge>
              <h2 className="mt-3 text-xl font-semibold text-white">Your current learning rhythm</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Current lesson</p>
                <p className="mt-2 text-lg font-semibold text-white">{lesson?.title ?? "No lesson selected"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Assigned projects</p>
                <p className="mt-2 text-3xl font-semibold text-white">{assignedProjects.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Recent activity</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {recentSubmissions[0]?.project?.title
                    ? `Latest submission: ${recentSubmissions[0].project?.title}`
                    : "No recent submissions yet."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-5">
            <Badge variant="success">Quick access</Badge>
            <div className="mt-4 space-y-3">
              <Link to="/app/projects">
                <Button className="w-full" variant="primary">
                  <Code2 size={16} />
                  Open project hub
                </Button>
              </Link>
              <Link to="/app/tracks">
                <Button className="w-full" variant="outline">
                  <BookOpen size={16} />
                  Browse tracks
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
