import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileCode2, Rocket, Send, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { api } from "@/services/api";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const schema = z.object({
  projectId: z.string().min(1, "Choose a project"),
  githubLink: optionalUrl,
  deployedUrl: optionalUrl,
  files: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function SubmitSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Skeleton className="min-h-[34rem] rounded-[28px]" />
        <Skeleton className="min-h-[34rem] rounded-[28px]" />
      </div>
    </div>
  );
}

export function ProjectSubmitPage() {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;
  const assignedProjects = useMemo(() => dashboard?.assignedProjects ?? [], [dashboard?.assignedProjects]);
  const recentSubmissions = useMemo(() => dashboard?.recentSubmissions ?? [], [dashboard?.recentSubmissions]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema as never) as Resolver<FormData>,
    defaultValues: {
      projectId: "",
      files: "",
    },
  });

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const selectedProject = useMemo(
    () => assignedProjects.find((project) => project.projectId === selectedProjectId) ?? assignedProjects[0],
    [assignedProjects, selectedProjectId],
  );

  useEffect(() => {
    if (!selectedProjectId && assignedProjects.length) {
      setValue("projectId", assignedProjects[0].projectId, { shouldValidate: true });
    }
  }, [assignedProjects, selectedProjectId, setValue]);

  const submissionMutation = useMutation({
    mutationFn: async (payload: { project: string; githubLink?: string; deployedUrl?: string; files?: string[] }) => {
      const { data } = await api.post("/submissions", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      reset({
        projectId: selectedProject?.projectId ?? "",
        files: "",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    const files = (data.files ?? "")
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    await submissionMutation.mutateAsync({
      project: data.projectId,
      githubLink: data.githubLink || undefined,
      deployedUrl: data.deployedUrl || undefined,
      files: files.length ? files : undefined,
    });
  };

  if (dashboardQuery.isLoading) return <SubmitSkeleton />;
  if (dashboardQuery.isError) {
    return <QueryError message="Unable to load project submissions." onRetry={() => void dashboardQuery.refetch()} />;
  }

  if (!assignedProjects.length) {
    return (
      <EmptyState
        title="No assigned projects yet"
        description="Join a track first so the project workspace can unlock the next build step."
        actionLabel="Browse tracks"
        actionHref="/app/tracks"
      />
    );
  }

  const latestSubmission = recentSubmissions[0];
  const completion = selectedProject?.completionPercent ?? 0;
  const projectField = register("projectId");
  const checklist = [
    { label: "Pick the right project", done: !!selectedProject?.projectId },
    { label: "Add a GitHub link", done: !!selectedProject?.githubLink },
    { label: "Add a deployed URL", done: !!selectedProject?.deployedUrl },
    { label: "Submit file list", done: !!selectedProject?.feedback || completion >= 80 },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Submit a project</h1>
            <p className="max-w-2xl text-[var(--text-secondary)]">
              Choose a live assignment, attach the right links, and keep your submission clear enough for a fast review
              loop.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/app/projects">
                <Button size="lg" variant="primary" type="button">
                  <Rocket size={16} />
                  View assignments
                </Button>
              </Link>
              <Link to={selectedProject?.trackId ? `/app/tracks/${selectedProject.trackId}` : "/app/tracks"}>
                <Button size="lg" variant="outline" type="button">
                  <ShieldCheck size={16} />
                  View track
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[30rem]">
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Assigned projects</p>
              <p className="mt-2 text-2xl font-semibold text-white">{assignedProjects.length}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">In feedback</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {assignedProjects.filter((p) => p.category === "feedback").length}
              </p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Ready to ship</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {assignedProjects.filter((p) => p.category === "active").length}
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="mt-3 text-2xl font-semibold text-white">Active assignment board</h2>
              </div>
              <Badge variant="success">{Math.round(completion)}% complete</Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {assignedProjects.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(project.projectId);
                    setValue("projectId", project.projectId, { shouldValidate: true });
                  }}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    project.projectId === selectedProjectId
                      ? "border-primary bg-primary/10"
                      : "border-[var(--border)] bg-white/5 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{project.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {project.trackTitle} · {project.difficulty ?? "guided"} · {project.xpReward ?? 0} XP
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.category === "completed"
                          ? "success"
                          : project.category === "feedback"
                            ? "purple"
                            : "default"
                      }
                    >
                      {project.submissionStatus}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>Progress</span>
                      <span>{project.completionPercent}%</span>
                    </div>
                    <ProgressBar value={project.completionPercent} className="h-2.5" />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">{selectedProject?.title}</h2>
              </div>
              <Badge variant="purple">{selectedProject?.trackTitle ?? "Learning track"}</Badge>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              {selectedProject?.description ||
                "Use the submission form to provide the links and files your mentor needs."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Feedback</p>
                <p className="mt-2 text-sm text-white">{selectedProject?.feedback || "Awaiting review"}</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Grade</p>
                <p className="mt-2 text-2xl font-semibold text-white">{selectedProject?.grade ?? "—"}</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="stat-label">Submitted</p>
                <p className="mt-2 text-sm text-white">
                  {selectedProject?.submittedAt
                    ? new Date(selectedProject.submittedAt).toLocaleDateString()
                    : "Not yet"}
                </p>
              </Card>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <CardHeader className="p-0">
              <div>
                <CardTitle className="mt-3">Send the final build</CardTitle>
              </div>
            </CardHeader>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  {...projectField}
                  onChange={(event) => {
                    projectField.onChange(event);
                    setSelectedProjectId(event.target.value);
                    setValue("projectId", event.target.value, { shouldValidate: true });
                  }}
                >
                  {assignedProjects.map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.title}
                    </option>
                  ))}
                </Select>
                {errors.projectId ? <p className="text-xs text-danger">{errors.projectId.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>GitHub repository</Label>
                <Input
                  placeholder="https://github.com/username/project"
                  autoComplete="off"
                  {...register("githubLink")}
                />
                {errors.githubLink ? <p className="text-xs text-danger">Enter a valid GitHub URL.</p> : null}
              </div>

              <div className="space-y-2">
                <Label>Deployed URL</Label>
                <Input placeholder="https://your-app.vercel.app" autoComplete="off" {...register("deployedUrl")} />
                {errors.deployedUrl ? <p className="text-xs text-danger">Enter a valid deployed URL.</p> : null}
              </div>

              <div className="space-y-2">
                <Label>Files included</Label>
                <Textarea
                  placeholder="src/App.tsx&#10;src/components/...&#10;public/index.html"
                  {...register("files")}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Add one file per line or separate entries with commas.
                </p>
              </div>

              {submissionMutation.isError && (
                <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  Submission failed. Check the links and try again.
                </p>
              )}

              {submissionMutation.isSuccess && (
                <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  Submission sent. Your mentor can now review the build.
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || submissionMutation.isPending}
              >
                {isSubmitting || submissionMutation.isPending ? "Submitting..." : "Submit project"}
                <Send size={16} />
              </Button>
            </form>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase tracking-[0.22em]">Submission checklist</span>
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white">{item.label}</span>
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <FileCode2 size={14} />
              <span className="text-[10px] uppercase tracking-[0.22em]">Recent submissions</span>
            </div>
            <div className="mt-4 space-y-3">
              {(recentSubmissions.length
                ? recentSubmissions
                : [{ project: { title: "No submissions yet" }, status: "draft" }]
              ).map((submission, index) => (
                <div
                  key={`${submission.project?.title ?? "submission"}-${index}`}
                  className="rounded-[20px] border border-[var(--border)] bg-white/5 p-4"
                >
                  <p className="text-sm font-medium text-white">{submission.project?.title ?? "Untitled"}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {submission.status ?? "draft"} ·{" "}
                    {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "Not submitted"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {latestSubmission && (
        <Card className="rounded-[28px] border-[var(--border)] bg-[linear-gradient(180deg,rgba(16,23,37,0.92),rgba(8,12,20,0.96))] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {latestSubmission.project?.title ?? "Recent project"} is already in the review queue
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Keep iterating from the mentor feedback above and move the next submission forward with clearer scope
                and cleaner delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/app/projects">
                <Button variant="outline" type="button">
                  <ExternalLink size={14} className="mr-1" />
                  View assignments
                </Button>
              </Link>
              <Link to="/app/projects">
                <Button type="button">
                  <Rocket size={16} />
                  Prepare next build
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
