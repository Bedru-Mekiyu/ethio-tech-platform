import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crown, Medal, Sparkles, Users } from "lucide-react";
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
        featured ? "border-indigo-500/50 md:-mt-4" : "border-[#27272A]",
        "bg-[#0E0E11]",
      )}
    >
      <div
        className={cn(
          "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
          featured
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-[var(--border)] bg-white/5 text-[var(--text-muted)]",
        )}
      >
        #{place}
      </div>
      <div className="relative">
        <Avatar
          src={tab === "teams" ? undefined : (entry as LeaderboardEntry).avatar}
          name={title}
          userId={
            (entry as LeaderboardEntry)._id ??
            (entry as MentorLeaderboardEntry)._id ??
            (entry as PeerGroupLeaderboardEntry)._id
          }
          role={tab === "mentors" ? "mentor" : "student"}
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
  const navigate = useNavigate();
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Global Rankings
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
          Compete, mentor, and collaborate with community peers. Rankings update with live platform activity.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "rounded-lg border px-4 py-2 text-left transition text-xs",
              tab === item.id
                ? "border-indigo-500 bg-indigo-600 text-white font-semibold"
                : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white",
            )}
          >
            <span className="block font-semibold">{item.label}</span>
            <span className="block text-[10px] opacity-75">{item.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card className="border-[#27272A] bg-[#0E0E11] p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-500">
            <Users size={13} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">{statLabel(tab)}</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{rows.length}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">Visible from live rankings</p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-500">
            <Sparkles size={13} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              {tab === "mentors" ? "Top score" : "Top XP"}
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-indigo-400">{podiumText(tab, topRank)}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">Current cohort leader</p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-500">
            <Medal size={13} />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Average</span>
          </div>
          <p className="mt-2 text-xl font-bold text-white">{podiumText(tab, averageRank)}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">Cohort average</p>
        </Card>
      </div>

      {podium.length ? (
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="order-2 md:order-1">
            {podium[1] ? <RankCard entry={podium[1]} place={2} tab={tab} maxValue={maxValue} /> : null}
          </div>
          <div className="order-1 md:order-2">
            {podium[0] ? <RankCard entry={podium[0]} place={1} tab={tab} featured maxValue={maxValue} /> : null}
          </div>
          <div className="order-3 md:order-3">
            {podium[2] ? <RankCard entry={podium[2]} place={3} tab={tab} maxValue={maxValue} /> : null}
          </div>
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No rankings yet"
            description="Once activity starts, the hall of fame will populate automatically."
            actionLabel="Join the platform"
            onAction={() => {
              navigate("/register");
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
            <Link
              to={tab === "students" ? "/register" : tab === "mentors" ? "/mentor-recruitment" : "/app/projects"}
              className="inline-flex items-center gap-2 text-sm text-primary"
            >
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
                  const title =
                    tab === "teams" ? (row as PeerGroupLeaderboardEntry).name : (row as LeaderboardEntry).fullName;
                  return (
                    <tr
                      key={(row as LeaderboardEntry)._id ?? title ?? rank}
                      className={cn(
                        "border-b border-[var(--border)] transition-colors",
                        isMe ? "bg-primary/10" : "hover:bg-white/5",
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
                          <Avatar
                            src={(row as LeaderboardEntry).avatar}
                            name={title}
                            userId={
                              (row as LeaderboardEntry)._id ??
                              (row as MentorLeaderboardEntry)._id ??
                              (row as PeerGroupLeaderboardEntry)._id
                            }
                            role={tab === "mentors" ? "mentor" : "student"}
                            size="sm"
                          />
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
