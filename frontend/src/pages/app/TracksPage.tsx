import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchTracks } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TracksPage() {
  const [filter, setFilter] = useState<"all" | "progress" | "done">("all");
  const { data, isLoading } = useQuery({ queryKey: ["tracks"], queryFn: fetchTracks });

  const tracks = (Array.isArray(data) ? data : []) as Array<{
    _id?: string;
    title?: string;
    description?: string;
    category?: string;
    difficulty?: string;
    xpReward?: number;
  }>;

  const fallback = [
    {
      title: "Foundations of Code",
      description: "HTML, CSS, JavaScript, and Git fundamentals.",
      difficulty: "beginner",
      xpReward: 1000,
      progress: 100,
    },
    {
      title: "Full-Stack Engineering",
      description: "React, Node.js, MongoDB, and deployment.",
      difficulty: "intermediate",
      xpReward: 2000,
      progress: 40,
    },
  ];

  const list = tracks.length ? tracks : fallback;

  const filtered = list.filter((track, i) => {
    const progress = "progress" in track ? (track as { progress: number }).progress : i === 0 ? 100 : 40;
    if (filter === "done") return progress >= 100;
    if (filter === "progress") return progress > 0 && progress < 100;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Learning Tracks</h1>
      <p className="mt-1 text-[var(--text-secondary)]">
        Choose your path and master the software engineering skills of the future.
      </p>

      <div className="mt-6 flex gap-2">
        {(["all", "progress", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm capitalize",
              filter === f
                ? "bg-primary text-[var(--bg-base)]"
                : "border border-[var(--border)] text-[var(--text-secondary)]"
            )}
          >
            {f === "all" ? "All tracks" : f === "progress" ? "In progress" : "Completed"}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {isLoading
          ? [1, 2].map((i) => <Skeleton key={i} className="h-40" />)
          : filtered.map((track, i) => {
              const progress =
                "progress" in track ? (track as { progress: number }).progress : i === 0 ? 100 : 40;
              const done = progress >= 100;
              return (
                <Card key={track.title ?? i} className="grid gap-6 lg:grid-cols-[120px_1fr_200px]">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-success/20 to-primary/20" />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={done ? "success" : "default"}>
                        {(track.difficulty ?? "beginner").toUpperCase()}
                      </Badge>
                      <span className="text-sm text-primary">+{track.xpReward ?? 1000} XP</span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold">{track.title}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{track.description}</p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-medium text-primary">
                      {done ? "Completed" : "In progress"} {progress}%
                    </p>
                    <ProgressBar value={progress} className="mt-2" color={done ? "success" : "primary"} />
                    <Link
                      to={
                        "_id" in track && track._id ? `/app/tracks/${track._id}` : "/app/tracks"
                      }
                      className="mt-4"
                    >
                      <Button variant={done ? "secondary" : "primary"} className="w-full">
                        {done ? "Review" : "Resume track"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
