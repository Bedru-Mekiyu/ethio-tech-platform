import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import {
  fetchApplicationDetail,
  approveApplication,
  rejectApplication,
  requestChanges,
  startReview,
  provisionApplication,
  resendCredentials,
  resetMentorPassword,
  archiveApplication,
  suspendMentor,
  reactivateMentor,
  deactivateMentor,
  removeMentorRole,
  type MentorApplication,
} from "@/services/mentorApplicationService";
import { MentorActionConfirmDialog } from "@/components/admin/MentorActionConfirmDialog";
import { MentorAuditTimeline } from "@/components/admin/MentorAuditTimeline";
import { useToast } from "@/components/composites/ToastProvider";

type ConfirmAction =
  | "approve"
  | "reject"
  | "request-changes"
  | "provision"
  | "resend"
  | "reset-password"
  | "archive"
  | "suspend"
  | "reactivate"
  | "deactivate"
  | "remove-role";

interface MentorDetailsDrawerProps {
  applicationId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function MentorDetailsDrawer({ applicationId, onClose, onUpdated }: MentorDetailsDrawerProps) {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [reason, setReason] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const detailQuery = useQuery({
    queryKey: ["admin", "mentor-application", applicationId],
    queryFn: () => fetchApplicationDetail(applicationId!),
    enabled: Boolean(applicationId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-applications"] });
    if (applicationId) {
      await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-application", applicationId] });
    }
    onUpdated();
  };

  const mutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (!applicationId) throw new Error("No application");
      switch (action) {
        case "approve":
          return approveApplication(applicationId, reviewNotes.trim() || undefined);
        case "reject":
          return rejectApplication(applicationId, reason);
        case "request-changes":
          return requestChanges(applicationId, reason);
        case "provision":
          return provisionApplication(applicationId);
        case "resend":
          return resendCredentials(applicationId);
        case "reset-password":
          return resetMentorPassword(applicationId);
        case "archive":
          return archiveApplication(applicationId);
        case "suspend":
          return suspendMentor(applicationId, reason || undefined);
        case "reactivate":
          return reactivateMentor(applicationId);
        case "deactivate":
          return deactivateMentor(applicationId);
        case "remove-role":
          return removeMentorRole(applicationId, reason || undefined);
        default:
          throw new Error("Unknown action");
      }
    },
    onSuccess: async () => {
      toast.success("Action completed successfully");
      setConfirmAction(null);
      setReason("");
      await invalidate();
    },
    onError: () => {
      toast.error("Action failed. Check permissions and try again.");
    },
  });

  const startReviewMutation = useMutation({
    mutationFn: () => startReview(applicationId!),
    onSuccess: async () => {
      toast.success("Review started");
      await invalidate();
    },
  });

  if (!applicationId) return null;

  const detail = detailQuery.data;
  const app = detail?.application;
  const linkedUser = detail?.user;

  const statusBadge = (status: MentorApplication["status"]) => {
    const variant =
      status === "approved"
        ? "success"
        : status === "rejected"
          ? "warning"
          : status === "changes_requested"
            ? "purple"
            : "default";
    return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
  };

  const canReview =
    app?.status === "pending_review" || app?.status === "changes_requested";
  const needsProvision = app?.status === "approved" && !linkedUser;
  const canManageAccount = Boolean(linkedUser);

  const confirmConfig: Record<
    ConfirmAction,
    {
      title: string;
      description: string;
      confirmLabel: string;
      variant?: "primary" | "danger" | "outline";
      requireReason?: boolean;
    }
  > = {
    approve: {
      title: "Approve application",
      description: "This will provision a mentor account and send activation credentials.",
      confirmLabel: "Approve",
    },
    reject: {
      title: "Reject application",
      description: "The applicant will be notified with your reason.",
      confirmLabel: "Reject",
      variant: "danger",
      requireReason: true,
    },
    "request-changes": {
      title: "Request changes",
      description: "The applicant will be asked to update and resubmit.",
      confirmLabel: "Send request",
      requireReason: true,
    },
    provision: {
      title: "Create mentor account",
      description: "Provision an account for this approved application.",
      confirmLabel: "Create account",
    },
    resend: {
      title: "Resend credentials",
      description: "Generate a new activation link and notify the mentor.",
      confirmLabel: "Resend",
    },
    "reset-password": {
      title: "Reset password",
      description: "Reset credentials and require password change on next login.",
      confirmLabel: "Reset password",
      variant: "danger",
    },
    archive: {
      title: "Archive application",
      description: "Move this application to the archived queue.",
      confirmLabel: "Archive",
    },
    suspend: {
      title: "Suspend mentor",
      description: "Suspend the linked mentor account and revoke active sessions.",
      confirmLabel: "Suspend",
      variant: "danger",
      requireReason: true,
    },
    reactivate: {
      title: "Reactivate mentor",
      description: "Restore mentor account access.",
      confirmLabel: "Reactivate",
    },
    deactivate: {
      title: "Deactivate mentor",
      description: "Disable mentor access without deleting the account.",
      confirmLabel: "Deactivate",
      variant: "danger",
    },
    "remove-role": {
      title: "Remove mentor role",
      description: "Demote this user back to student and archive mentor status.",
      confirmLabel: "Remove role",
      variant: "danger",
      requireReason: true,
    },
  };

  const activeConfirm = confirmAction ? confirmConfig[confirmAction] : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Mentor application details"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{app?.fullName ?? "Application"}</h2>
            <p className="text-sm text-[var(--text-muted)]">{app?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {detailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : app ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(app.status)}
                {linkedUser?.mentorAccountStatus && (
                  <Badge variant="purple">{linkedUser.mentorAccountStatus.replace(/_/g, " ")}</Badge>
                )}
              </div>

              <section className="space-y-2 text-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Application
                </h3>
                <p>
                  <span className="text-[var(--text-muted)]">Role: </span>
                  {app.currentRole}
                  {app.currentCompany ? ` at ${app.currentCompany}` : ""}
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Experience: </span>
                  {app.yearsExperience ?? 0} years
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Location: </span>
                  {app.location ?? "Not provided"}
                </p>
                <p className="rounded-xl border border-[var(--border)] bg-white/5 p-3 leading-6 text-[var(--text-secondary)]">
                  {app.whyMentor}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(app.expertise ?? []).map((skill) => (
                    <Badge key={skill} variant="purple">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {app.linkedin && (
                  <a
                    href={app.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    LinkedIn <ExternalLink size={14} />
                  </a>
                )}
              </section>

              <section className="space-y-2 text-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Account
                </h3>
                {linkedUser ? (
                  <>
                    <p>
                      <span className="text-[var(--text-muted)]">User ID: </span>
                      {linkedUser.id}
                    </p>
                    <p>
                      <span className="text-[var(--text-muted)]">Role: </span>
                      {linkedUser.role}
                    </p>
                    <p>
                      <span className="text-[var(--text-muted)]">Last login: </span>
                      {linkedUser.lastLoginAt
                        ? new Date(linkedUser.lastLoginAt).toLocaleString()
                        : "Never"}
                    </p>
                    {detail?.credentialsStatus.provisionedAt && (
                      <p>
                        <span className="text-[var(--text-muted)]">Provisioned: </span>
                        {new Date(detail.credentialsStatus.provisionedAt).toLocaleString()}
                      </p>
                    )}
                    {detail?.credentialsStatus.sentAt && (
                      <p>
                        <span className="text-[var(--text-muted)]">Credentials: </span>
                        {detail.credentialsStatus.deliveryMethod ?? "sent"}{" "}
                        {new Date(detail.credentialsStatus.sentAt).toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)]">No linked user account yet.</p>
                )}
              </section>

              <section className="space-y-2 text-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Teaching
                </h3>
                <p>Sessions: {detail?.teaching.totalSessions ?? 0}</p>
                <p>Students: {detail?.teaching.studentsCount ?? 0}</p>
              </section>

              {canReview && isAdmin && (
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Review notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm outline-none focus:border-primary resize-y"
                    placeholder="Optional approval notes or internal feedback"
                  />
                </div>
              )}

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Audit timeline
                </h3>
                <MentorAuditTimeline applicationId={applicationId} />
              </section>
            </>
          ) : null}
        </div>

        {isAdmin && app && (
          <div className="border-t border-[var(--border)] px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {app.status === "pending_review" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startReviewMutation.mutate()}
                  disabled={startReviewMutation.isPending}
                >
                  Start review
                </Button>
              )}
              {canReview && (
                <>
                  <Button size="sm" onClick={() => setConfirmAction("approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction("reject")}>
                    Reject
                  </Button>
                  {app.status === "pending_review" && (
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction("request-changes")}>
                      Request changes
                    </Button>
                  )}
                </>
              )}
              {needsProvision && (
                <Button size="sm" variant="primary" onClick={() => setConfirmAction("provision")}>
                  Create account
                </Button>
              )}
              {canManageAccount && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setConfirmAction("resend")}>
                    Resend credentials
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmAction("reset-password")}>
                    Reset password
                  </Button>
                  {linkedUser?.mentorAccountStatus === "suspended" ? (
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction("reactivate")}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setConfirmAction("suspend")}>
                      Suspend
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setConfirmAction("deactivate")}>
                    Deactivate
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction("remove-role")}>
                    Remove role
                  </Button>
                </>
              )}
              {["approved", "rejected", "changes_requested"].includes(app.status) && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction("archive")}>
                  Archive
                </Button>
              )}
            </div>
          </div>
        )}
      </aside>

      {activeConfirm && (
        <MentorActionConfirmDialog
          open
          title={activeConfirm.title}
          description={activeConfirm.description}
          confirmLabel={activeConfirm.confirmLabel}
          confirmVariant={activeConfirm.variant}
          requireReason={activeConfirm.requireReason}
          reason={reason}
          onReasonChange={setReason}
          loading={mutation.isPending}
          onClose={() => {
            setConfirmAction(null);
            setReason("");
          }}
          onConfirm={() => confirmAction && mutation.mutate(confirmAction)}
        />
      )}
    </>
  );
}
