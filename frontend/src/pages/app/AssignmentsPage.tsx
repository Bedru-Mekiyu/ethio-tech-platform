import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, AlertTriangle, CheckCircle, FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAssignments, type Assignment } from "@/services/assignmentService";
import { cn } from "@/lib/utils";

type AssignmentTab = "all" | "pending" | "submitted" | "graded";

const tabLabels: Record<AssignmentTab, string> = {
  all: "All",
  pending: "Pending",
  submitted: "Submitted",
  graded: "Graded",
};

const typeIcons: Record<string, React.ReactNode> = {
  homework: <BookOpen size={16} />,
  quiz: <FileText size={16} />,
  project: <Upload size={16} />,
  reading: <BookOpen size={16} />,
  peer_review: <CheckCircle size={16} />,
};

function AssignmentsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-[24px]" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string) {
  const d = new Date(dueDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `${diffDays}d left`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const status = assignment.status ?? "pending";
  const overdue = isOverdue(assignment.dueDate) && status === "pending";

  return (
    <Card className="flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {typeIcons[assignment.type] ?? <FileText size={16} />}
          </div>
          <Badge variant={status === "graded" ? "success" : status === "submitted" ? "purple" : overdue ? "warning" : "default"}>
            {status}
          </Badge>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {assignment.maxScore} pts
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
          {assignment.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          {overdue ? <AlertTriangle size={12} className="text-warning" /> : <Clock size={12} />}
          <span className={overdue ? "text-warning font-medium" : ""}>
            {formatDueDate(assignment.dueDate)}
          </span>
        </span>
        {assignment.estimatedMinutes > 0 && (
          <span>~{assignment.estimatedMinutes} min</span>
        )}
        {assignment.tags.length > 0 && (
          <span className="truncate">{assignment.tags.slice(0, 2).join(", ")}</span>
        )}
      </div>

      {assignment.submission && (
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-3">
          <p className="text-xs text-[var(--text-muted)]">
            Submitted {new Date(assignment.submission.submittedAt).toLocaleDateString()}
          </p>
          {assignment.submission.grade != null && (
            <p className="mt-1 text-sm font-medium text-white">
              Grade: {assignment.submission.grade}/{assignment.maxScore}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3">
        {status === "pending" ? (
          <Link to={`/app/projects/submit?mode=submit&assignmentId=${assignment._id}`}>
            <Button size="sm">
              <Upload size={14} className="mr-1" />
              Submit
            </Button>
          </Link>
        ) : status === "graded" ? (
          <Link to={`/app/projects/submit?mode=feedback&assignmentId=${assignment._id}`}>
            <Button size="sm" variant="outline">
              View feedback
            </Button>
          </Link>
        ) : (
          <Link to={`/app/projects/submit?mode=view&assignmentId=${assignment._id}`}>
            <Button size="sm" variant="outline">
              View submission
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export function AssignmentsPage() {
  const [tab, setTab] = useState<AssignmentTab>("all");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => fetchAssignments(),
  });

  const assignments = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    if (tab === "all") return assignments;
    return assignments.filter((a) => a.status === tab);
  }, [assignments, tab]);

  const counts = useMemo(() => ({
    all: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  }), [assignments]);

  const overdueCount = useMemo(
    () => assignments.filter((a) => isOverdue(a.dueDate) && a.status === "pending").length,
    [assignments]
  );

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <AssignmentsSkeleton />;

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Assignments</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your homework, quizzes, and project deadlines.
            </h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Stay on top of due dates, submit work, and review feedback all in one place.
            </p>
          </div>
          {overdueCount > 0 && (
            <Badge variant="warning">{overdueCount} overdue</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Total</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.all}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.pending}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Submitted</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.submitted}</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Graded</p>
          <p className="mt-2 text-3xl font-semibold text-white">{counts.graded}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["all", "pending", "submitted", "graded"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition",
              tab === value
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
            )}
          >
            {tabLabels[value]} ({counts[value]})
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${tabLabels[tab].toLowerCase()} assignments`}
          description="New assignments will appear here as your mentors publish them."
          actionLabel="Browse tracks"
          onAction={() => window.location.assign("/app/tracks")}
        />
      )}
    </div>
  );
}
