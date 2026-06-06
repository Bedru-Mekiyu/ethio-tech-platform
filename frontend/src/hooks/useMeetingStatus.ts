import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acquireSocketConnection, releaseSocketConnection } from "@/services/socket";
import { fetchMeetingStatus } from "@/services/meetingsService";
import type { MeetingStatus, MeetingStatusChangedPayload, MeetingViewModel } from "@/lib/realtime";
import { computeMeetingStatus, enrichMeeting } from "@/features/meetings/meetingStatus";

export interface UseMeetingStatusOptions {
  sessionId?: string | null;
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export interface UseMeetingStatusResult {
  status: MeetingStatus;
  hostJoined: boolean;
  presenceCount: number;
  joinable: boolean;
  startsInMs: number | null;
  endsAt: string | null;
  meeting: MeetingViewModel | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

const FALLBACK_POLL_MS = 15_000;

const computeFallback = (sessionId?: string | null, hostJoined = false): Partial<MeetingViewModel> => ({
  id: sessionId ?? "",
  sessionId: sessionId ?? "",
  title: "",
  mentorId: null,
  mentorName: "",
  mentorAvatar: null,
  studentId: null,
  studentName: "",
  scheduledAt: new Date().toISOString(),
  durationMinutes: 60,
  status: "scheduled",
  hostJoined,
  presenceCount: 0,
  startsInMs: null,
  endsAt: null,
  liveRoomId: null,
  classroomMode: "immersive-3d",
  liveProvider: "jitsi",
  joinable: false,
  isHost: false,
  isAdmin: false,
  isParticipant: false,
  joinHref: sessionId ? `/app/classroom/${sessionId}` : "",
});

export function useMeetingStatus(options: UseMeetingStatusOptions = {}): UseMeetingStatusResult {
  const { sessionId, enabled = true, refetchIntervalMs = FALLBACK_POLL_MS } = options;
  const queryClient = useQueryClient();
  const [live, setLive] = useState<{
    status?: MeetingStatus;
    hostJoined?: boolean;
    presenceCount?: number;
    startsInMs?: number | null;
    endsAt?: string | null;
    at?: string;
  }>({});
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const query = useQuery({
    queryKey: ["meeting", "status", sessionId],
    queryFn: () => fetchMeetingStatus(sessionId as string),
    enabled: Boolean(enabled && sessionId),
    refetchInterval: refetchIntervalMs,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!enabled || !sessionId) return undefined;
    const socket = acquireSocketConnection();
    const handleStatus = (payload: MeetingStatusChangedPayload) => {
      if (payload.sessionId !== sessionId) return;
      setLive({
        status: payload.status,
        hostJoined: payload.hostJoined,
        presenceCount: payload.presenceCount,
        startsInMs: payload.startsInMs ?? null,
        endsAt: payload.endsAt ?? null,
        at: payload.at,
      });
      queryClient.invalidateQueries({ queryKey: ["meeting", "status", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["meeting", "list"] });
      queryClient.invalidateQueries({ queryKey: ["meetings", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
    };
    socket.on("meeting:status-changed", handleStatus);
    return () => {
      socket.off("meeting:status-changed", handleStatus);
      releaseSocketConnection();
    };
  }, [enabled, sessionId, queryClient]);

  const baseMeeting: MeetingViewModel = useMemo(() => {
    const data = query.data;
    if (data?.meeting) return data.meeting as MeetingViewModel;
    return { ...(computeFallback(sessionId) as MeetingViewModel) };
  }, [query.data, sessionId]);

  const enriched = useMemo(() => {
    if (!now) {
      return {
        ...baseMeeting,
        status: (live.status ?? baseMeeting.status) as MeetingStatus,
        hostJoined: live.hostJoined ?? baseMeeting.hostJoined,
        presenceCount: live.presenceCount ?? baseMeeting.presenceCount,
        startsInMs: live.startsInMs != null ? live.startsInMs : baseMeeting.startsInMs,
        endsAt: live.endsAt ?? baseMeeting.endsAt,
      };
    }
    const enrichedBase = enrichMeeting(baseMeeting, now);
    const next: MeetingViewModel = {
      ...enrichedBase,
      status: (live.status ?? enrichedBase.status) as MeetingStatus,
      hostJoined: live.hostJoined ?? enrichedBase.hostJoined,
      presenceCount: live.presenceCount ?? enrichedBase.presenceCount,
      startsInMs: live.startsInMs != null ? live.startsInMs : enrichedBase.startsInMs,
      endsAt: live.endsAt ?? enrichedBase.endsAt,
    };
    return next;
  }, [baseMeeting, live, now]);

  const status: MeetingStatus = enriched.status;
  const hostJoined = enriched.hostJoined;
  const presenceCount = enriched.presenceCount;
  const joinable = enriched.joinable;
  const startsInMs = enriched.startsInMs;
  const endsAt = enriched.endsAt;

  return {
    status,
    hostJoined,
    presenceCount,
    joinable,
    startsInMs,
    endsAt,
    meeting: enriched,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export function useGlobalMeetingEvents(onChange?: (payload: MeetingStatusChangedPayload) => void) {
  const queryClient = useQueryClient();
  const handlerRef = useRef(onChange);
  useEffect(() => {
    handlerRef.current = onChange;
  });
  useEffect(() => {
    const socket = acquireSocketConnection();
    const handler = (payload: MeetingStatusChangedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["meeting", "status", payload.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["meeting", "list"] });
      queryClient.invalidateQueries({ queryKey: ["meetings", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
      handlerRef.current?.(payload);
    };
    socket.on("meeting:status-changed", handler);
    return () => {
      socket.off("meeting:status-changed", handler);
      releaseSocketConnection();
    };
  }, [queryClient]);
}

export function deriveStatusFromSession(
  session: {
    status: string;
    scheduledAt: string;
    liveStartedAt?: string | null;
    liveEndedAt?: string | null;
    durationMinutes?: number;
  },
  hostJoined = false,
  now: number = Date.now(),
): MeetingStatus {
  return computeMeetingStatus(
    {
      _id: "",
      ...session,
      hostJoined,
    },
    now,
  );
}
