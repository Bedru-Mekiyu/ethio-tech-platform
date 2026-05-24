import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Crown,
  Medal,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useAuthStore } from "@/store/authStore";
import { fetchLeaderboard, type LeaderboardEntry } from "@/services/tracksService";
import { cn, formatXp, getRankTitle } from "@/lib/utils";

const initialTop = 10;
const loadStep = 5;

function numberFormatter(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <Skeleton className="mx-auto h-6 w-28 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-14 w-full max-w-3xl" />
        <Skeleton className="mx-auto mt-4 h-5 w-full max-w-2xl" />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-72 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
      <Skeleton className="mt-12 h-96 rounded-[24px]" />
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  featured = false,
  maxXp,
}: {
  entry: LeaderboardEntry;
  place: number;
  featured?: boolean;
  maxXp: number;
}) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col items-center text-center transition-transform duration-200",
        featured ? "border-primary/70 md:-mt-10" : "border-[var(--border)]",
        "bg-[var(--bg-card)]",
        featured && "glow-border"
      )}
    >
      <div
        className={cn(
          "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
          featured ? "border-primary/40 bg-primary/10 text-primary" : "border-[var(--border)] bg-white/5 text-[var(--text-muted)]"
        )}
      >
        #{place}
      </div>
      <div className="relative">
        <Avatar src={entry.avatar} name={entry.fullName} size={featured ? "lg" : "md"} className={featured ? "ring-4 ring-primary/25" : ""} />
        {featured ? (
          <span className="absolute -right-2 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary">
            <Crown size={14} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{entry.fullName}</h3>
      <p className="text-sm text-primary">{getRankTitle(entry.level ?? 1)} • Level {entry.level ?? 1}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Badge variant={featured ? "purple" : "default"}>{numberFormatter(entry.xp ?? 0)} XP</Badge>
        <Badge variant={featured ? "success" : "purple"}>{featured ? "Top ranked" : "Rising"}</Badge>
      </div>
      <ProgressBar value={entry.xp ?? 0} max={maxXp} className="mt-4 w-full" />
      <p className="mt-2 text-xs text-[var(--text-muted)]">{formatXp(entry.xp ?? 0)} XP total</p>
    </Card>
  );
}

export function LeaderboardPage() {
  const [limit, setLimit] = useState(initialTop);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", "students", limit],
    queryFn: () => fetchLeaderboard(limit),
  });

  const rows = data ?? [];
  const podium = rows.slice(0, 3);
  const tableRows = rows.slice(3);
  const maxXp = Math.max(...rows.map((row) => row.xp ?? 0), 1);
  const topXp = rows[0]?.xp ?? 0;
  const averageXp = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.xp ?? 0), 0) / rows.length) : 0;

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError message={error instanceof Error ? error.message : "Unable to load the leaderboard."} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <Badge className="mb-4">
          <Trophy size={14} className="mr-1 inline" /> Season 1
        </Badge>
        <h1 className="text-4xl font-bold md:text-5xl">
          Global <span className="glow-text">Hall of Fame</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          Compete with top engineering students across Ethiopia. Earn XP, climb ranks, and unlock mentorship.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Users size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Ranked learners</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{numberFormatter(rows.length)}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Visible from the live leaderboard feed</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Top XP</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{numberFormatter(topXp)} XP</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Current leader of the season</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Medal size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Average XP</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{numberFormatter(averageXp)} XP</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Healthy competition across the cohort</p>
        </Card>
      </div>

      {podium.length ? (
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="order-2 md:order-1">
            {podium[1] ? <PodiumCard entry={podium[1]} place={2} maxXp={maxXp} /> : null}
          </div>
          <div className="order-1 md:order-2">
            {podium[0] ? <PodiumCard entry={podium[0]} place={1} featured maxXp={maxXp} /> : null}
          </div>
          <div className="order-3 md:order-3">
            {podium[2] ? <PodiumCard entry={podium[2]} place={3} maxXp={maxXp} /> : null}
          </div>
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No rankings yet"
            description="Once students start earning XP, the hall of fame will populate here automatically."
            actionLabel="Join the platform"
            onAction={() => {
              window.location.assign("/register");
            }}
          />
        </div>
      )}

      <Card className="mt-12 overflow-hidden border-[var(--border)] bg-[var(--bg-card)] p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Rankings</p>
              <h2 className="text-2xl font-semibold text-white">Students moving up the board</h2>
            </div>
            <Link to="/register?role=student" className="inline-flex items-center gap-2 text-sm text-primary">
              Join the challenge <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <tr className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Level & XP</th>
                <th className="px-5 py-4">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length ? (
                tableRows.map((row, index) => {
                  const isMe = !!currentUserId && row._id === currentUserId;
                  const rank = index + 4;
                  return (
                    <tr
                      key={row._id ?? row.fullName ?? rank}
                      className={cn(
                        "border-b border-[var(--border)] transition-colors",
                        isMe ? "bg-primary/10" : "hover:bg-white/5"
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white/5 text-xs">
                            #{rank}
                          </span>
                          {isMe ? <Badge variant="success">You</Badge> : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={row.avatar} name={row.fullName} size="sm" />
                          <div>
                            <p className="font-medium text-white">{row.fullName}</p>
                            <p className="text-xs text-[var(--text-muted)]">{getRankTitle(row.level ?? 1)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">Lvl {row.level ?? 1}</p>
                        <p className="text-xs text-[var(--text-muted)]">{numberFormatter(row.xp ?? 0)} XP</p>
                      </td>
                      <td className="px-5 py-4">
                        <ProgressBar value={row.xp ?? 0} max={maxXp} color={isMe ? "success" : "primary"} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12">
                    <EmptyState
                      title="No more rankings to show"
                      description="Load more students or wait for the next XP update."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] p-4 text-center">
          <Button variant="outline" onClick={() => setLimit((value) => value + loadStep)} disabled={isFetching}>
            {isFetching ? "Loading more…" : "Load more"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
