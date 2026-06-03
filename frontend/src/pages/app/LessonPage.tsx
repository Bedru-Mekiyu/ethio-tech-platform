import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Play } from "lucide-react";
import { completeLesson, fetchLessonById } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { useAuthStore } from "@/store/authStore";
import { fetchMe } from "@/services/authService";

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [completed, setCompleted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonById(lessonId!),
    enabled: !!lessonId,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeLesson(lessonId!),
    onSuccess: async (result) => {
      setCompleted(true);
      if ((result as { alreadyCompleted?: boolean }).alreadyCompleted) return;
      const user = await fetchMe();
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    );

  const lesson = data;
  const nextLessonId = (lesson as Record<string, unknown>)["nextLessonId"] as string | undefined;
  const trackId = (lesson as Record<string, unknown>)["trackId"] as string | undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={trackId ? `/app/tracks/${trackId}` : "/app/tracks"}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={14} />
        Back to track
      </Link>

      <div>
        <Badge className="mb-3">Lesson</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-white">{lesson?.title}</h1>
      </div>

      <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="prose prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-[var(--text-secondary)] leading-7">
            {lesson?.content || "Lesson content will appear here. Follow along with your mentor and squad."}
          </p>
        </div>

        {lesson?.videoUrl && (
          <a
            href={lesson.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-primary hover:bg-white/10 transition"
          >
            <Play size={16} />
            Open video lesson
          </a>
        )}

        {lesson?.codeSandboxUrl && (
          <a
            href={lesson.codeSandboxUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-primary hover:bg-white/10 transition"
          >
            <BookOpen size={16} />
            Open coding sandbox
          </a>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {completed ? (
          <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-5 py-3 text-sm text-success font-medium">
            <CheckCircle size={16} />
            Lesson completed! +{lesson?.xpReward ?? 0} XP
          </div>
        ) : (
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            size="lg"
          >
            {completeMutation.isPending ? "Saving..." : `Mark complete (+${lesson?.xpReward ?? 0} XP)`}
          </Button>
        )}

        {completed && nextLessonId && (
          <Link to={`/app/lessons/${nextLessonId}`}>
            <Button size="lg" variant="outline">
              Next lesson
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        )}

        {completed && !nextLessonId && trackId && (
          <Link to={`/app/tracks/${trackId}`}>
            <Button size="lg" variant="outline">
              Back to track
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
