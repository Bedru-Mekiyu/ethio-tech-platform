import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTrackById } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";

export function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrackById(trackId!),
    enabled: !!trackId,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/tracks" className="text-sm text-primary">
          Back to tracks
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data?.title}</h1>
        <p className="mt-1 text-[var(--text-secondary)]">{data?.description}</p>
      </div>
      {(data?.modules ?? []).length === 0 ? (
        <EmptyState title="No modules yet" description="Check back soon for new lessons." />
      ) : (
        data?.modules?.map((mod) => (
          <Card key={mod._id} className="p-4">
            <h2 className="font-semibold">{mod.title}</h2>
            <ul className="mt-3 space-y-2">
              {(mod.lessons ?? []).map((lesson) => (
                <li key={lesson._id}>
                  <Link
                    to={`/app/lessons/${lesson._id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:border-primary/40"
                  >
                    <span>{lesson.title}</span>
                    <span className="text-xs text-primary">+{lesson.xpReward ?? 0} XP</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
      <Link to="/app/projects/submit">
        <Button variant="outline">Submit capstone project</Button>
      </Link>
    </div>
  );
}
