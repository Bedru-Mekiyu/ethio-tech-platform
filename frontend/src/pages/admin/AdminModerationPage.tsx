import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/services/api";
import {
  fetchAdminMentorApplications,
  reviewAdminMentorApplication,
  type AdminMentorApplication,
} from "@/services/dashboardService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";

type QueueTab = "mentor-applications" | "submissions";

async function fetchSubmissions() {
  const { data } = await api.get<
    ApiResponse<{
      submissions: Array<{
        _id: string;
        status?: string;
        flagged?: boolean;
        flagReason?: string;
        student?: { fullName?: string };
        project?: { title?: string };
      }>;
    }>
  >("/admin/moderation");
  return data.data.submissions ?? [];
}

function ModerationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-40 w-full rounded-[24px]" />
      <Skeleton className="h-40 w-full rounded-[24px]" />
    </div>
  );
}

function ApplicationCard({
  application,
  onReview,
  notes,
  onNotesChange,
}: {
  application: AdminMentorApplication;
  onReview: (status: NonNullable<AdminMentorApplication["status"]>, reviewedNotes?: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const trimmedNotes = notes.trim();

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
        <Badge
          variant={
            application.status === "approved"
              ? "success"
              : application.status === "rejected"
                ? "warning"
                : "default"
          }
        >
          {application.status ?? "pending"}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
        <p>Location: {application.location ?? "Not provided"}</p>
        <p>Experience: {application.yearsExperience ?? 0} years</p>
        <p>Availability: {application.availability ?? "Not provided"}</p>
        <p>Style: {(application.mentoringStyle ?? []).join(", ") || "Not provided"}</p>
      </div>

      <p className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-sm leading-6 text-[var(--text-secondary)]">
        {application.whyMentor}
      </p>

      <div className="flex flex-wrap gap-2">
        {(application.expertise ?? []).slice(0, 6).map((skill) => (
          <Badge key={skill} variant="purple">
            {skill}
          </Badge>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Review notes</p>
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Add review feedback or request additional information."
          className="min-h-[90px]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="sm" variant="outline" onClick={() => onReview("pending", trimmedNotes || "Additional information requested from applicant.")}>
          Request info
        </Button>
        <Button size="sm" variant="primary" onClick={() => onReview("approved", trimmedNotes || undefined)}>
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => onReview("rejected", trimmedNotes || undefined)}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

export function AdminModerationPage() {
  const [tab, setTab] = useState<QueueTab>("mentor-applications");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const mentorApplicationsQuery = useQuery({
    queryKey: ["admin", "mentor-applications"],
    queryFn: fetchAdminMentorApplications,
    enabled: tab === "mentor-applications",
  });

  const submissionsQuery = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: fetchSubmissions,
    enabled: tab === "submissions",
  });

  const reviewMutation = useMutation({
    mutationFn: reviewAdminMentorApplication,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "mentor-applications"] });
    },
  });

  const counts = useMemo(
    () => ({
      applications: mentorApplicationsQuery.data?.applications.length ?? 0,
      submissions: submissionsQuery.data?.length ?? 0,
    }),
    [mentorApplicationsQuery.data?.applications.length, submissionsQuery.data?.length]
  );

  const loading = tab === "mentor-applications" ? mentorApplicationsQuery.isLoading : submissionsQuery.isLoading;
  const isError = tab === "mentor-applications" ? mentorApplicationsQuery.isError : submissionsQuery.isError;
  const refetch = tab === "mentor-applications" ? mentorApplicationsQuery.refetch : submissionsQuery.refetch;

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (loading) return <ModerationSkeleton />;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold md:text-3xl">Moderation queue</h1>
        <p className="max-w-2xl text-[var(--text-secondary)]">
          Review learner submissions and mentor applications from one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={tab === "mentor-applications" ? "primary" : "outline"}
          onClick={() => setTab("mentor-applications")}
          aria-pressed={tab === "mentor-applications"}
        >
          Mentor applications ({counts.applications})
        </Button>
        <Button
          variant={tab === "submissions" ? "primary" : "outline"}
          onClick={() => setTab("submissions")}
          aria-pressed={tab === "submissions"}
        >
          Submissions ({counts.submissions})
        </Button>
      </div>

      {tab === "mentor-applications" ? (
        <div className="space-y-4">
          {mentorApplicationsQuery.data?.applications.length ? (
            mentorApplicationsQuery.data.applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                notes={reviewNotes[application._id] ?? ""}
                onNotesChange={(value) => {
                  setReviewNotes((current) => ({ ...current, [application._id]: value }));
                }}
                onReview={(status, reviewedNotes) => {
                  void reviewMutation.mutateAsync({ id: application._id, status, reviewedNotes });
                }}
              />
            ))
          ) : (
            <EmptyState
              title="No mentor applications yet"
              description="Applications will appear here after mentors submit the public form."
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {submissionsQuery.data?.length ? (
            submissionsQuery.data.map((submission) => (
              <Card key={submission._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{submission.project?.title ?? "Submission"}</p>
                  <p className="text-sm text-[var(--text-muted)]">{submission.student?.fullName}</p>
                  {submission.flagReason ? <p className="text-xs text-warning">{submission.flagReason}</p> : null}
                </div>
                <Badge variant={submission.flagged ? "default" : "purple"}>{submission.status ?? "pending"}</Badge>
              </Card>
            ))
          ) : (
            <EmptyState title="Queue empty" description="No flagged or pending submissions." />
          )}
        </div>
      )}
    </div>
  );
}
