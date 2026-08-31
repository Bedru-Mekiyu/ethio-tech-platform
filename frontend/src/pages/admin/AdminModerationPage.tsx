import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/components/composites/ToastProvider";
import {
  fetchQueueApplications,
  fetchQueueStats,
  approveApplication,
  rejectApplication,
  requestChanges,
  type MentorApplication,
} from "@/services/mentorApplicationService";
import { MentorActionConfirmDialog } from "@/components/admin/MentorActionConfirmDialog";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Square,
  Calendar,
  ExternalLink,
  Sliders,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Video,
  Download,
  Filter,
  Users,
  Award,
  Clock,
  Briefcase,
  FileText,
  RefreshCw,
  X,
} from "lucide-react";

type QueueTab = "pending" | "approved" | "rejected" | "changes-requested" | "archived";

const QUEUE_LABELS: Record<QueueTab, string> = {
  pending: "Pending Applications",
  approved: "Approved Mentors",
  rejected: "Rejected Applications",
  "changes-requested": "Changes Requested",
  archived: "Archived Applications",
};

const REJECTION_REASONS = [
  "Experience level does not meet current cohort requirements (minimum 2 years needed).",
  "Primary tech stack does not match open mentorship tracks for this cohort.",
  "Weekly availability is below platform minimum (3+ hours/week required).",
  "Incomplete portfolio or unverifiable technical experience.",
  "Application lacked specific motivation and mentoring methodology details.",
];

const REQUEST_INFO_TEMPLATES = [
  "Please provide a link to your active GitHub, portfolio, or recent production projects.",
  "Please clarify your weekly available hours and preferred time slots (EAT timezone).",
  "Please elaborate on your previous experience mentoring or coaching junior developers.",
  "Please update your current role, company, and primary tech stack specialization.",
];

interface RubricScores {
  experience: number; // 1-5
  techStack: number; // 1-5
  commitment: number; // 1-5
  motivation: number; // 1-5
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
  // Experience score: 1-5 based on years
  const yrs = app.yearsExperience ?? 0;
  let expScore = 1;
  if (yrs >= 7) expScore = 5;
  else if (yrs >= 5) expScore = 4;
  else if (yrs >= 3) expScore = 3;
  else if (yrs >= 1) expScore = 2;

  // Tech stack score based on expertise count and common keywords
  const expertiseCount = (app.expertise ?? []).length;
  let techScore = Math.min(5, Math.max(2, Math.ceil(expertiseCount / 2)));
  if (app.currentRole && app.currentRole.length > 5) {
    techScore = Math.min(5, techScore + 1);
  }

  // Commitment score based on availability
  let comScore = 3;
  if (app.availability === "flexible") comScore = 5;
  else if (app.availability === "weekends" || app.availability === "weeknights") comScore = 4;
  else if (app.availability === "ad-hoc") comScore = 3;

  // Motivation score based on whyMentor text length & quality
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

function ModerationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-44 w-full rounded-[24px]" />
      <Skeleton className="h-44 w-full rounded-[24px]" />
      <Skeleton className="h-44 w-full rounded-[24px]" />
    </div>
  );
}

function StatCard({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
        active
          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-primary/40"
          : "border-[var(--border)] bg-[var(--bg-card)]/70 hover:border-primary/30 hover:bg-[var(--bg-card)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{count}</p>
    </div>
  );
}

interface ApplicationCardProps {
  application: MentorApplication;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestChanges: (id: string) => void;
  onOpenRubric: (app: MentorApplication) => void;
  onOpenInterview: (app: MentorApplication) => void;
  reviewNotes: string;
  onReviewNotesChange: (id: string, value: string) => void;
}

function ApplicationCard({
  application,
  selected,
  onToggleSelect,
  onOpen,
  onApprove,
  onReject,
  onRequestChanges,
  onOpenRubric,
  onOpenInterview,
  reviewNotes,
  onReviewNotesChange,
}: ApplicationCardProps) {
  const isPending = application.status === "pending_review";
  const canAct = application.status === "pending_review" || application.status === "changes_requested";
  const rubric = useMemo(() => calculateRubricScore(autoEvaluateApplication(application)), [application]);

  return (
    <Card
      className={`group relative space-y-4 rounded-2xl border p-5 transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
          : "border-[var(--border)] bg-[var(--bg-card)]/90 hover:border-primary/40 hover:bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(application._id);
            }}
            className="mt-1 text-[var(--text-muted)] hover:text-primary transition-colors"
            aria-label={selected ? "Deselect applicant" : "Select applicant"}
          >
            {selected ? (
              <CheckCircle2 size={20} className="text-primary" />
            ) : (
              <Square size={20} className="text-[var(--text-muted)]" />
            )}
          </button>

          <div
            onClick={() => onOpen(application._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(application._id)}
            className="cursor-pointer"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                {application.fullName}
              </h3>
              <Badge variant={rubric.variant} className="text-[11px] gap-1">
                <Sparkles size={11} /> {rubric.percentage}% Match
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {application.currentRole}
              {application.currentCompany ? ` • ${application.currentCompany}` : ""}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{application.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              application.status === "approved"
                ? "success"
                : application.status === "rejected"
                  ? "warning"
                  : application.status === "changes_requested"
                    ? "purple"
                    : "default"
            }
          >
            {application.status.replace(/_/g, " ")}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenRubric(application);
            }}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Sliders size={13} /> Rubric
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInterview(application);
            }}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Calendar size={13} /> Interview
          </Button>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4 bg-white/[0.02] p-3 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-[var(--text-muted)]" />
          <span>{application.yearsExperience ?? 0} yrs experience</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[var(--text-muted)]" />
          <span className="capitalize">{application.availability ?? "Flexible"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Award size={14} className="text-[var(--text-muted)]" />
          <span>{(application.mentoringStyle ?? []).join(", ") || "Live Sessions"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[var(--text-muted)]" />
          <span>{application.location ?? "Ethiopia / Remote"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        {application.linkedin && (
          <a
            href={application.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            LinkedIn <ExternalLink size={12} />
          </a>
        )}
        {application.portfolio && (
          <a
            href={application.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Portfolio / GitHub <ExternalLink size={12} />
          </a>
        )}
        {application.cvUrl && (
          <a
            href={application.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            CV / Resume <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white/5 p-3.5 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Why Mentor?</p>
        <p className="line-clamp-3">{application.whyMentor || "No motivation statement provided."}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(application.expertise ?? []).slice(0, 10).map((skill) => (
          <Badge key={skill} variant="purple" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>

      {application.rejectionReason && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs">
          <p className="font-semibold text-red-400">Rejection Reason</p>
          <p className="mt-1 text-[var(--text-secondary)]">{application.rejectionReason}</p>
        </div>
      )}

      {application.reviewNotes && application.status === "changes_requested" && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs">
          <p className="font-semibold text-purple-400">Requested Changes</p>
          <p className="mt-1 text-[var(--text-secondary)]">{application.reviewNotes}</p>
        </div>
      )}

      {canAct && (
        <div className="pt-2 border-t border-[var(--border)] space-y-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
              Review notes & rubric feedback
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => onReviewNotesChange(application._id, e.target.value)}
              placeholder="Add feedback, approval remarks, or specific information requested..."
              className="min-h-[70px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
              aria-label="Review notes"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => onApprove(application._id)} className="gap-1.5">
              <CheckCircle2 size={15} /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => onReject(application._id)} className="gap-1.5">
              <XCircle size={15} /> Reject
            </Button>
            {isPending && (
              <Button size="sm" variant="outline" onClick={() => onRequestChanges(application._id)} className="gap-1.5">
                <FileText size={15} /> Request Info
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onOpen(application._id)}>
              View Full Profile
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

interface RubricModalProps {
  application: MentorApplication | null;
  onClose: () => void;
  onApplyRubricNotes: (notes: string) => void;
}

function RubricModal({ application, onClose, onApplyRubricNotes }: RubricModalProps) {
  const [prevAppId, setPrevAppId] = useState<string | undefined>(application?._id);
  const [scores, setScores] = useState<RubricScores>(() =>
    application
      ? autoEvaluateApplication(application)
      : { experience: 3, techStack: 3, commitment: 3, motivation: 3 }
  );

  if (application && application._id !== prevAppId) {
    setPrevAppId(application._id);
    setScores(autoEvaluateApplication(application));
  }

  if (!application) return null;

  const result = calculateRubricScore(scores);

  const criteria = [
    {
      key: "experience" as keyof RubricScores,
      title: "Years of Experience",
      desc: "Relevance of professional software engineering experience (0-10+ yrs).",
      labels: ["< 1 yr", "1-2 yrs", "3-4 yrs", "5-7 yrs", "8+ yrs"],
    },
    {
      key: "techStack" as keyof RubricScores,
      title: "Tech Stack & Track Fit",
      desc: "Alignment with Ethio-Tech curriculum (React, Node, Python, Cloud, Mobile).",
      labels: ["Minimal fit", "Basic fit", "Good fit", "Strong fit", "Expert / Lead"],
    },
    {
      key: "commitment" as keyof RubricScores,
      title: "Time Commitment & Availability",
      desc: "Ability to dedicate weekly hours, live cohorts, or weekend workshops.",
      labels: ["Ad-hoc / Unclear", "1-2 hrs/wk", "3-5 hrs/wk", "5-10 hrs/wk", "Flexible 10+ hrs"],
    },
    {
      key: "motivation" as keyof RubricScores,
      title: "Motivation & Mentoring Philosophy",
      desc: "Clear pedagogical approach, empathy, and passion for empowering Ethiopian youth.",
      labels: ["Weak statement", "Acceptable", "Good clarity", "Very thoughtful", "Exceptional vision"],
    },
  ];

  const handleGenerateNotes = () => {
    const summary = `[Rubric Evaluation: ${result.percentage}% (${result.total}/${result.max} pts - ${result.recommendation})]
• Experience: ${scores.experience}/5 (${criteria[0].labels[scores.experience - 1]})
• Tech Stack Fit: ${scores.techStack}/5 (${criteria[1].labels[scores.techStack - 1]})
• Time Commitment: ${scores.commitment}/5 (${criteria[2].labels[scores.commitment - 1]})
• Mentoring Philosophy: ${scores.motivation}/5 (${criteria[3].labels[scores.motivation - 1]})`;

    onApplyRubricNotes(summary);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Evaluation Rubric"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sliders size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-white">Evaluation Rubric</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Screening rubric for <span className="font-semibold text-white">{application.fullName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score Banner */}
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Overall Match Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">{result.percentage}%</span>
              <span className="text-sm text-[var(--text-secondary)]">({result.total} / {result.max} pts)</span>
            </div>
          </div>
          <Badge variant={result.variant} className="text-sm py-1.5 px-3">
            {result.recommendation}
          </Badge>
        </div>

        {/* Rubric Criteria */}
        <div className="space-y-5">
          {criteria.map((c) => {
            const currentVal = scores[c.key];
            return (
              <div key={c.key} className="space-y-2 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{c.title}</span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {currentVal} / 5 ({c.labels[currentVal - 1]})
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{c.desc}</p>
                <div className="grid grid-cols-5 gap-1.5 pt-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScores((prev) => ({ ...prev, [c.key]: val }))}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-xs transition-all ${
                        currentVal === val
                          ? "border-primary bg-primary text-black font-bold shadow-xs"
                          : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/50 hover:bg-white/10"
                      }`}
                    >
                      <span>{val} ★</span>
                      <span className="text-[10px] mt-0.5 truncate max-w-full px-1">{c.labels[val - 1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerateNotes} className="gap-2">
            <Sparkles size={15} /> Apply Rubric to Review Notes
          </Button>
        </div>
      </div>
    </>
  );
}

interface InterviewModalProps {
  application: MentorApplication | null;
  onClose: () => void;
}

function InterviewModal({ application, onClose }: InterviewModalProps) {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!application) return null;

  const meetingUrl = `https://meet.ethiotech.org/screening/${application._id}`;
  const gcalTitle = encodeURIComponent(`Ethio-Tech Mentor Screening: ${application.fullName}`);
  const gcalDetails = encodeURIComponent(
    `Mentor Screening Interview for Ethio-Tech Platform.\n\nApplicant: ${application.fullName} (${application.email})\nCurrent Role: ${application.currentRole}\nMeeting Link: ${meetingUrl}`,
  );
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&details=${gcalDetails}`;

  const emailTemplate = `Subject: Ethio-Tech Mentor Application - Interview Invitation

Hi ${application.fullName},

Thank you for applying to become a mentor on the Ethio-Tech platform!

We reviewed your background as a ${application.currentRole} and would love to schedule a quick 30-minute screening conversation to discuss cohort mentorship opportunities and answer any questions you may have.

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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-6"
        role="dialog"
        aria-modal="true"
        aria-label="Schedule Screening Interview"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interview Screening</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Applicant: <span className="text-white font-medium">{application.fullName}</span> ({application.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Direct Link Section */}
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Dedicated Video Room Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={meetingUrl}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)]"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(meetingUrl, true)}
              className="gap-1.5 shrink-0"
            >
              {copiedLink ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copiedLink ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" variant="primary" className="w-full gap-2">
                <Video size={14} /> Open Meeting Room
              </Button>
            </a>
            <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-2">
                <Calendar size={14} /> Add to Google Calendar
              </Button>
            </a>
          </div>
        </div>

        {/* Email Invitation Template */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Invitation Email Template
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(emailTemplate, false)}
              className="h-7 text-xs gap-1 text-primary"
            >
              {copiedTemplate ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copiedTemplate ? "Copied" : "Copy Template"}
            </Button>
          </div>
          <textarea
            readOnly
            value={emailTemplate}
            className="min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--text-secondary)] font-mono outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

export function AdminModerationPage() {
  usePageTitle("Mentor Moderation");
  const toast = useToast();
  const [tab, setTab] = useState<QueueTab>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expFilter, setExpFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [pageAction, setPageAction] = useState<{
    type: "approve" | "reject" | "request-changes" | "bulk-approve" | "bulk-reject" | "bulk-request";
    id?: string;
  } | null>(null);
  const [pageActionReason, setPageActionReason] = useState("");
  const [activeRubricApp, setActiveRubricApp] = useState<MentorApplication | null>(null);
  const [activeInterviewApp, setActiveInterviewApp] = useState<MentorApplication | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["admin", "mentor-applications", "stats"],
    queryFn: fetchQueueStats,
    refetchInterval: 30000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["admin", "mentor-applications", tab, page, debouncedSearch, expFilter],
    queryFn: () => {
      let experienceMin: number | undefined = undefined;
      let experienceMax: number | undefined = undefined;
      if (expFilter === "junior") {
        experienceMin = 0;
        experienceMax = 2;
      } else if (expFilter === "mid") {
        experienceMin = 3;
        experienceMax = 5;
      } else if (expFilter === "senior") {
        experienceMin = 6;
      }

      return fetchQueueApplications(tab, {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        experienceMin,
        experienceMax,
      });
    },
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applications = applicationsQuery.data?.applications ?? [];
  const allSelected = applications.length > 0 && applications.every((app) => selectedIds.has(app._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a._id)));
    }
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveApplication(id, reviewNotes[id]?.trim() || undefined),
    onSuccess: async () => {
      toast.success("Mentor application approved");
      setPageAction(null);
      await invalidateAll();
    },
    onError: () => toast.error("Failed to approve application"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectApplication(id, reason),
    onSuccess: async () => {
      toast.success("Mentor application rejected");
      setPageAction(null);
      setPageActionReason("");
      await invalidateAll();
    },
    onError: () => toast.error("Failed to reject application"),
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => requestChanges(id, notes),
    onSuccess: async () => {
      toast.success("Requested changes sent to applicant");
      setPageAction(null);
      setPageActionReason("");
      await invalidateAll();
    },
    onError: () => toast.error("Failed to request changes"),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => approveApplication(id, reviewNotes[id]?.trim() || undefined)));
    },
    onSuccess: async (results) => {
      toast.success(`${results.length} applications approved`);
      setSelectedIds(new Set());
      setPageAction(null);
      await invalidateAll();
    },
    onError: () => toast.error("Bulk approve encountered errors"),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      return Promise.all(ids.map((id) => rejectApplication(id, reason)));
    },
    onSuccess: async (results) => {
      toast.success(`${results.length} applications rejected`);
      setSelectedIds(new Set());
      setPageAction(null);
      setPageActionReason("");
      await invalidateAll();
    },
    onError: () => toast.error("Bulk reject encountered errors"),
  });

  const bulkRequestChangesMutation = useMutation({
    mutationFn: async ({ ids, notes }: { ids: string[]; notes: string }) => {
      return Promise.all(ids.map((id) => requestChanges(id, notes)));
    },
    onSuccess: async (results) => {
      toast.success(`Changes requested for ${results.length} applications`);
      setSelectedIds(new Set());
      setPageAction(null);
      setPageActionReason("");
      await invalidateAll();
    },
    onError: () => toast.error("Bulk request changes failed"),
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
    [stats],
  );

  const exportSelectedApplications = () => {
    const selectedList = applications.filter((app) => selectedIds.has(app._id));
    if (selectedList.length === 0) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mentor_applications_${tab}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${selectedList.length} applications`);
  };

  if (isError) return <QueryError onRetry={() => applicationsQuery.refetch()} />;

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mentor Moderation & Screening</h1>
            <p className="max-w-2xl text-xs text-zinc-400 leading-relaxed">
              Evaluate applicant rubrics, schedule screening interviews, and manage platform mentor onboarding.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => invalidateAll()} className="text-xs text-zinc-300 hover:text-white">
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Queue Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tabs.map(({ key, count }) => (
          <StatCard
            key={key}
            label={QUEUE_LABELS[key]}
            count={count}
            active={tab === key}
            onClick={() => {
              setTab(key);
              setPage(1);
              setSelectedIds(new Set());
            }}
          />
        ))}
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-white">
              {selectedIds.size === 1 ? "application" : "applications"} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-zinc-400 hover:text-white h-7 px-2"
            >
              Deselect All
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSelectedApplications}
              className="text-xs h-7 text-zinc-300"
            >
              <Download size={11} className="mr-1" /> Export JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPageAction({ type: "bulk-approve" })}
              className="text-xs h-7 gap-1"
            >
              <CheckCircle2 size={12} /> Approve All
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setPageAction({ type: "bulk-reject" })}
              className="text-xs h-7 gap-1"
            >
              <XCircle size={12} /> Reject All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageAction({ type: "bulk-request" })}
              className="text-xs h-7 gap-1"
            >
              <FileText size={12} /> Request Info
            </Button>
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Filters, Multi-select */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${QUEUE_LABELS[tab].toLowerCase()}...`}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-primary"
              aria-label={`Search ${QUEUE_LABELS[tab].toLowerCase()}`}
            />
          </div>

          {/* Experience Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <select
              value={expFilter}
              onChange={(e) => {
                setExpFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-primary"
            >
              <option value="all">All Experience Levels</option>
              <option value="junior">Junior (0 - 2 yrs)</option>
              <option value="mid">Mid-level (3 - 5 yrs)</option>
              <option value="senior">Senior (6+ yrs)</option>
            </select>
          </div>
        </div>

        {applications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="gap-1.5 text-xs">
            {allSelected ? <CheckCircle2 size={16} className="text-primary" /> : <Square size={16} />}
            {allSelected ? "Deselect All" : "Select All On Page"}
          </Button>
        )}
      </div>

      {/* Application Cards List */}
      {isLoading ? (
        <ModerationSkeleton />
      ) : applications.length ? (
        <>
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                selected={selectedIds.has(application._id)}
                onToggleSelect={toggleSelect}
                reviewNotes={reviewNotes[application._id] ?? ""}
                onReviewNotesChange={(id, value) => setReviewNotes((prev) => ({ ...prev, [id]: value }))}
                onOpen={(id) => navigate(`/admin/moderation/${id}`)}
                onApprove={(id) => setPageAction({ type: "approve", id })}
                onReject={(id) => setPageAction({ type: "reject", id })}
                onRequestChanges={(id) => setPageAction({ type: "request-changes", id })}
                onOpenRubric={(app) => setActiveRubricApp(app)}
                onOpenInterview={(app) => setActiveInterviewApp(app)}
              />
            ))}
          </div>

          {applicationsQuery.data?.pagination && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)]">
                Page {applicationsQuery.data.pagination.page} of {applicationsQuery.data.pagination.totalPages} (
                {applicationsQuery.data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (applicationsQuery.data.pagination.totalPages ?? 1)}
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
              ? "Applications will appear here once candidates submit the mentor application form."
              : "No applications found in this queue."
          }
        />
      )}

      {/* Rubric Evaluation Modal */}
      <RubricModal
        application={activeRubricApp}
        onClose={() => setActiveRubricApp(null)}
        onApplyRubricNotes={(notes) => {
          if (activeRubricApp) {
            setReviewNotes((prev) => ({ ...prev, [activeRubricApp._id]: notes }));
            toast.success("Rubric feedback added to notes");
          }
        }}
      />

      {/* Interview Screening Modal */}
      <InterviewModal
        application={activeInterviewApp}
        onClose={() => setActiveInterviewApp(null)}
      />

      {/* Action Dialog (Approve, Reject, Request Info, Bulk Actions) */}
      {pageAction && (
        <MentorActionConfirmDialog
          open
          title={
            pageAction.type === "approve"
              ? "Approve Mentor Application"
              : pageAction.type === "reject"
                ? "Reject Mentor Application"
                : pageAction.type === "request-changes"
                  ? "Request Additional Information"
                  : pageAction.type === "bulk-approve"
                    ? `Bulk Approve ${selectedIds.size} Applications`
                    : pageAction.type === "bulk-reject"
                      ? `Bulk Reject ${selectedIds.size} Applications`
                      : `Request Information for ${selectedIds.size} Applicants`
          }
          description={
            pageAction.type === "approve" || pageAction.type === "bulk-approve"
              ? "This will approve the mentor application and queue account activation credentials."
              : pageAction.type === "reject" || pageAction.type === "bulk-reject"
                ? "Applicants will be notified with your feedback and reasoning."
                : "Applicants will receive instructions to update and resubmit their application."
          }
          confirmLabel={
            pageAction.type.includes("approve")
              ? "Approve"
              : pageAction.type.includes("reject")
                ? "Reject"
                : "Send Request"
          }
          confirmVariant={pageAction.type.includes("reject") ? "danger" : "primary"}
          requireReason={!pageAction.type.includes("approve")}
          reason={pageActionReason}
          onReasonChange={setPageActionReason}
          loading={
            approveMutation.isPending ||
            rejectMutation.isPending ||
            requestChangesMutation.isPending ||
            bulkApproveMutation.isPending ||
            bulkRejectMutation.isPending ||
            bulkRequestChangesMutation.isPending
          }
          onClose={() => {
            setPageAction(null);
            setPageActionReason("");
          }}
          onConfirm={() => {
            if (pageAction.type === "approve" && pageAction.id) {
              approveMutation.mutate(pageAction.id);
            } else if (pageAction.type === "reject" && pageAction.id) {
              rejectMutation.mutate({ id: pageAction.id, reason: pageActionReason });
            } else if (pageAction.type === "request-changes" && pageAction.id) {
              requestChangesMutation.mutate({ id: pageAction.id, notes: pageActionReason });
            } else if (pageAction.type === "bulk-approve") {
              bulkApproveMutation.mutate(Array.from(selectedIds));
            } else if (pageAction.type === "bulk-reject") {
              bulkRejectMutation.mutate({ ids: Array.from(selectedIds), reason: pageActionReason });
            } else if (pageAction.type === "bulk-request") {
              bulkRequestChangesMutation.mutate({ ids: Array.from(selectedIds), notes: pageActionReason });
            }
          }}
        />
      )}
    </div>
  );
}
