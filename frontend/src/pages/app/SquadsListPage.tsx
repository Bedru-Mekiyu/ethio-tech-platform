import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users } from "lucide-react";
import { fetchMyPeerGroups } from "@/services/peerGroupsService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

export function SquadsListPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["peer-groups", "mine"],
    queryFn: fetchMyPeerGroups,
    enabled: !!user,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full rounded-[24px]" />;

  const groups = data ?? [];

  return (
    <div className="space-y-6 text-slate-900">
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Collaboration Squads</h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          Join cohort squad rooms for real-time discussions, code share, and collective XP rewards.
        </p>
      </Card>
      {groups.length === 0 ? (
        <EmptyState
          title="No squads yet"
          description="Enroll in a track to join a squad and collaborate with peers."
          actionLabel="Browse tracks"
          actionHref="/app/tracks"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Card
              key={group._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-4 sm:p-5 md:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100/80 shadow-2xs">
                    <Users size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{group.name}</h3>
                </div>
                <span className="rounded-md border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[11px] font-bold text-[var(--secondary)] font-mono">
                  {group.groupXP ?? 0} XP
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Active group sprint channel and collaborative peer review board.
              </p>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/app/squads/${group._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[var(--primary-hover)] transition"
                >
                  <MessageSquare size={13} /> Open Squad Room →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
