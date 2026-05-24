import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBadges } from "@/services/tracksService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XpPill } from "@/components/composites/StatCard";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { cn } from "@/lib/utils";

export function AchievementsPage() {
  const user = useAuthStore((s) => s.user);
  const [tab] = useState<"all" | "earned" | "locked">("all");
  const { data: badges, isLoading, isError, refetch } = useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
  });

  const earnedNames = new Set((user as { badges?: Array<{ name: string }> })?.badges?.map((b) => b.name) ?? []);
  const list = (badges ?? []) as Array<{ _id: string; name: string; description?: string; xpRequired?: number }>;

  const mapped = list.map((b) => ({
    ...b,
    earned: earnedNames.has(b.name),
  }));

  const filtered = mapped.filter((b) => {
    if (tab === "earned") return b.earned;
    if (tab === "locked") return !b.earned;
    return true;
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Achievements & Progression</h1>
          <p className="text-[var(--text-secondary)]">Track milestones and collect badges.</p>
        </div>
        <div className="flex items-center gap-3">
          <XpPill xp={user?.xp ?? 0} />
          <Link to="/app/xp" className="text-sm text-primary">
            XP history
          </Link>
        </div>
      </div>

      <Card>
        <ProgressBar value={user?.xp ?? 0} max={5000} className="mt-2" />
        <p className="mt-2 text-xs text-[var(--text-muted)]">Level {user?.level ?? 1}</p>
      </Card>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Card key={b._id ?? b.name} className={cn("flex gap-4 p-4", !b.earned && "opacity-50")}>
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
                  b.earned ? "bg-primary/20 text-primary" : "bg-white/5"
                )}
              >
                ★
              </div>
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{b.description}</p>
                <Badge variant={b.earned ? "success" : "default"} className="mt-2">
                  {b.earned ? "Earned" : `${b.xpRequired ?? 0} XP to unlock`}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
