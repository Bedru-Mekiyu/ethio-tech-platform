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
    <div className="space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Project Submission Portal</h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Choose an active capstone assignment, attach your GitHub repository and live deployment URLs, and submit for mentor review.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/app/projects">
                <Button size="sm" variant="primary" type="button" className="text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
                  <Rocket size={13} />
                  View Assignments
                </Button>
              </Link>
              <Link to={selectedProject?.trackId ? `/app/tracks/${selectedProject.trackId}` : "/app/tracks"}>
                <Button size="sm" variant="outline" type="button" className="text-xs text-zinc-300 gap-1.5">
                  <ShieldCheck size={13} />
                  View Track
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 xl:w-[26rem]">
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 text-center">
              <p className="text-[10px] uppercase font-semibold text-zinc-500">Assigned</p>
              <p className="mt-1 text-lg font-bold text-white">{assignedProjects.length}</p>
            </div>
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 text-center">
              <p className="text-[10px] uppercase font-semibold text-zinc-500">In Feedback</p>
              <p className="mt-1 text-lg font-bold text-white">
                {assignedProjects.filter((p) => p.category === "feedback").length}
              </p>
            </div>
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 text-center">
              <p className="text-[10px] uppercase font-semibold text-zinc-500">Active</p>
              <p className="mt-1 text-lg font-bold text-white">
                {assignedProjects.filter((p) => p.category === "active").length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#27272A] pb-3">
              <h2 className="text-sm font-semibold text-white">Active Assignment Board</h2>
              <Badge variant="success" size="sm">{Math.round(completion)}% complete</Badge>
            </div>

            <div className="mt-4 grid gap-2.5">
              {assignedProjects.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(project.projectId);
                    setValue("projectId", project.projectId, { shouldValidate: true });
                  }}
                  className={`rounded-lg border p-3.5 text-left transition ${
                    project.projectId === selectedProjectId
                      ? "border-violet-500 bg-violet-500/10 text-white"
                      : "border-[#27272A] bg-[#141418] hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">{project.title}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
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
                      size="sm"
                    >
                      {project.category}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A] pb-3">
              <h2 className="text-sm font-semibold text-white">{selectedProject?.title}</h2>
              <Badge variant="purple" size="sm">{selectedProject?.trackTitle ?? "Learning Track"}</Badge>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
              {selectedProject?.description ||
                "Use the submission form to provide the links and files your mentor needs."}
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Feedback</p>
                <p className="mt-1 text-xs text-white">{selectedProject?.feedback || "Awaiting review"}</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Grade</p>
                <p className="mt-1 text-sm font-bold text-white">{selectedProject?.grade ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
                <p className="text-[10px] uppercase font-semibold text-zinc-500">Submitted</p>
                <p className="mt-1 text-xs text-white">
                  {selectedProject?.submittedAt
                    ? new Date(selectedProject.submittedAt).toLocaleDateString()
                    : "Not yet"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 shadow-sm">
            <CardHeader className="p-0 border-b border-[#27272A] pb-3">
              <CardTitle className="text-sm font-semibold text-white">Send Final Build</CardTitle>
            </CardHeader>

            <form className="mt-4 space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Project Assignment</Label>
                <Select
                  {...projectField}
                  onChange={(event) => {
                    projectField.onChange(event);
                    setSelectedProjectId(event.target.value);
                    setValue("projectId", event.target.value, { shouldValidate: true });
                  }}
                  className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                >
                  {assignedProjects.map((project) => (
                    <option key={project.projectId} value={project.projectId} className="bg-[#141418] text-white">
                      {project.title}
                    </option>
                  ))}
                </Select>
                {errors.projectId ? <p className="text-[11px] text-danger">{errors.projectId.message}</p> : null}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">GitHub Repository URL</Label>
                <Input
                  placeholder="https://github.com/username/project"
                  autoComplete="off"
                  {...register("githubLink")}
                  className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                />
                {errors.githubLink ? <p className="text-[11px] text-danger">Enter a valid GitHub URL.</p> : null}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Live Deployed URL</Label>
                <Input
                  placeholder="https://your-app.vercel.app"
                  autoComplete="off"
                  {...register("deployedUrl")}
                  className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                />
                {errors.deployedUrl ? <p className="text-[11px] text-danger">Enter a valid deployed URL.</p> : null}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Files Included</Label>
                <Textarea
                  placeholder="src/App.tsx&#10;src/components/...&#10;public/index.html"
                  {...register("files")}
                  className="bg-[#141418] border-[#27272A] text-xs text-white"
                />
                <p className="text-[11px] text-zinc-500">
                  Add one file per line or separate entries with commas.
                </p>
              </div>

              {submissionMutation.isError && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
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
