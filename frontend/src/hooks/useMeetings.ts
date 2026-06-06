import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyMeetings, fetchAdminMeetings } from "@/services/meetingsService";
import { acquireSocketConnection, releaseSocketConnection } from "@/services/socket";
import type { MeetingStatus, MeetingViewModel } from "@/lib/realtime";
import { enrichMeeting } from "@/features/meetings/meetingStatus";

export interface UseMeetingsOptions {
  scope?: "upcoming" | "past" | "all";
  status?: MeetingStatus | "all";
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { scope = "upcoming", status = "all", enabled = true, refetchIntervalMs = 30_000 } = options;
  const queryClient = useQueryClient();
  const [now, setNow] = useState(0);

  const query = useQuery({
    queryKey: ["meeting", "list", scope, status],
    queryFn: () => fetchMyMeetings({ scope, status }),
    enabled,
    refetchInterval: refetchIntervalMs,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = acquireSocketConnection();
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "mentor"] });
    };
    socket.on("meeting:status-changed", handler);
    socket.on("meeting:presence", handler);
    return () => {
      socket.off("meeting:status-changed", handler);
      socket.off("meeting:presence", handler);
      releaseSocketConnection();
    };
  }, [enabled, queryClient]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const meetings = useMemo<MeetingViewModel[]>(() => {
    const list = query.data?.meetings ?? [];
    if (!now) return list;
    return list.map((meeting) => enrichMeeting(meeting, now));
  }, [query.data, now]);

  return {
    meetings,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export function useAdminMeetings(options: { status?: MeetingStatus | "all"; q?: string; enabled?: boolean } = {}) {
  const { status = "all", q, enabled = true } = options;
  const queryClient = useQueryClient();
  const [now, setNow] = useState(0);

  const query = useQuery({
    queryKey: ["meetings", "admin", status, q ?? ""],
    queryFn: () => fetchAdminMeetings({ status, q }),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = acquireSocketConnection();
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", "admin"] });
    };
    socket.on("meeting:status-changed", handler);
    socket.on("meeting:presence", handler);
    return () => {
      socket.off("meeting:status-changed", handler);
      socket.off("meeting:presence", handler);
      releaseSocketConnection();
    };
  }, [enabled, queryClient]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const meetings = useMemo(() => {
    const list = query.data?.meetings ?? [];
    if (!now) return list;
    return list.map((meeting) => enrichMeeting(meeting, now));
  }, [query.data, now]);

  return {
    meetings,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
