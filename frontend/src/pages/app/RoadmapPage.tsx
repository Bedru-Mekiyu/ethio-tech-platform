import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { fetchStudentDashboard } from "@/services/dashboardService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

export function RoadmapPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-64 w-full rounded-[24px]" />;

  const tracks = data?.progressByTrack ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Learning roadmap</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Progress across enrolled tracks, lessons, and projects.
        </p>
      </div>
      {tracks.length === 0 ? (
        <EmptyState
          title="No enrolled tracks"
          description="Start a track to see your personalized roadmap."
          actionLabel="Explore tracks"
          actionHref="/app/tracks"
        />
      ) : (
        tracks.map((track) => (
          <Card key={String(track.trackId)} className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2">
                <BookOpen size={18} /> {track.title}
              </CardTitle>
            </CardHeader>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Lessons {track.lessons.completed}/{track.lessons.total} · Projects {track.projects.approved}/
              {track.projects.total}
            </p>
            <ProgressBar value={track.overallProgressPercent} className="mt-4" />
            <p className="mt-2 text-sm text-white">{track.overallProgressPercent}% complete</p>
            {track.trackId ? (
              <Link
                to={`/app/tracks/${track.trackId}`}
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Continue track
              </Link>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
