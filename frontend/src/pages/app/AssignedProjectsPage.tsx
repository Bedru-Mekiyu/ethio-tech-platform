import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";

type ProjectTab = "active" | "feedback" | "completed";

const tabLabels: Record<ProjectTab, string> = {
  active: "Active assignments",
  feedback: "Feedback ready",
  completed: "Completed",
};

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[24px]" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: NonNullable<StudentDashboardData["assignedProjects"]>[number];
}) {
  const statusTone =
    project.category === "completed" ? "success" : project.category === "feedback" ? "purple" : "warning";
  const actionLabel =
    project.category === "completed"
      ? "View submission"
      : project.category === "feedback"
        ? "Read feedback"
        : "Submit work";
  const actionMode =
    project.category === "completed" ? "view" : project.category === "feedback" ? "feedback" : "submit";
  const actionRoute = `/app/projects/submit?mode=${actionMode}${project.projectId ? `&projectId=${project.projectId}` : ""}`;

  return (
    <Card className="flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant={statusTone}>{project.category}</Badge>
          <h3 className="mt-3 text-xl font-semibold text-white">{project.title}</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{project.trackTitle}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">XP</p>
          <p className="text-lg font-semibold text-white">+{project.xpReward ?? 0}</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        {project.description ?? "Project work assigned through your learning track."}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span>Momentum</span>
          <span>{project.completionPercent}%</span>
        </div>
        <ProgressBar value={project.completionPercent} max={100} color="primary" />
      </div>

      <div className="grid gap-3 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-3">
          <p className="uppercase tracking-[0.22em] text-[var(--text-muted)]">Status</p>
          <p className="mt-2 text-sm text-white">{project.submissionStatus.replace("-", " ")}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-3">
          <p className="uppercase tracking-[0.22em] text-[var(--text-muted)]">Track</p>
          <p className="mt-2 text-sm text-white">{project.trackTitle}</p>
        </div>
      </div>

      {project.feedback ? (
        <p className="rounded-2xl border border-success/20 bg-success/10 p-4 text-sm leading-6 text-white">
          {project.feedback}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-3">
        <Link to={actionRoute}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
        <Link to={project.trackId ? `/app/tracks/${project.trackId}` : "/app/tracks"}>
          <Button size="sm" variant="outline">
            Open track
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function AssignedProjectsPage() {
  const [tab, setTab] = useState<ProjectTab>("active");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const dashboard = data as StudentDashboardData | undefined;
  const projects = useMemo(() => dashboard?.assignedProjects ?? [], [dashboard?.assignedProjects]);

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.category === tab),
    [projects, tab]
  );

  const counts = useMemo(
    () => ({
      active: projects.filter((project) => project.category === "active").length,
      feedback: projects.filter((project) => project.category === "feedback").length,
      completed: projects.filter((project) => project.category === "completed").length,
    }),
    [projects]
  );

  if (isError) {
    return <QueryError message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Assigned projects</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Build, review, and complete your project queue.</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Track active assignments, read mentor feedback, and keep your submissions moving without losing context.
            </p>
          </div>
          <Link to="/app/projects/submit">
            <Button>
              Submit project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Active</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.active}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Feedback ready</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.feedback}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.completed}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {(Object.keys(tabLabels) as ProjectTab[]).map((value) => (
          <Button
            key={value}
            variant={tab === value ? "primary" : "outline"}
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
          >
            {tabLabels[value]} ({counts[value]})
          </Button>
        ))}
      </div>

      {filteredProjects.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${tabLabels[tab].toLowerCase()} yet`}
          description="Projects will appear here as your track progresses and mentor feedback comes in."
          actionLabel="Browse tracks"
          onAction={() => {
            window.location.assign("/app/tracks");
          }}
        />
      )}
    </div>
  );
}
