import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crown, Medal, Sparkles, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useAuthStore } from "@/store/authStore";
import {
  fetchLeaderboard,
  fetchMentorLeaderboard,
  fetchPeerGroupLeaderboard,
  type LeaderboardEntry,
  type MentorLeaderboardEntry,
  type PeerGroupLeaderboardEntry,
} from "@/services/tracksService";
import { cn, formatXp, getRankTitle } from "@/lib/utils";

type LeaderboardTab = "students" | "mentors" | "teams";

const tabs: Array<{ id: LeaderboardTab; label: string; description: string }> = [
  { id: "students", label: "Students", description: "XP-driven rankings" },
  { id: "mentors", label: "Mentors", description: "Teaching impact rankings" },
  { id: "teams", label: "Teams", description: "Squad momentum rankings" },
];

function numberFormatter(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <Skeleton className="mx-auto h-6 w-28 rounded-full" />
      <Skeleton className="mx-auto mt-4 h-14 w-full max-w-3xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-64 rounded-[28px]" />
      </div>
      <Skeleton className="mt-12 h-96 rounded-[28px]" />
    </div>
  );
}

function statLabel(tab: LeaderboardTab) {
  return tab === "students" ? "Ranked learners" : tab === "mentors" ? "Ranked mentors" : "Active teams";
}

function podiumText(tab: LeaderboardTab, value?: number) {
  if (tab === "students") return `${value ?? 0} XP`;
  if (tab === "mentors") return `${Math.round(value ?? 0)} score`;
  return `${Math.round(value ?? 0)} XP`;
}

function topValue(tab: LeaderboardTab, entry?: LeaderboardEntry | MentorLeaderboardEntry | PeerGroupLeaderboardEntry) {
  if (!entry) return 0;
  if (tab === "students") return (entry as LeaderboardEntry).xp ?? 0;
  if (tab === "mentors") return (entry as MentorLeaderboardEntry).mentorScore ?? 0;
  return (entry as PeerGroupLeaderboardEntry).groupXP ?? 0;
}

function RankCard({
  entry,
  place,
  tab,
  featured = false,
  maxValue,
}: {
  entry: LeaderboardEntry | MentorLeaderboardEntry | PeerGroupLeaderboardEntry;
  place: number;
  tab: LeaderboardTab;
  featured?: boolean;
  maxValue: number;
}) {
  const title = tab === "teams" ? (entry as PeerGroupLeaderboardEntry).name : (entry as LeaderboardEntry).fullName;
  const metric = topValue(tab, entry);
  const subtitle =
    tab === "students"
      ? `${getRankTitle((entry as LeaderboardEntry).level ?? 1)} • Level ${(entry as LeaderboardEntry).level ?? 1}`
      : tab === "mentors"
        ? `Total sessions ${(entry as MentorLeaderboardEntry).totalSessions ?? 0}`
        : `Members ${(entry as PeerGroupLeaderboardEntry).members?.length ?? 0}`;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col items-center text-center transition-transform duration-200",
        featured ? "border-primary/70 md:-mt-10 glow-border" : "border-[var(--border)]",
        "bg-[var(--bg-card)]"
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
        <Avatar
          src={tab === "teams" ? undefined : (entry as LeaderboardEntry).avatar}
          name={title}
          size={featured ? "lg" : "md"}
          className={featured ? "ring-4 ring-primary/25" : ""}
        />
        {featured ? (
          <span className="absolute -right-2 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary">
            <Crown size={14} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-primary">{subtitle}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Badge variant={featured ? "purple" : "default"}>{podiumText(tab, metric)}</Badge>
        <Badge variant={featured ? "success" : "purple"}>{featured ? "Top ranked" : "Rising"}</Badge>
      </div>
      <ProgressBar value={metric} max={maxValue} className="mt-4 w-full" />
      <p className="mt-2 text-xs text-[var(--text-muted)]">{formatXp(metric)} total</p>
    </Card>
  );
}

export function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderboardTab>("students");
  const [limit, setLimit] = useState(10);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const studentQuery = useQuery({
    queryKey: ["leaderboard", "students", limit],
    queryFn: () => fetchLeaderboard(limit),
    enabled: tab === "students",
  });

  const mentorQuery = useQuery({
    queryKey: ["leaderboard", "mentors", limit],
    queryFn: () => fetchMentorLeaderboard(limit),
    enabled: tab === "mentors",
  });

  const teamQuery = useQuery({
    queryKey: ["leaderboard", "teams", limit],
    queryFn: () => fetchPeerGroupLeaderboard(limit),
    enabled: tab === "teams",
  });

  const activeQuery = tab === "students" ? studentQuery : tab === "mentors" ? mentorQuery : teamQuery;
  const rows = (activeQuery.data ?? []) as Array<LeaderboardEntry | MentorLeaderboardEntry | PeerGroupLeaderboardEntry>;
  const podium = rows.slice(0, 3);
  const tableRows = rows.slice(3);
  const maxValue = Math.max(...rows.map((row) => topValue(tab, row)), 1);
  const topRank = topValue(tab, rows[0]);
  const averageRank = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + topValue(tab, row), 0) / rows.length)
    : 0;

  if (activeQuery.isLoading) return <LeaderboardSkeleton />;
  if (activeQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={activeQuery.error instanceof Error ? activeQuery.error.message : "Unable to load rankings."}
          onRetry={() => {
            void activeQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <Badge className="mb-4">
          <Trophy size={14} className="mr-1 inline" /> Global rankings
        </Badge>
        <h1 className="text-4xl font-bold md:text-5xl">
          Global <span className="glow-text">Rankings</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          Compete, mentor, and collaborate with community peers. Rankings update with live platform activity.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "rounded-full border px-5 py-3 text-left transition",
              tab === item.id
                ? "border-primary bg-primary text-[var(--bg-base)]"
                : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
            )}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="block text-xs opacity-80">{item.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Users size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">{statLabel(tab)}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{rows.length}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Visible from the live rankings feed</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">{tab === "mentors" ? "Top score" : "Top XP"}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{podiumText(tab, topRank)}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Current leader of the board</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Medal size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Average</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{podiumText(tab, averageRank)}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Healthy competition across the cohort</p>
        </Card>
      </div>

      {podium.length ? (
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="order-2 md:order-1">{podium[1] ? <RankCard entry={podium[1]} place={2} tab={tab} maxValue={maxValue} /> : null}</div>
          <div className="order-1 md:order-2">{podium[0] ? <RankCard entry={podium[0]} place={1} tab={tab} featured maxValue={maxValue} /> : null}</div>
          <div className="order-3 md:order-3">{podium[2] ? <RankCard entry={podium[2]} place={3} tab={tab} maxValue={maxValue} /> : null}</div>
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No rankings yet"
            description="Once activity starts, the hall of fame will populate automatically."
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
              <h2 className="text-2xl font-semibold text-white">Moving up the board</h2>
            </div>
            <Link to={tab === "students" ? "/register?role=student" : tab === "mentors" ? "/mentor-recruitment" : "/app/projects"} className="inline-flex items-center gap-2 text-sm text-primary">
              Join the challenge <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <tr className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">{tab === "teams" ? "Team" : "Member"}</th>
                <th className="px-5 py-4">{tab === "mentors" ? "Score" : "Level & XP"}</th>
                <th className="px-5 py-4">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length ? (
                tableRows.map((row, index) => {
                  const rank = index + 4;
                  const isMe = tab === "students" && !!currentUserId && (row as LeaderboardEntry)._id === currentUserId;
                  const title = tab === "teams" ? (row as PeerGroupLeaderboardEntry).name : (row as LeaderboardEntry).fullName;
                  return (
                    <tr
                      key={(row as LeaderboardEntry)._id ?? title ?? rank}
                      className={cn("border-b border-[var(--border)] transition-colors", isMe ? "bg-primary/10" : "hover:bg-white/5")}
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
                          <Avatar src={(row as LeaderboardEntry).avatar} name={title} size="sm" />
                          <div>
                            <p className="font-medium text-white">{title}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {tab === "students"
                                ? getRankTitle((row as LeaderboardEntry).level ?? 1)
                                : tab === "mentors"
                                  ? "Mentor"
                                  : `${(row as PeerGroupLeaderboardEntry).leader?.fullName ?? "Group leader"} lead`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">
                          {tab === "students"
                            ? `Lvl ${(row as LeaderboardEntry).level ?? 1}`
                            : tab === "mentors"
                              ? `${Math.round((row as MentorLeaderboardEntry).mentorScore ?? 0)} score`
                              : `${numberFormatter((row as PeerGroupLeaderboardEntry).groupXP ?? 0)} XP`}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {tab === "students"
                            ? `${numberFormatter((row as LeaderboardEntry).xp ?? 0)} XP`
                            : tab === "mentors"
                              ? `${(row as MentorLeaderboardEntry).totalSessions ?? 0} sessions`
                              : `${(row as PeerGroupLeaderboardEntry).members?.length ?? 0} members`}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <ProgressBar value={topValue(tab, row)} max={maxValue} color={isMe ? "success" : "primary"} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12">
                    <EmptyState title="No more rankings to show" description="Load more entries to extend the board." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] p-4 text-center">
          <Button variant="outline" onClick={() => setLimit((value) => value + 5)} disabled={activeQuery.isFetching}>
            {activeQuery.isFetching ? "Loading more…" : "Load more"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
