import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Smartphone,
  Sliders,
  Calendar,
  Video,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Users,
  Shield,
  FileText,
  AlertTriangle,
  RefreshCw,
  Mail,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

interface RubricScores {
  experience: number;
  techStack: number;
  commitment: number;
  motivation: number;
}

function calculateRubricScore(scores: RubricScores) {
  const total = scores.experience + scores.techStack + scores.commitment + scores.motivation;
  const max = 20;
  const percentage = Math.round((total / max) * 100);

  let recommendation: string;
  let variant: "success" | "purple" | "warning" | "default";

  if (percentage >= 85) {
    recommendation = "Strong Recommend";
    variant = "success";
  } else if (percentage >= 70) {
    recommendation = "Recommend";
    variant = "purple";
  } else if (percentage >= 50) {
    recommendation = "Needs Interview / Info";
    variant = "warning";
  } else {
    recommendation = "Below Threshold";
    variant = "default";
  }

  return { total, max, percentage, recommendation, variant };
}

function autoEvaluateApplication(app: MentorApplication): RubricScores {
  const yrs = app.yearsExperience ?? 0;
  let expScore = 1;
  if (yrs >= 7) expScore = 5;
  else if (yrs >= 5) expScore = 4;
  else if (yrs >= 3) expScore = 3;
  else if (yrs >= 1) expScore = 2;

  const expertiseCount = (app.expertise ?? []).length;
  let techScore = Math.min(5, Math.max(2, Math.ceil(expertiseCount / 2)));
  if (app.currentRole && app.currentRole.length > 5) {
    techScore = Math.min(5, techScore + 1);
  }

  let comScore = 3;
  if (app.availability === "flexible") comScore = 5;
  else if (app.availability === "weekends" || app.availability === "weeknights") comScore = 4;
  else if (app.availability === "ad-hoc") comScore = 3;

  const motivationLen = (app.whyMentor ?? "").trim().length;
  let motScore = 2;
  if (motivationLen > 250) motScore = 5;
  else if (motivationLen > 120) motScore = 4;
  else if (motivationLen > 50) motScore = 3;

  return {
    experience: expScore,
    techStack: techScore,
    commitment: comScore,
    motivation: motScore,
  };
}

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<"application" | "rubric" | "account" | "teaching" | "audit">("application");

  const [rubricScores, setRubricScores] = useState<RubricScores>({
    experience: 4,
    techStack: 4,
    commitment: 4,
    motivation: 4,
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const detailQuery = useQuery({
    queryKey: ["admin", "mentor-application", id],
    queryFn: async () => {
      const data = await fetchApplicationDetail(id!);
      if (data?.application) {
        setRubricScores(autoEvaluateApplication(data.application));
        if (data.application.reviewNotes) {
          setReviewNotes(data.application.reviewNotes);
        }
      }
      return data;
    },
    enabled: Boolean(id),
  });

  usePageTitle(
    detailQuery.data?.application?.fullName
      ? `${detailQuery.data.application.fullName} - Mentor Screening & Detail`
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
      toast.success("Review status updated to In-Review");
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

  const rubric = useMemo(() => calculateRubricScore(rubricScores), [rubricScores]);

  const meetingUrl = id ? `https://meet.ethiotech.org/screening/${id}` : "";
  const gcalTitle = encodeURIComponent(`Ethio-Tech Mentor Screening: ${app?.fullName ?? "Applicant"}`);
  const gcalDetails = encodeURIComponent(
    `Mentor Screening Interview for Ethio-Tech Platform.\n\nApplicant: ${app?.fullName ?? ""}\nEmail: ${app?.email ?? ""}\nCurrent Role: ${app?.currentRole ?? ""}\nMeeting Link: ${meetingUrl}`,
  );
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&details=${gcalDetails}`;

  const emailTemplate = `Subject: Ethio-Tech Mentor Application - Interview Invitation

Hi ${app?.fullName ?? "Applicant"},

Thank you for applying to become a mentor on the Ethio-Tech platform!

We reviewed your background as a ${app?.currentRole ?? "Software Engineer"} and would love to schedule a quick 30-minute screening conversation to discuss cohort mentorship opportunities and answer any questions you may have.

Screening Meeting Room: ${meetingUrl}

Please reply with your preferred availability (EAT timezone) or confirm if you can join during one of our upcoming screening slots.

Best regards,
Ethio-Tech Mentorship Team`;

  const copyToClipboard = async (text: string, isLink: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedTemplate(true);
        setTimeout(() => setCopiedTemplate(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const applyRubricToNotes = () => {
    const summary = `[Rubric Evaluation: ${rubric.percentage}% (${rubric.total}/${rubric.max} pts - ${rubric.recommendation})]
• Experience: ${rubricScores.experience}/5
• Tech Stack Fit: ${rubricScores.techStack}/5
• Time Commitment: ${rubricScores.commitment}/5
• Mentoring Philosophy: ${rubricScores.motivation}/5`;

    setReviewNotes((prev) => (prev ? `${prev}\n\n${summary}` : summary));
    toast.success("Rubric feedback added to review notes");
  };

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
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Top Header */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/moderation")} className="text-xs text-zinc-300">
              <ArrowLeft size={13} className="mr-1" /> Back to Queue
            </Button>
            <div className="h-5 w-px bg-[#27272A]" />
            <h1 className="text-xl font-bold text-white sm:text-2xl">{app?.fullName ?? "Mentor Detail"}</h1>
            {app && (
              <Badge variant={rubric.variant} size="sm">
                {rubric.percentage}% Match
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => invalidate()} className="text-xs text-zinc-300 hover:text-white">
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </Card>

      {detailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : app ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-6 lg:col-span-2">
            {/* Applicant Profile Card */}
            <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {linkedUser?.avatarUrl ? (
                    <img
                      src={linkedUser.avatarUrl}
                      alt={app.fullName}
                      className="h-12 w-12 rounded-xl border border-[#27272A] bg-[#141418] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-xl font-bold text-violet-400">
                      {app.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-white">{app.fullName}</h2>
                    <p className="text-xs text-zinc-400">
                      {app.currentRole}
                      {app.currentCompany ? ` • ${app.currentCompany}` : ""}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{app.email}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {statusBadge(app.status)}
                      {linkedUser?.mentorAccountStatus && (
                        <Badge variant="purple" size="sm">{linkedUser.mentorAccountStatus.replace(/_/g, " ")}</Badge>
                      )}
                      <Badge variant="default" size="sm">{app.location ?? "Ethiopia / Remote"}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {app.linkedin && (
                    <a
                      href={app.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline bg-violet-500/5 px-2.5 py-1 rounded-md border border-violet-500/20"
                    >
                      LinkedIn <ExternalLink size={11} />
                    </a>
                  )}
                  {app.portfolio && (
                    <a
                      href={app.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline bg-violet-500/5 px-2.5 py-1 rounded-md border border-violet-500/20"
                    >
                      Portfolio <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-[#27272A] pb-3">
              {[
                { key: "application", label: "Application & Profile", icon: <Briefcase size={15} /> },
                { key: "rubric", label: "Evaluation Rubric & Interview", icon: <Sliders size={15} /> },
                { key: "account", label: "Account & Credentials", icon: <Shield size={15} /> },
                { key: "teaching", label: "Teaching & Sessions", icon: <Users size={15} /> },
                { key: "audit", label: "Audit Timeline", icon: <Clock size={15} /> },
              ].map((t) => (
                <Button
                  key={t.key}
                  variant={activeTab === t.key ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className="gap-1.5 text-xs"
                >
                  {t.icon} {t.label}
                </Button>
              ))}
            </div>

            {/* Tab 1: Application Profile */}
            {activeTab === "application" && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Application Overview
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Current Position</p>
                      <p className="text-sm font-medium text-white">
                        {app.currentRole}
                        {app.currentCompany ? ` at ${app.currentCompany}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Experience</p>
                      <p className="text-sm font-medium text-white">{app.yearsExperience ?? 0} years</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Location</p>
                      <p className="text-sm font-medium text-white">{app.location ?? "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Availability</p>
                      <p className="text-sm capitalize font-medium text-white">{app.availability ?? "Flexible"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Mentoring Style</p>
                      <p className="text-sm font-medium text-white">
                        {(app.mentoringStyle ?? []).join(", ") || "Live Sessions & Reviews"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Application Date</p>
                      <p className="text-sm font-medium text-white">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Why do you want to mentor on Ethio-Tech?</p>
                    <div className="rounded-xl border border-[var(--border)] bg-white/5 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {app.whyMentor || "No statement provided."}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                      Specialized Skills & Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(app.expertise ?? []).map((skill) => (
                        <Badge key={skill} variant="purple" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </section>

                {app.rejectionReason && (
                  <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
                    <p className="font-semibold text-red-400">Previous Rejection Reason</p>
                    <p className="mt-1 text-[var(--text-secondary)]">{app.rejectionReason}</p>
                  </section>
                )}
              </div>
            )}

            {/* Tab 2: Evaluation Rubric & Interview */}
            {activeTab === "rubric" && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Structured Evaluation Rubric</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Evaluate candidate across standard screening dimensions.
                      </p>
                    </div>
                    <Badge variant={rubric.variant} className="text-sm py-1.5 px-3">
                      {rubric.percentage}% - {rubric.recommendation}
                    </Badge>
                  </div>

                  {/* 4 Rubric Criteria */}
                  <div className="space-y-4">
                    {[
                      {
                        key: "experience" as keyof RubricScores,
                        title: "1. Years of Experience",
                        desc: "Relevance of professional engineering experience.",
                        labels: ["< 1 yr (1★)", "1-2 yrs (2★)", "3-4 yrs (3★)", "5-7 yrs (4★)", "8+ yrs (5★)"],
                      },
                      {
                        key: "techStack" as keyof RubricScores,
                        title: "2. Tech Stack & Curriculum Match",
                        desc: "Alignment with open frontend, backend, AI, or cloud tracks.",
                        labels: ["Low match (1★)", "Basic match (2★)", "Good match (3★)", "Strong match (4★)", "Expert lead (5★)"],
                      },
                      {
                        key: "commitment" as keyof RubricScores,
                        title: "3. Time Commitment & Availability",
                        desc: "Capacity to lead live sessions, project reviews, or office hours.",
                        labels: ["Unclear (1★)", "1-2 hrs/wk (2★)", "3-5 hrs/wk (3★)", "5-10 hrs/wk (4★)", "10+ hrs/wk (5★)"],
                      },
                      {
                        key: "motivation" as keyof RubricScores,
                        title: "4. Motivation & Communication",
                        desc: "Pedagogical clarity, empathy, and commitment to Ethiopian student success.",
                        labels: ["Minimal (1★)", "Acceptable (2★)", "Good (3★)", "Very strong (4★)", "Inspirational (5★)"],
                      },
                    ].map((c) => (
                      <div key={c.key} className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-white">{c.title}</span>
                          <span className="font-mono text-xs font-bold text-primary">
                            {rubricScores[c.key]}/5 ({c.labels[rubricScores[c.key] - 1]})
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{c.desc}</p>
                        <div className="grid grid-cols-5 gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setRubricScores((prev) => ({ ...prev, [c.key]: v }))}
                              className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                                rubricScores[c.key] === v
                                  ? "border-primary bg-primary text-black font-bold shadow-xs"
                                  : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:bg-white/10"
                              }`}
                            >
                              {v} ★
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" size="sm" onClick={applyRubricToNotes} className="gap-2">
                      <Sparkles size={14} /> Generate Review Notes from Rubric
                    </Button>
                  </div>
                </section>

                {/* Direct Interview Scheduling Section */}
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h3 className="text-base font-bold text-white">Screening Interview & Calendar</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Dedicated Video Room
                      </p>
                      <input
                        type="text"
                        readOnly
                        value={meetingUrl}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)]"
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(meetingUrl, true)}
                          className="flex-1 text-xs gap-1"
                        >
                          {copiedLink ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                          {copiedLink ? "Copied" : "Copy Link"}
                        </Button>
                        <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" variant="primary" className="w-full text-xs gap-1">
                            <Video size={13} /> Launch Room
                          </Button>
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Calendar Invite
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Schedule directly on Google Calendar with prefilled agenda and meeting link.
                      </p>
                      <div className="pt-2">
                        <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                            <Calendar size={14} /> Schedule on Google Calendar
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Email Invite Template
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(emailTemplate, false)}
                        className="h-6 text-xs text-primary gap-1"
                      >
                        {copiedTemplate ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        {copiedTemplate ? "Copied" : "Copy Template"}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={emailTemplate}
                      className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs font-mono text-[var(--text-secondary)] leading-relaxed"
                    />
                  </div>
                </section>
              </div>
            )}

            {/* Tab 3: Account & Credentials */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Linked User Account
                  </h3>
                  {linkedUser ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">User ID</p>
                        <p className="text-sm font-mono text-white">{linkedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Role</p>
                        <p className="text-sm text-white capitalize">{linkedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Last Login</p>
                        <p className="text-sm text-white">
                          {linkedUser.lastLoginAt ? new Date(linkedUser.lastLoginAt).toLocaleString() : "Never logged in"}
                        </p>
                      </div>
                      {detail?.credentialsStatus.provisionedAt && (
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Provisioned At</p>
                          <p className="text-sm text-white">
                            {new Date(detail.credentialsStatus.provisionedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {detail?.credentialsStatus.sentAt && (
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">Credentials Status</p>
                          <p className="text-sm text-white">
                            Sent via {detail.credentialsStatus.deliveryMethod ?? "email"} on{" "}
                            {new Date(detail.credentialsStatus.sentAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">No active user account provisioned yet.</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Once approved, you can create credentials or provision automatically.
                      </p>
                    </div>
                  )}
                </section>

                {linkedUser && (
                  <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Security & Login History
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Active Sessions</p>
                        <p className="text-xl font-bold text-white">{loginHistory?.activeSessions ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Last IP Address</p>
                        <p className="text-sm font-mono text-white">{loginHistory?.lastLoginIp ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Registered Devices</p>
                        <p className="text-xl font-bold text-white">{loginHistory?.devices?.length ?? 0}</p>
                      </div>
                    </div>

                    {(loginHistory?.devices ?? []).length > 0 && (
                      <div className="space-y-2 pt-2">
                        {loginHistory!.devices!.map((device, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/5 p-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {device.type === "mobile" ? <Smartphone size={16} /> : <Monitor size={16} />}
                              <div>
                                <span className="font-medium text-white capitalize">{device.type}</span>
                                {device.ip && <span className="text-[var(--text-muted)] ml-2">({device.ip})</span>}
                              </div>
                            </div>
                            {device.lastUsedAt && (
                              <span className="text-[var(--text-muted)]">
                                {new Date(device.lastUsedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* Tab 4: Teaching */}
            {activeTab === "teaching" && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Teaching Metrics & Cohort Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-5 text-center">
                    <p className="text-4xl font-bold text-white">{detail?.teaching.totalSessions ?? 0}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">Total Sessions</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-5 text-center">
                    <p className="text-4xl font-bold text-white">{detail?.teaching.studentsCount ?? 0}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">Mentees Guided</p>
                  </div>
                </div>

                {(detail?.teaching.sessions ?? []).length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Recent Sessions:</p>
                    {detail!.teaching.sessions.slice(0, 8).map((session, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm"
                      >
                        <span className="text-white font-medium">{session.title ?? "Untitled Session"}</span>
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
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">No cohort sessions recorded yet.</p>
                )}
              </section>
            )}

            {/* Tab 5: Audit Timeline */}
            {activeTab === "audit" && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Application Audit Trail
                </h3>
                {id && <MentorAuditTimeline applicationId={id} />}
              </section>
            )}

            {/* Review Notes Box */}
            {canReview && isAdmin && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 p-6 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Review & Feedback Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
                  placeholder="Enter approval notes, onboarding instructions, or specific changes requested..."
                />
              </section>
            )}
          </div>

          {/* Right Action Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {isAdmin && app && (
              <div className="sticky top-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/70 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Quick Actions
                  </h3>
                  {statusBadge(app.status)}
                </div>

                <div className="flex flex-col gap-2.5">
                  {app.status === "pending_review" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startReviewMutation.mutate()}
                      disabled={startReviewMutation.isPending}
                      className="w-full gap-2"
                    >
                      <Clock size={15} /> Mark In-Review
                    </Button>
                  )}

                  {canReview && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setConfirmAction("approve")}
                        className="w-full gap-2"
                      >
                        <CheckCircle2 size={15} /> Approve Application
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmAction("reject")}
                        className="w-full gap-2"
                      >
                        <XCircle size={15} /> Reject Application
                      </Button>
                      {app.status === "pending_review" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction("request-changes")}
                          className="w-full gap-2"
                        >
                          <FileText size={15} /> Request Changes / Info
                        </Button>
                      )}
                    </>
                  )}

                  {needsProvision && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setProvisionDialogOpen(true)}
                      className="w-full gap-2"
                    >
                      <UserCheck size={15} /> Provision Mentor Account
                    </Button>
                  )}

                  {canManageAccount && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAction("resend")}
                        className="w-full gap-2"
                      >
                        <Mail size={15} /> Resend Credentials
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAction("reset-password")}
                        className="w-full gap-2"
                      >
                        <Shield size={15} /> Reset Password
                      </Button>
                      {linkedUser?.mentorAccountStatus === "suspended" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction("reactivate")}
                          className="w-full gap-2 text-success"
                        >
                          <RefreshCw size={15} /> Reactivate Mentor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmAction("suspend")}
                          className="w-full gap-2 text-warning"
                        >
                          <AlertTriangle size={15} /> Suspend Mentor
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAction("deactivate")}
                        className="w-full gap-2"
                      >
                        Deactivate Account
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmAction("remove-role")}
                        className="w-full gap-2"
                      >
                        Remove Mentor Role
                      </Button>
                    </>
                  )}

                  {["approved", "rejected", "changes_requested"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmAction("archive")}
                      className="w-full"
                    >
                      Archive Application
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

      {/* Confirmation Dialogs */}
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

      {/* Account Provisioning Dialog */}
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
