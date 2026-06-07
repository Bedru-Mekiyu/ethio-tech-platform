import { useState, useCallback, useEffect } from "react";
import { api, type ApiResponse } from "@/services/api";

export interface BreakoutRoom {
  _id: string;
  sessionId: string;
  name: string;
  maxParticipants: number;
  timerSeconds: number;
  timerStartedAt?: string;
  timerEndsAt?: string;
  status: "created" | "active" | "closed";
  participantCount: number;
}

interface UseBreakoutRoomsOptions {
  sessionId: string;
  socket: {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

export const useBreakoutRooms = ({ sessionId, socket }: UseBreakoutRoomsOptions) => {
  const [breakouts, setBreakouts] = useState<BreakoutRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBreakouts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ApiResponse<{ breakouts: BreakoutRoom[] }>>(`/sessions/${sessionId}/breakouts`);
      setBreakouts(data.data.breakouts || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBreakouts();
  }, [fetchBreakouts]);

  useEffect(() => {
    const handleCreated = (payload: unknown) => {
      const breakout = payload as BreakoutRoom;
      setBreakouts((prev) => [...prev, breakout]);
    };

    const handleUpdated = (payload: unknown) => {
      const breakout = payload as BreakoutRoom;
      setBreakouts((prev) => prev.map((b) => (b._id === breakout._id ? { ...b, ...breakout } : b)));
    };

    const handleClosed = (payload: unknown) => {
      const { breakoutId } = payload as { breakoutId: string };
      setBreakouts((prev) => prev.filter((b) => b._id !== breakoutId));
    };

    const unsubCreated = socket.on("breakout:created", handleCreated);
    const unsubUpdated = socket.on("breakout:updated", handleUpdated);
    const unsubClosed = socket.on("breakout:closed", handleClosed);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubClosed();
    };
  }, [socket]);

  const createBreakout = useCallback(
    async (name: string, maxParticipants?: number, timerSeconds?: number) => {
      const { data } = await api.post<ApiResponse<{ breakout: BreakoutRoom }>>(`/sessions/${sessionId}/breakouts`, {
        name,
        maxParticipants,
        timerSeconds,
      });
      const breakout = data.data.breakout;
      setBreakouts((prev) => [...prev, breakout]);
      return breakout;
    },
    [sessionId],
  );

  const assignParticipant = useCallback(
    async (breakoutId: string, userId: string) => {
      await api.post(`/sessions/${sessionId}/breakouts/${breakoutId}/assign`, { userId });
    },
    [sessionId],
  );

  const closeBreakout = useCallback(
    async (breakoutId: string) => {
      await api.post(`/sessions/${sessionId}/breakouts/${breakoutId}/close`);
      setBreakouts((prev) => prev.filter((b) => b._id !== breakoutId));
    },
    [sessionId],
  );

  const closeAllBreakouts = useCallback(async () => {
    await api.post(`/sessions/${sessionId}/breakouts/close-all`);
    setBreakouts([]);
  }, [sessionId]);

  const startTimer = useCallback(
    async (breakoutId: string) => {
      const { data } = await api.post<ApiResponse<{ breakout: BreakoutRoom }>>(
        `/sessions/${sessionId}/breakouts/${breakoutId}/timer`,
      );
      const breakout = data.data.breakout;
      setBreakouts((prev) => prev.map((b) => (b._id === breakout._id ? { ...b, ...breakout } : b)));
    },
    [sessionId],
  );

  return {
    breakouts,
    loading,
    createBreakout,
    assignParticipant,
    closeBreakout,
    closeAllBreakouts,
    startTimer,
    refresh: fetchBreakouts,
  };
};
