import { useQuery } from "@tanstack/react-query";
import { fetchSessions } from "@/services/sessionsService";
import { fetchMyPeerGroups } from "@/services/peerGroupsService";
import { useAuthStore } from "@/store/authStore";

export function useQuickNavLinks(options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const enabled = options?.enabled ?? true;

  const sessionsQuery = useQuery({
    queryKey: ["sessions", "quick-nav"],
    queryFn: fetchSessions,
    enabled: enabled && !!accessToken,
    staleTime: 60_000,
  });

  const groupsQuery = useQuery({
    queryKey: ["peer-groups", "quick-nav"],
    queryFn: fetchMyPeerGroups,
    enabled: enabled && !!accessToken,
    staleTime: 60_000,
  });

  const liveSession = sessionsQuery.data?.find(
    (s) => s.status === "live" || (s.status === "scheduled" && new Date(s.scheduledAt) >= new Date())
  );
  const firstGroup = groupsQuery.data?.[0];

  return {
    classroomPath: liveSession ? `/app/classroom/${liveSession._id}` : "/app/tracks",
    squadPath: firstGroup ? `/app/squads/${firstGroup._id}` : "/app/tracks",
    hasLiveSession: !!liveSession,
    hasSquad: !!firstGroup,
    isLoading: enabled && (sessionsQuery.isLoading || groupsQuery.isLoading),
  };
}
