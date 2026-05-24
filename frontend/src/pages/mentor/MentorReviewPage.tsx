import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDot, FileCode2, Send, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { fetchSubmissionQueue, reviewSubmissionItem, type SubmissionReviewItem } from "@/services/submissionsService";
import { cn } from "@/lib/utils";

type ReviewFilter = "pending" | "reviewed" | "approved" | "rejected" | "all";

const filterOptions: Array<{ value: ReviewFilter; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function ReviewSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Skeleton className="min-h-[34rem] rounded-[28px]" />
      <Skeleton className="min-h-[34rem] rounded-[28px]" />
    </div>
  );
}

function statusTone(status?: string) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "warning";
    case "reviewed":
      return "purple";
    default:
      return "default";
  }
}

function ReviewWorkspace({
  submission,
  isSelected,
  onSelect,
}: {
  submission: SubmissionReviewItem;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const snippet = `// ${submission.project?.title ?? "Project"}
export function ReviewFocus() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950 p-6">
      <h1 className="text-2xl font-semibold text-white">
        ${submission.project?.title ?? "Submission"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Focus on clarity, accessibility, structure, and delivery.
      </p>
    </section>
  );
}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[24px] border p-4 text-left transition",
        isSelected ? "border-primary bg-primary/10" : "border-[var(--border)] bg-white/5 hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{submission.project?.title ?? "Project submission"}</p>
          <p className="text-xs text-[var(--text-muted)]">{submission.student?.fullName}</p>
        </div>
        <Badge variant={statusTone(submission.status)}>{submission.status ?? "pending"}</Badge>
      </div>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#08101c] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <FileCode2 size={14} />
          <span>Submission context</span>
        </div>
        <pre className="overflow-x-auto text-xs leading-6 text-cyan-100">
          <code>{snippet}</code>
        </pre>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <CircleDot size={12} className="text-primary" />
        <span>{submission.files?.length ?? 0} files · {submission.grade ?? 0} grade</span>
      </div>
    </button>
  );
}

export function MentorReviewPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("85");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mentor", "submissions"],
    queryFn: fetchSubmissionQueue,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "reviewed" | "approved" | "rejected" }) =>
      reviewSubmissionItem(id, {
        status,
        feedback: feedback.trim() || undefined,
        grade: grade ? Number(grade) : undefined,
      }),
    onSuccess: async () => {
      setFeedback("");
      await queryClient.invalidateQueries({ queryKey: ["mentor", "submissions"] });
    },
  });

  const submissions = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (filter === "all" ? submissions : submissions.filter((item) => item.status === filter)),
    [filter, submissions]
  );

  const selected = filtered.find((item) => item._id === selectedId) ?? filtered[0];

  if (isLoading) return <ReviewSkeleton />;
  if (isError) {
    return <QueryError message={error instanceof Error ? error.message : "Unable to load submissions."} onRetry={() => refetch()} />;
  }

  if (!submissions.length) {
    return (
      <EmptyState
        title="No submissions in queue"
        description="When students submit projects, they'll show up here for review."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Project reviews</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Interactive project review board</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Review submissions, capture feedback, and move projects through the queue with a calm, editor-like workspace.
            </p>
          </div>
          <Badge variant="success">{filtered.length} visible</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              filter === option.value
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Review queue</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Submissions waiting for feedback</h2>
            </div>
            <Badge variant="success">{filtered.length} items</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filtered.slice(0, 4).map((item) => (
              <ReviewWorkspace
                key={item._id}
                submission={item}
                isSelected={selected?._id === item._id}
                onSelect={() => {
                  setSelectedId(item._id);
                  setFeedback(item.feedback ?? "");
                  setGrade(item.grade?.toString() ?? "85");
                }}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge variant="purple">Selected submission</Badge>
                <h3 className="mt-3 text-2xl font-semibold text-white">{selected?.project?.title ?? "Project"}</h3>
              </div>
              <Badge variant={statusTone(selected?.status)}>{selected?.status ?? "pending"}</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Student: {selected?.student?.fullName ?? "Learner"}</p>
              <p>Track: {selected?.project?.track?.title ?? "Learning track"}</p>
              <p>XP reward: +{selected?.project?.xpReward ?? 0}</p>
              <ProgressBar value={selected?.grade ?? 72} max={100} className="mt-3" />
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <Badge variant="success">Feedback editor</Badge>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Grade</Label>
                <Input value={grade} onChange={(event) => setGrade(event.target.value)} type="number" min={0} max={100} />
              </div>
              <div>
                <Label>Mentor feedback</Label>
                <Textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="What should the student improve? What is strong?"
                />
              </div>
              <div className="grid gap-3">
                <Button
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "reviewed" });
                  }}
                  disabled={reviewMutation.isPending || !selected}
                >
                  <Send size={16} />
                  Save review
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "approved" });
                  }}
                  disabled={reviewMutation.isPending || !selected}
                >
                  <CheckCircle2 size={16} />
                  Approve project
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "rejected" });
                  }}
                  disabled={reviewMutation.isPending || !selected}
                >
                  <XCircle size={16} />
                  Reject project
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
