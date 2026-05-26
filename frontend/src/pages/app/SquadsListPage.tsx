import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users } from "lucide-react";
import { fetchMyPeerGroups } from "@/services/peerGroupsService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Collaboration squads</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Join squad rooms for chat, news, and group XP.
        </p>
      </div>
      {groups.length === 0 ? (
        <EmptyState
          title="No squads yet"
          description="Enroll in a track and join a peer group to unlock squad collaboration."
          actionLabel="Browse tracks"
          actionHref="/app/tracks"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group._id} className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} /> {group.name}
                </CardTitle>
              </CardHeader>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Group XP: {group.groupXP ?? 0}</p>
              <Link
                to={`/app/squads/${group._id}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <MessageSquare size={16} /> Open squad room
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
