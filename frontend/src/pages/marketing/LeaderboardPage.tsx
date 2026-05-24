import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

const fallbackPodium = [
  { name: "Elias M.", level: 12, xp: 15000, place: 1 },
  { name: "Betelihem A.", level: 10, xp: 11200, place: 2 },
  { name: "Yonas D.", level: 9, xp: 9500, place: 3 },
];

export function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const rows = (Array.isArray(data) ? data : []) as Array<{
    rank?: number;
    fullName?: string;
    xp?: number;
    level?: number;
  }>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <Badge className="mb-4">
          <Trophy size={14} className="mr-1 inline" /> Season 1
        </Badge>
        <h1 className="text-4xl font-bold">
          Global <span className="text-primary">Hall of Fame</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
          Compete with top engineering students across Ethiopia. Earn XP and unlock mentorship.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-3 items-end gap-4">
        {fallbackPodium.map((p) => (
          <Card
            key={p.name}
            className={`text-center ${p.place === 1 ? "border-primary glow-border md:-mt-8" : ""}`}
          >
            <Avatar name={p.name} size="lg" className="mx-auto" />
            <h3 className="mt-3 font-semibold">{p.name}</h3>
            <p className="text-sm text-primary">Level {p.level}</p>
            <ProgressBar value={p.xp} max={20000} className="mt-2" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">{p.xp.toLocaleString()} XP</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 overflow-hidden p-0">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Student</th>
                <th className="p-4">Level & XP</th>
              </tr>
            </thead>
            <tbody>
              {(rows.length ? rows.slice(0, 10) : []).map((row, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="p-4 font-bold">#{row.rank ?? i + 4}</td>
                  <td className="p-4">{row.fullName ?? "Student"}</td>
                  <td className="p-4">
                    <ProgressBar value={row.xp ?? 0} max={15000} />
                    <span className="text-xs text-[var(--text-muted)]">{row.xp ?? 0} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 text-center">
          <Button variant="outline">Load more</Button>
        </div>
      </Card>
    </div>
  );
}
