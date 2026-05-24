import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Layers3, Rocket, Sparkles } from "lucide-react";
import { fetchTrackById } from "@/services/tracksService";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";

function TrackDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[32rem] rounded-[28px]" />
        <Skeleton className="h-[32rem] rounded-[28px]" />
      </div>
    </div>
  );
}

export function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrackById(trackId!),
    enabled: !!trackId,
  });

  const modules = data?.modules ?? [];
  const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0);
  const estimatedXp = (data?.xpReward ?? 0) + modules.reduce(
    (sum, module) => sum + (module.lessons ?? []).reduce((lessonSum, lesson) => lessonSum + (lesson.xpReward ?? 0), 0),
    0
  );

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <TrackDetailSkeleton />;

  if (!data) {
    return (
      <EmptyState
        title="Track not found"
        description="The learning pathway may have moved or is not available yet."
        actionLabel="Browse tracks"
        onAction={() => window.location.assign("/app/tracks")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge className="mb-1">Track detail</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{data.title}</h1>
            <p className="max-w-2xl text-[var(--text-secondary)]">{data.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/app/projects/submit">
                <Button size="lg">
                  <Rocket size={16} />
                  Start a project
                </Button>
              </Link>
              <Link to="/app/workspace">
                <Button variant="outline" size="lg">
                  <BookOpen size={16} />
                  Open workspace
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[28rem]">
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Modules</p>
              <p className="mt-2 text-2xl font-semibold text-white">{modules.length}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Lessons</p>
              <p className="mt-2 text-2xl font-semibold text-white">{lessonCount}</p>
            </Card>
            <Card className="border-[var(--border)] bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">XP</p>
              <p className="mt-2 text-2xl font-semibold text-white">{estimatedXp}</p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="purple">Learning path</Badge>
              <CardTitle className="mt-3">Modules and lessons</CardTitle>
            </div>
            <Badge variant="success">{data.category ?? "core"}</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {modules.length ? (
              modules.map((module, index) => (
                <div key={module._id} className="rounded-[24px] border border-[var(--border)] bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Module {index + 1}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{module.title}</h3>
                    </div>
                    <Badge variant="purple">{module.lessons?.length ?? 0} lessons</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(module.lessons ?? []).map((lesson) => (
                      <Link
                        key={lesson._id}
                        to={`/app/lessons/${lesson._id}`}
                        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 transition hover:border-primary/40"
                      >
                        <span className="text-sm text-white">{lesson.title}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          +{lesson.xpReward ?? 0} XP <ArrowRight size={14} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No modules yet" description="This track will fill in as the curriculum is published." />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Layers3 size={14} />
              <span className="text-[10px] uppercase tracking-[0.22em]">Track snapshot</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">{data.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Built for steady progress with project checkpoints, mentor support, and visible XP growth.
            </p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Content coverage</span>
                <span>{modules.length ? 100 : 0}%</span>
              </div>
              <ProgressBar value={modules.length ? 100 : 0} className="h-2.5" />
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase tracking-[0.22em]">Next move</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">Move from lesson to project</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Once you finish the lessons, ship a project and let the mentor review loop unlock the next step.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/app/projects/submit">
                <Button>Submit capstone</Button>
              </Link>
              <Link to="/app/tracks">
                <Button variant="outline">Back to tracks</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
