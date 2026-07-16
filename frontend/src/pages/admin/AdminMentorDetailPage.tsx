import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import {
  fetchApplicationDetail,
  fetchLoginHistory,
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
import { ProvisionAccountDialog } from "@/components/admin/ProvisionAccountDialog";
import { MentorAuditTimeline } from "@/components/admin/MentorAuditTimeline";
import { useToast } from "@/components/composites/ToastProvider";
import { usePageTitle } from "@/hooks/usePageTitle";

type ConfirmAction =
  | "approve"
  | "reject"
  | "request-changes"
  | "resend"
  | "reset-password"
  | "archive"
  | "suspend"
  | "reactivate"
  | "deactivate"
  | "remove-role";

export function AdminMentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [reason, setReason] = useState("");
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const detailQuery = useQuery({
    queryKey: ["admin", "mentor-application", id],
    queryFn: () => fetchApplicationDetail(id!),
    enabled: Boolean(id),
  });

  usePageTitle(
    detailQuery.data?.application?.fullName
      ? `${detailQuery.data.application.fullName} - Mentor Detail`
      : "Mentor Detail",
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-applications"] });
    if (id) {
      await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-application", id] });
    }
  };

  const mutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (!id) throw new Error("No application");
      switch (action) {
        case "approve":
          return approveApplication(id, reviewNotes.trim() || undefined);
        case "reject":
          return rejectApplication(id, reason);
        case "request-changes":
          return requestChanges(id, reason);
        case "resend":
          return resendCredentials(id);
        case "reset-password":
          return resetMentorPassword(id);
        case "archive":
          return archiveApplication(id);
        case "suspend":
          return suspendMentor(id, reason || undefined);
        case "reactivate":
          return reactivateMentor(id);
        case "deactivate":
          return deactivateMentor(id);
        case "remove-role":
          return removeMentorRole(id, reason || undefined);
        default:
          throw new Error("Unknown action");
      }
    },
    onSuccess: async (_result: unknown) => {
      const wasResend = confirmAction === "resend";
      const delivery = (_result as Record<string, unknown>)?.delivery as
        | { emailSent?: boolean; activationUrl?: string; deliveryMethod?: string }
        | undefined;

      if (wasResend && delivery) {
        if (delivery.emailSent) {
          toast.success("Credentials resent successfully. Check the mentor's email.");
        } else if (delivery.activationUrl) {
          toast.success(`Email not sent (SMTP not configured). Activation link: ${delivery.activationUrl}`);
        } else {
          toast.success("Credentials regenerated but email could not be sent. Check SMTP configuration.");
        }
      } else {
        toast.success("Action completed successfully");
      }

      setConfirmAction(null);
      setReason("");
      await invalidate();
    },
    onError: () => {
      toast.error("Action failed. Check permissions and try again.");
    },
  });

  const provisionMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => {
      if (!id) throw new Error("No application");
      return provisionApplication(id, email, password);
    },
    onSuccess: async () => {
      toast.success("Mentor account created successfully");
      setProvisionDialogOpen(false);
      await invalidate();
    },
    onError: () => {
      toast.error("Failed to create account. Check permissions and try again.");
    },
  });

  const startReviewMutation = useMutation({
    mutationFn: () => startReview(id!),
    onSuccess: async () => {
      toast.success("Review started");
      await invalidate();
    },
  });

  const loginHistoryQuery = useQuery({
    queryKey: ["admin", "mentor-login-history", id],
    queryFn: () => fetchLoginHistory(id!),
    enabled: Boolean(id),
  });

  const detail = detailQuery.data;
  const app = detail?.application;
  const linkedUser = detail?.user;
  const loginHistory = loginHistoryQuery.data;

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

  const canReview = app?.status === "pending_review" || app?.status === "changes_requested";
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

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--text-secondary)]">No application ID provided.</p>
        <Button variant="outline" onClick={() => navigate("/admin/moderation")}>
          Back to moderation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/moderation")}>
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold md:text-3xl">{app?.fullName ?? "Mentor Detail"}</h1>
      </div>

      {detailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      ) : app ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6">
              <div className="flex items-start gap-4">
                {linkedUser?.avatarUrl ? (
                  <img
                    src={linkedUser.avatarUrl}
                    alt={app.fullName}
                    className="h-16 w-16 rounded-full border border-[var(--border)] bg-white/5 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-primary/10 text-2xl font-bold text-primary">
                    {app.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">{app.fullName}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{app.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {statusBadge(app.status)}
                    {linkedUser?.mentorAccountStatus && (
                      <Badge variant="purple">{linkedUser.mentorAccountStatus.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Application</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Current Role</p>
                  <p className="text-sm text-white">
                    {app.currentRole}
                    {app.currentCompany ? ` at ${app.currentCompany}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Experience</p>
                  <p className="text-sm text-white">{app.yearsExperience ?? 0} years</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Location</p>
                  <p className="text-sm text-white">{app.location ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Availability</p>
                  <p className="text-sm capitalize text-white">{app.availability ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Mentoring Style</p>
                  <p className="text-sm text-white">{(app.mentoringStyle ?? []).join(", ") || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Why Mentor?</p>
                <p className="mt-1 rounded-xl border border-[var(--border)] bg-white/5 p-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {app.whyMentor}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs text-[var(--text-muted)]">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {(app.expertise ?? []).map((skill) => (
                    <Badge key={skill} variant="purple">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              {app.linkedin && (
                <a
                  href={app.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  LinkedIn <ExternalLink size={14} />
                </a>
              )}
              {app.portfolio && (
                <a
                  href={app.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline ml-4"
                >
                  Portfolio <ExternalLink size={14} />
                </a>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Account</h3>
              {linkedUser ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">User ID</p>
                    <p className="text-sm text-white">{linkedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Role</p>
                    <p className="text-sm text-white">{linkedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Last login</p>
                    <p className="text-sm text-white">
                      {linkedUser.lastLoginAt ? new Date(linkedUser.lastLoginAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  {detail?.credentialsStatus.provisionedAt && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Provisioned</p>
                      <p className="text-sm text-white">
                        {new Date(detail.credentialsStatus.provisionedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {detail?.credentialsStatus.sentAt && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Credentials sent</p>
                      <p className="text-sm text-white">
                        {detail.credentialsStatus.deliveryMethod ?? "sent"}{" "}
                        {new Date(detail.credentialsStatus.sentAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No linked user account yet.</p>
              )}
            </section>

            {linkedUser && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Login history
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Last login</p>
                    <p className="text-sm text-white">
                      {linkedUser.lastLoginAt ? new Date(linkedUser.lastLoginAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  {loginHistory?.lastLoginIp && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Last IP</p>
                      <p className="text-sm text-white">{loginHistory.lastLoginIp}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Active sessions</p>
                    <p className="text-sm text-white">{loginHistory?.activeSessions ?? 0}</p>
                  </div>
                </div>
                {(loginHistory?.devices ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">Registered devices:</p>
                    {loginHistory!.devices!.map((device, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-white/5 p-3"
                      >
                        {device.type === "mobile" ? (
                          <Smartphone size={16} className="mt-0.5 text-[var(--text-muted)]" />
                        ) : (
                          <Monitor size={16} className="mt-0.5 text-[var(--text-muted)]" />
                        )}
                        <div className="flex-1 text-sm">
                          <p className="text-[var(--text-secondary)]">{device.type}</p>
                          {device.ip && <p className="text-xs text-[var(--text-muted)]">{device.ip}</p>}
                          {device.lastUsedAt && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Last used: {new Date(device.lastUsedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Teaching</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4 text-center">
                  <p className="text-3xl font-bold text-white">{detail?.teaching.totalSessions ?? 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">Sessions</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4 text-center">
                  <p className="text-3xl font-bold text-white">{detail?.teaching.studentsCount ?? 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">Students</p>
                </div>
              </div>
              {(detail?.teaching.sessions ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">Recent sessions:</p>
                  {detail!.teaching.sessions.slice(0, 5).map((session, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">
                        {session.title ?? "Untitled session"}
                      </span>
                      <Badge
                        variant={
                          session.status === "completed"
                            ? "success"
                            : session.status === "cancelled"
                              ? "warning"
                              : "default"
                        }
                      >
                        {session.status ?? "scheduled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {canReview && isAdmin && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Review notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none focus:border-primary resize-y"
                  placeholder="Optional approval notes or internal feedback"
                />
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Audit timeline
              </h3>
              {id && <MentorAuditTimeline applicationId={id} />}
            </section>
          </div>

          <div className="space-y-4 lg:col-span-1">
            {isAdmin && app && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-5 space-y-3 sticky top-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</h3>
                <div className="flex flex-col gap-2">
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
                    <Button size="sm" variant="primary" onClick={() => setProvisionDialogOpen(true)}>
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
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">Application not found.</p>
          <Button variant="outline" onClick={() => navigate("/admin/moderation")}>
            Back to moderation
          </Button>
        </div>
      )}

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

      <ProvisionAccountDialog
        open={provisionDialogOpen}
        defaultEmail={app?.email ?? ""}
        loading={provisionMutation.isPending}
        onClose={() => setProvisionDialogOpen(false)}
        onConfirm={(email, password) => provisionMutation.mutate({ email, password })}
      />
    </div>
  );
}
