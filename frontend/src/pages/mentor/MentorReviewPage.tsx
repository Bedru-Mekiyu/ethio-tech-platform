import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Send, XCircle, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { fetchSubmissionQueue, reviewSubmissionItem, type SubmissionReviewItem } from "@/services/submissionsService";
import { fetchSessions } from "@/services/sessionsService";
import { submitStudentFeedback } from "@/services/mentorControlService";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/composites/ToastProvider";

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

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 4 ? "text-emerald-400" : score >= 3 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5 bg-[#141418] border border-[#27272A] rounded-lg px-2 py-0.5">
      <span className={cn("text-xs font-bold", color)}>{score.toFixed(1)}</span>
      <span className="text-[8px] uppercase tracking-wider text-zinc-500">{label}</span>
    </div>
  );
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-3.5 text-left transition-all",
        isSelected ? "border-indigo-500 bg-indigo-500/10 shadow-sm" : "border-[#27272A] bg-[#0E0E11] hover:border-zinc-700",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{submission.project?.title ?? "Project submission"}</p>
          <p className="text-[11px] text-zinc-400">{submission.student?.fullName}</p>
        </div>
        <Badge variant={statusTone(submission.status)} size="sm">{submission.status ?? "pending"}</Badge>
      </div>
      <div className="mt-3 rounded-lg border border-[#27272A] bg-[#141418] p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
          <FileText size={12} />
          <span>Files Attached</span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">
          {submission.files?.length
            ? `${submission.files.length} file${submission.files.length === 1 ? "" : "s"} attached for review.`
            : "No files attached yet."}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
        <span>Grade: {submission.grade ?? 0}/100</span>
        {submission.createdAt ? (
          <span className="text-zinc-500">
            · {new Date(submission.createdAt).toLocaleDateString()}
          </span>
        ) : null}
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

  // Session-feedback score states
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [participationScore, setParticipationScore] = useState<number>(5);
  const [communicationScore, setCommunicationScore] = useState<number>(5);
  const [professionalismScore, setProfessionalismScore] = useState<number>(5);
  const [sessionComment, setSessionComment] = useState("");
  const [isSubmittingSessionFeedback, setIsSubmittingSessionFeedback] = useState(false);
  const toast = useToast();

  // Fetch submissions queue
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mentor", "submissions"],
    queryFn: fetchSubmissionQueue,
  });

  // Fetch student performance history
  const { data: studentsList } = useQuery({
    queryKey: ["mentor", "students"],
    queryFn: async () => {
      const { data } = await api.get("/mentor/students");
      return data.data?.students ?? [];
    },
  });

  // Fetch mentor's sessions for association
  const { data: sessionsList } = useQuery({
    queryKey: ["mentor", "sessions-list"],
    queryFn: fetchSessions,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "reviewed" | "approved" | "rejected" }) => {
      // 1. Submit project review
      const res = await reviewSubmissionItem(id, {
        status,
        feedback: feedback.trim() || undefined,
        grade: grade ? Number(grade) : undefined,
      });

      // 2. Submit session feedback if session is selected
      if (selectedSessionId && selected?.student?._id) {
        setIsSubmittingSessionFeedback(true);
        try {
          await submitStudentFeedback(selectedSessionId, {
            studentId: selected.student._id,
            participationScore,
            communicationScore,
            professionalismScore,
            comment: sessionComment.trim() || undefined,
          });
        } catch (err) {
          console.error("Session feedback submission failed", err);
          toast.error("Failed to submit session feedback");
        } finally {
          setIsSubmittingSessionFeedback(false);
        }
      }

      return res;
    },
    onSuccess: async () => {
      setFeedback("");
      setSessionComment("");
      setSelectedSessionId("");
      setParticipationScore(5);
      setCommunicationScore(5);
      setProfessionalismScore(5);
      await queryClient.invalidateQueries({ queryKey: ["mentor", "submissions"] });
      await queryClient.invalidateQueries({ queryKey: ["mentor", "students"] });
    },
  });

  const submissions = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (filter === "all" ? submissions : submissions.filter((item) => item.status === filter)),
    [filter, submissions],
  );

  const selected = filtered.find((item) => item._id === selectedId) ?? filtered[0];

  const currentStudentDetails = useMemo(() => {
    if (!selected?.student?._id || !studentsList) return null;
    return studentsList.find((s: { _id: string }) => String(s._id) === String(selected.student?._id));
  }, [selected, studentsList]);

  if (isLoading) return <ReviewSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load submissions."}
        onRetry={() => refetch()}
      />
    );
  }

  if (!submissions.length) {
    return (
      <EmptyState
        title="No submissions in queue"
        description="When students submit projects, they'll show up here for review."
      />
    );
  }

  if (!filtered.length) {
    return (
      <EmptyState
        title="No submissions in this filter"
        description="Try another status filter to review available submissions."
      />
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Interactive Project Review Board</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Review submissions, evaluate performance scores, and provide actionable mentor feedback.
            </p>
          </div>
          <Badge variant="success" size="sm">{filtered.length} visible</Badge>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded px-3 py-1 text-xs transition font-medium capitalize",
              filter === option.value
                ? "border border-indigo-500 bg-indigo-600 text-white"
                : "border border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">Submissions Awaiting Feedback</h2>
            </div>
            <Badge variant="success" size="sm">{filtered.length} items</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filtered.slice(0, 4).map((item) => (
              <ReviewWorkspace
                key={item._id}
                submission={item}
                isSelected={selected?._id === item._id}
                onSelect={() => {
                  setSelectedId(item._id);
                  setFeedback(item.feedback ?? "");
                  setGrade(item.grade?.toString() ?? "85");
                  setSelectedSessionId("");
                  setSessionComment("");
                }}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Selected details */}
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{selected?.project?.title ?? "Project"}</h3>
              </div>
              <Badge variant={statusTone(selected?.status)} size="sm">{selected?.status ?? "pending"}</Badge>
            </div>
            <div className="mt-3 space-y-2 text-xs text-zinc-400">
              <p>
                Student: <strong className="text-white">{selected?.student?.fullName ?? "Learner"}</strong>
              </p>
              <p>Track: {selected?.project?.track?.title ?? "Learning track"}</p>
              <p>XP reward: +{selected?.project?.xpReward ?? 0} XP</p>
              <ProgressBar value={selected?.grade ?? 0} max={100} className="mt-2 h-1" />
            </div>
          </Card>

          {/* Feedback & Review Form */}
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
            <div className="space-y-3.5">
              <div>
                <Label className="text-xs text-zinc-400">Grade Score (0 - 100)</Label>
                <Input
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  type="number"
                  min={0}
                  max={100}
                  className="mt-1 text-xs bg-[#141418] border-[#27272A] text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Mentor Feedback & Code Review</Label>
                <Textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="What should the student improve? Point out strengths..."
                  className="mt-1 min-h-20 text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Session Performance Ratings */}
              <div className="border-t border-[#27272A] pt-3.5 space-y-2.5">
                <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Session Performance Rating (Optional)
                </h4>
                <div className="space-y-2.5">
                  <div>
                    <Label className="text-xs text-zinc-400">Associate with Session</Label>
                    <Select
                      className="mt-1 h-8 text-xs bg-[#141418] border-[#27272A] text-white"
                      value={selectedSessionId}
                      onValueChange={setSelectedSessionId}
                    >
                      <option value="">— No Session Association —</option>
                      {sessionsList?.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {selectedSessionId && (
                    <div className="space-y-2.5 animate-in fade-in duration-300">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase">Participation</label>
                          <Select
                            className="h-7 text-xs bg-[#141418] border-[#27272A] text-white"
                            value={String(participationScore)}
                            onValueChange={(v) => setParticipationScore(Number(v))}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={String(n)}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase">Communication</label>
                          <Select
                            className="h-7 text-xs bg-[#141418] border-[#27272A] text-white"
                            value={String(communicationScore)}
                            onValueChange={(v) => setCommunicationScore(Number(v))}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={String(n)}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase">Professionalism</label>
                          <Select
                            className="h-7 text-xs bg-[#141418] border-[#27272A] text-white"
                            value={String(professionalismScore)}
                            onValueChange={(v) => setProfessionalismScore(Number(v))}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={String(n)}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-400">Session comment</Label>
                        <Textarea
                          value={sessionComment}
                          onChange={(e) => setSessionComment(e.target.value)}
                          placeholder="Session performance comments..."
                          className="mt-1 min-h-14 text-xs bg-[#141418] border-[#27272A] text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272A]">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-medium"
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "reviewed" });
                  }}
                  disabled={reviewMutation.isPending || isSubmittingSessionFeedback || !selected}
                >
                  <Send size={12} className="mr-1" />
                  Save Review
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs font-medium"
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "approved" });
                  }}
                  disabled={reviewMutation.isPending || isSubmittingSessionFeedback || !selected}
                >
                  <CheckCircle2 size={12} className="mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs font-medium"
                  onClick={() => {
                    if (!selected) return;
                    void reviewMutation.mutateAsync({ id: selected._id, status: "rejected" });
                  }}
                  disabled={reviewMutation.isPending || isSubmittingSessionFeedback || !selected}
                >
                  <XCircle size={12} className="mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>

          {/* Student Feedback History */}
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400 border border-indigo-500/20">
                <MessageSquare size={14} />
              </div>
              <h4 className="text-xs font-semibold text-white">Learner Feedback History</h4>
            </div>
            {currentStudentDetails?.feedbackHistory && currentStudentDetails.feedbackHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {currentStudentDetails.feedbackHistory.slice(0, 4).map(
                  (
                    fb: {
                      score: number;
                      comment: string;
                      createdAt: string;
                      sessionTitle?: string;
                      participationScore?: number;
                      communicationScore?: number;
                      professionalismScore?: number;
                    },
                    idx: number,
                  ) => (
                    <div key={idx} className="rounded-lg border border-[#27272A] bg-[#141418] p-3 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white truncate max-w-[150px]">
                            {fb.sessionTitle ?? "Session review"}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <ScoreBadge score={fb.participationScore ?? fb.score} label="PRT" />
                          <ScoreBadge score={fb.communicationScore ?? fb.score} label="COM" />
                          <ScoreBadge score={fb.professionalismScore ?? fb.score} label="PRF" />
                        </div>
                      </div>
                      {fb.comment && (
                        <p className="text-xs text-zinc-400 italic">
                          &ldquo;{fb.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-zinc-500">
                No past feedback records for this student yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
