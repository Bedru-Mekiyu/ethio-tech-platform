import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeLesson, fetchLessonById } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/app/tracks" className="text-sm text-primary">
        Back to learning
      </Link>
      <h1 className="text-2xl font-bold">{data?.title}</h1>
      <Card className="prose prose-invert max-w-none p-6">
        <p className="whitespace-pre-wrap text-[var(--text-secondary)]">
          {data?.content || "Lesson content will appear here. Follow along with your mentor and squad."}
        </p>
        {data?.videoUrl ? (
          <a href={data.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-primary">
            Open video lesson
          </a>
        ) : null}
        {data?.codeSandboxUrl ? (
          <a href={data.codeSandboxUrl} target="_blank" rel="noreferrer" className="mt-2 block text-secondary">
            Open coding sandbox
          </a>
        ) : null}
      </Card>
      <Button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending || completed}
      >
        {completed ? "Lesson completed" : `Mark complete (+${data?.xpReward ?? 0} XP)`}
      </Button>
    </div>
  );
}
