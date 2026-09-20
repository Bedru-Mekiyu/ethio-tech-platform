import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users } from "lucide-react";
import { fetchMyPeerGroups } from "@/services/peerGroupsService";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

export function SquadsListPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["peer-groups", "mine"],
    queryFn: fetchMyPeerGroups,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full rounded-[24px]" />;

  const groups = data ?? [];

  return (
    <div className="space-y-6 text-slate-900">
      <Card className="border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Collaboration Squads</h1>
        <p className="mt-0.5 text-xs text-slate-500">
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
        <div className="grid gap-3.5 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Users size={15} />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{group.name}</h3>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {group.groupXP ?? 0} XP
                </span>
              </div>
              <p className="mt-2.5 text-xs text-slate-600">
                Active group sprint channel and collaborative peer review board.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/app/squads/${group._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
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
