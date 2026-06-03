import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  fetchQueueApplications,
  fetchQueueStats,
  approveApplication,
  rejectApplication,
  requestChanges,
  type MentorApplication,
} from "@/services/mentorApplicationService";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

type QueueTab = "pending" | "approved" | "rejected" | "changes-requested" | "archived";

const QUEUE_LABELS: Record<QueueTab, string> = {
  pending: "Pending Applications",
  approved: "Approved Mentors",
  rejected: "Rejected Applications",
  "changes-requested": "Changes Requested",
  archived: "Archived Applications",
};

function ModerationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-40 w-full rounded-[24px]" />
      <Skeleton className="h-40 w-full rounded-[24px]" />
    </div>
  );
}

function StatCard({ label, count, active }: { label: string; count: number; active: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-[var(--border)] bg-[var(--bg-card)]/50"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{count}</p>
    </div>
  );
}

function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Reject application"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Reject Application</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Provide a reason for rejection. The applicant will be notified.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
          aria-label="Rejection reason"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
          >
            {loading ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestChangesModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Request changes"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Request Changes</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Provide notes on what changes are needed. The applicant will be notified.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what needs to be changed..."
          className="min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
          aria-label="Change request notes"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(notes)}
            disabled={!notes.trim() || loading}
          >
            {loading ? "Sending..." : "Request Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  onRequestChanges,
  reviewNotes,
  onReviewNotesChange,
}: {
  application: MentorApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestChanges: (id: string) => void;
  reviewNotes: string;
  onReviewNotesChange: (id: string, value: string) => void;
}) {
  const isPending = application.status === "pending_review";

  return (
    <Card className="space-y-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{application.fullName}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {application.currentRole}
            {application.currentCompany ? ` • ${application.currentCompany}` : ""}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{application.email}</p>
        </div>
        <Badge variant={
          application.status === "approved" ? "success"
            : application.status === "rejected" ? "warning"
              : application.status === "changes_requested" ? "purple"
                : "default"
        }>
          {application.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
        <p>Location: {application.location ?? "Not provided"}</p>
        <p>Experience: {application.yearsExperience ?? 0} years</p>
        <p>Availability: {application.availability ?? "Not provided"}</p>
        <p>Style: {(application.mentoringStyle ?? []).join(", ") || "Not provided"}</p>
      </div>

      {application.linkedin && (
        <p className="text-sm">
          <span className="text-[var(--text-muted)]">LinkedIn: </span>
          <a href={application.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {application.linkedin}
          </a>
        </p>
      )}
      {application.portfolio && (
        <p className="text-sm">
          <span className="text-[var(--text-muted)]">Portfolio: </span>
          <a href={application.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {application.portfolio}
          </a>
        </p>
      )}

      <p className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-sm leading-6 text-[var(--text-secondary)]">
        {application.whyMentor}
      </p>

      <div className="flex flex-wrap gap-2">
        {(application.expertise ?? []).slice(0, 8).map((skill) => (
          <Badge key={skill} variant="purple">{skill}</Badge>
        ))}
      </div>

      {application.rejectionReason && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="text-xs font-semibold text-orange-500">Rejection reason</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{application.rejectionReason}</p>
        </div>
      )}

      {application.reviewNotes && application.status === "changes_requested" && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
          <p className="text-xs font-semibold text-purple-500">Review notes</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{application.reviewNotes}</p>
        </div>
      )}

      {(application.rejectionHistory ?? []).length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="text-xs font-semibold text-orange-500 mb-2">Previous rejection history</p>
          {(application.rejectionHistory ?? []).map((entry, i) => (
            <p key={i} className="text-xs text-[var(--text-muted)]">
              &ldquo;{entry.reason}&rdquo;
              {entry.reviewedAt ? ` - ${new Date(entry.reviewedAt).toLocaleDateString()}` : ""}
            </p>
          ))}
        </div>
      )}

      {isPending && (
        <>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Review notes
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => onReviewNotesChange(application._id, e.target.value)}
              placeholder="Add review feedback or request additional information."
              className="min-h-[90px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
              aria-label="Review notes"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" variant="primary" onClick={() => onApprove(application._id)}>
              Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => onReject(application._id)}>
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRequestChanges(application._id)}>
              Request Changes
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

export function AdminModerationPage() {
  usePageTitle("Mentor Moderation");
  const [tab, setTab] = useState<QueueTab>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [requestChangesTarget, setRequestChangesTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["admin", "mentor-applications", "stats"],
    queryFn: fetchQueueStats,
    refetchInterval: 30000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["admin", "mentor-applications", tab, page, debouncedSearch],
    queryFn: () =>
      fetchQueueApplications(tab, {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
  });

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-applications"] });
  }, [queryClient]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      approveApplication(id, reviewNotes[id]?.trim() || undefined),
    onSuccess: async () => {
      setReviewNotes({});
      await invalidateAll();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectApplication(id, reason),
    onSuccess: async () => {
      setRejectTarget(null);
      setReviewNotes({});
      await invalidateAll();
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      requestChanges(id, notes),
    onSuccess: async () => {
      setRequestChangesTarget(null);
      setReviewNotes({});
      await invalidateAll();
    },
  });

  const stats = statsQuery.data;
  const isLoading = applicationsQuery.isLoading;
  const isError = applicationsQuery.isError;

  const tabs = useMemo(
    () => [
      { key: "pending" as QueueTab, count: stats?.pendingReview ?? 0 },
      { key: "approved" as QueueTab, count: stats?.approved ?? 0 },
      { key: "rejected" as QueueTab, count: stats?.rejected ?? 0 },
      { key: "changes-requested" as QueueTab, count: stats?.changesRequested ?? 0 },
      { key: "archived" as QueueTab, count: stats?.archived ?? 0 },
    ],
    [stats]
  );

  if (isError) return <QueryError onRetry={() => applicationsQuery.refetch()} />;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold md:text-3xl">Mentor Moderation</h1>
        <p className="max-w-2xl text-[var(--text-secondary)]">
          Review, approve, reject, or request changes to mentor applications.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tabs.map(({ key, count }) => (
          <StatCard
            key={key}
            label={QUEUE_LABELS[key]}
            count={count}
            active={tab === key}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {tabs.map(({ key, count }) => (
          <Button
            key={key}
            variant={tab === key ? "primary" : "outline"}
            onClick={() => { setTab(key); setPage(1); }}
            aria-pressed={tab === key}
          >
            {QUEUE_LABELS[key]} ({count})
          </Button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={`Search ${QUEUE_LABELS[tab].toLowerCase()}...`}
          className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-primary"
          aria-label={`Search ${QUEUE_LABELS[tab].toLowerCase()}`}
        />
      </div>

      {isLoading ? (
        <ModerationSkeleton />
      ) : applicationsQuery.data?.applications.length ? (
        <>
          <div className="space-y-4">
            {applicationsQuery.data.applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                reviewNotes={reviewNotes[application._id] ?? ""}
                onReviewNotesChange={(id, value) =>
                  setReviewNotes((prev) => ({ ...prev, [id]: value }))
                }
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => setRejectTarget(id)}
                onRequestChanges={(id) => setRequestChangesTarget(id)}
              />
            ))}
          </div>
          {applicationsQuery.data.pagination && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-[var(--text-muted)]">
                Page {applicationsQuery.data.pagination.page} of{" "}
                {applicationsQuery.data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    page >= (applicationsQuery.data.pagination.totalPages ?? 1)
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={`No ${QUEUE_LABELS[tab].toLowerCase()}`}
          description={
            tab === "pending"
              ? "Applications will appear here after mentors submit the public form."
              : "No applications in this queue."
          }
        />
      )}

      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) {
            rejectMutation.mutate({ id: rejectTarget, reason });
          }
        }}
        loading={rejectMutation.isPending}
      />

      <RequestChangesModal
        open={requestChangesTarget !== null}
        onClose={() => setRequestChangesTarget(null)}
        onConfirm={(notes) => {
          if (requestChangesTarget) {
            requestChangesMutation.mutate({ id: requestChangesTarget, notes });
          }
        }}
        loading={requestChangesMutation.isPending}
      />
    </div>
  );
}
