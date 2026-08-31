import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, CheckCircle, Clock, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { fetchAssignments, type Assignment } from "@/services/assignmentService";
import { cn } from "@/lib/utils";

type Tab = "active" | "submitted" | "graded";

const tabLabels: Record<Tab, string> = {
  active: "Active",
  submitted: "Submitted",
  graded: "Graded",
};

const assignmentTypeIcons: Record<string, React.ReactNode> = {
  homework: <BookOpen size={16} />,
  quiz: <FileText size={16} />,
  project: <Upload size={16} />,
  reading: <BookOpen size={16} />,
  peer_review: <CheckCircle size={16} />,
};

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string) {
  const d = new Date(dueDate);
  const diffDays = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `${diffDays}d left`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function AssignedProjectCard({ project }: { project: NonNullable<StudentDashboardData["assignedProjects"]>[number] }) {
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
    <Card className="flex h-full flex-col justify-between gap-3 border-[#27272A] bg-[#0E0E11] p-4.5">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={statusTone} size="sm">{project.category}</Badge>
          <span className="text-xs font-semibold text-emerald-400">+{project.xpReward ?? 0} XP</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{project.title}</h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">{project.trackTitle}</p>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3">
          {project.description ?? "Project work assigned through your learning track."}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Progress</span>
            <span className="font-semibold text-white">{project.completionPercent}%</span>
          </div>
          <ProgressBar value={project.completionPercent} max={100} color="primary" className="h-1.5" />
        </div>
        {project.feedback ? (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs leading-relaxed text-zinc-300">
            {project.feedback}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-[#27272A]">
        <Link to={actionRoute}>
          <Button size="sm" className="text-xs">{actionLabel}</Button>
        </Link>
        {project.trackId ? (
          <Link to={`/app/tracks/${project.trackId}`}>
            <Button size="sm" variant="outline" className="text-xs">
              Track
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const status = assignment.status ?? "pending";
  const overdue = isOverdue(assignment.dueDate) && status === "pending";

  return (
    <Card className="flex h-full flex-col justify-between gap-3 border-[#27272A] bg-[#0E0E11] p-4.5">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#141418] text-indigo-400 border border-[#27272A]">
              {assignmentTypeIcons[assignment.type] ?? <FileText size={13} />}
            </div>
            <Badge
              size="sm"
              variant={
                status === "graded" ? "success" : status === "submitted" ? "purple" : overdue ? "warning" : "default"
              }
            >
              {status}
            </Badge>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{assignment.maxScore} pts</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{assignment.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{assignment.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            {overdue ? <AlertTriangle size={12} className="text-amber-400" /> : <Clock size={12} className="text-zinc-500" />}
            <span className={overdue ? "text-amber-400 font-medium" : ""}>{formatDueDate(assignment.dueDate)}</span>
          </span>
          {assignment.estimatedMinutes > 0 ? <span>~{assignment.estimatedMinutes} min</span> : null}
        </div>
        {assignment.submission?.grade != null ? (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-xs text-white">
            Grade: {assignment.submission.grade}/{assignment.maxScore}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-[#27272A]">
        {status === "pending" ? (
          <Link to={`/app/projects/submit?mode=submit&assignmentId=${assignment._id}`}>
            <Button size="sm" className="text-xs">
              <Upload size={13} className="mr-1" />
              Submit
            </Button>
          </Link>
        ) : status === "graded" ? (
          <Link to={`/app/projects/submit?mode=feedback&assignmentId=${assignment._id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              View feedback
            </Button>
          </Link>
        ) : (
          <Link to={`/app/projects/submit?mode=view&assignmentId=${assignment._id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              View submission
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export function AssignedProjectsPage() {
  const [tab, setTab] = useState<Tab>("active");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: () => fetchAssignments(),
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;
  const projects = dashboard?.assignedProjects ?? [];
  const assignments = assignmentsQuery.data ?? [];

  if (dashboardQuery.isError) {
    return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  }
  if (dashboardQuery.isLoading) {
    return <ProjectsSkeleton />;
  }

  const activeProjects = projects.filter((p) => p.category === "active" || p.category === "feedback");
  const completedProjects = projects.filter((p) => p.category === "completed");
  const pendingAssignments = assignments.filter((a) => a.status === "pending");
  const submittedAssignments = assignments.filter((a) => a.status === "submitted");
  const gradedAssignments = assignments.filter((a) => a.status === "graded");

  const tabItems: Record<Tab, { project: typeof projects; assignment: typeof assignments }> = {
    active: { project: activeProjects, assignment: pendingAssignments },
    submitted: { project: [], assignment: submittedAssignments },
    graded: { project: completedProjects, assignment: gradedAssignments },
  };
  const current = tabItems[tab];
  const total =
    activeProjects.length +
    pendingAssignments.length +
    completedProjects.length +
    submittedAssignments.length +
    gradedAssignments.length;

  return (
    <div className="page-shell space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Assigned Projects & Tasks</h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Track assignments, submit milestone repositories, and review mentor feedback.
            </p>
          </div>
          <Link to="/app/projects/submit">
            <Button size="sm" className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white">
              Submit Project
            </Button>
          </Link>
        </div>
      </Card>

      <div className="flex items-center rounded-lg border border-[#27272A] bg-[#0E0E11] p-1 w-fit" role="tablist">
        {(["active", "submitted", "graded"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3.5 py-1 text-xs font-medium transition",
              tab === t
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Enroll in a learning track to see your projects and assignments here."
          actionLabel="Browse tracks"
          actionHref="/app/tracks"
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {current.project.map((p) => (
            <AssignedProjectCard key={p.projectId} project={p} />
          ))}
          {current.assignment.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
          {current.project.length === 0 && current.assignment.length === 0 ? (
            <EmptyState
              title={`No ${tabLabels[tab].toLowerCase()} items`}
              description="Items will appear here as your work progresses."
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
