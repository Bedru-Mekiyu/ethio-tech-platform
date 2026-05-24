import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchSessions } from "@/services/sessionsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Plus, Video } from "lucide-react";

type SessionRow = {
  _id?: string;
  title?: string;
  scheduledAt?: string;
  status?: string;
  maxParticipants?: number;
  participants?: unknown[];
};

const fallbackSessions: SessionRow[] = [
  {
    title: "Advanced Python Algorithms",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
    maxParticipants: 30,
    participants: [{}, {}, {}],
  },
  {
    title: "System Design Fundamentals",
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    status: "scheduled",
    maxParticipants: 25,
    participants: [{}, {}],
  },
  {
    title: "DevOps & CI/CD",
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    status: "completed",
    maxParticipants: 20,
    participants: [{}, {}, {}, {}],
  },
];

export function MentorSessionsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });

  const sessions = (Array.isArray(data) ? data : fallbackSessions) as SessionRow[];

  const filtered = sessions.filter((s) => {
    const date = s.scheduledAt ? new Date(s.scheduledAt) : new Date();
    const upcoming = date >= new Date();
    if (filter === "upcoming") return upcoming;
    if (filter === "past") return !upcoming;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Session management</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Schedule live classes, track attendance, and launch virtual classrooms.
          </p>
        </div>
        <Button>
          <Plus size={16} /> New session
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "upcoming", "past"] as const).map((f) => (
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
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading
          ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)
          : filtered.map((session, i) => {
              const participantCount = Array.isArray(session.participants)
                ? session.participants.length
                : 0;
              const max = session.maxParticipants ?? 30;
              return (
                <Card key={session._id ?? i} className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold">{session.title}</h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {session.scheduledAt
                          ? new Date(session.scheduledAt).toLocaleString()
                          : "TBD"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {participantCount} / {max} enrolled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={session.status === "completed" ? "success" : "purple"}>
                      {session.status ?? "scheduled"}
                    </Badge>
                    <Link to={`/app/classroom/${session._id}`}>
                      <Button size="sm" variant="outline">
                        <Video size={14} /> Launch
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
