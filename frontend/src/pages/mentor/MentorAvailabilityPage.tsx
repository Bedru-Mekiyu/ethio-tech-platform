import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { api, type ApiResponse } from "@/services/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/composites/QueryError";

interface Slot {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fetchAvailability = async () => {
  const { data } = await api.get<ApiResponse<{ slots: Slot[] }>>("/mentor-availability/me");
  return data.data.slots ?? [];
};

export function MentorAvailabilityPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Slot>({ dayOfWeek: 1, startMinutes: 540, endMinutes: 1020 });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor", "availability"],
    queryFn: fetchAvailability,
  });

  const saveMutation = useMutation({
    mutationFn: async (slots: Slot[]) => {
      const { data: res } = await api.put<ApiResponse<unknown>>("/mentor-availability/me", { slots });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor", "availability"] }),
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;

  const slots = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Availability</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Set weekly windows when students can request sessions.
        </p>
      </div>

      <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock size={18} /> Weekly slots
          </CardTitle>
        </CardHeader>
        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-white">
            {slots.map((slot, index) => (
              <li key={`${slot.dayOfWeek}-${index}`}>
                {DAYS[slot.dayOfWeek]} · {Math.floor(slot.startMinutes / 60)}:
                {String(slot.startMinutes % 60).padStart(2, "0")} – {Math.floor(slot.endMinutes / 60)}:
                {String(slot.endMinutes % 60).padStart(2, "0")}
              </li>
            ))}
            {!slots.length ? <li className="text-[var(--text-secondary)]">No slots configured.</li> : null}
          </ul>
        )}
      </Card>

      <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="text-sm font-medium text-white">Add slot (minutes from midnight)</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            type="number"
            min={0}
            max={6}
            value={draft.dayOfWeek}
            onChange={(e) => setDraft((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}
            aria-label="Day of week 0-6"
          />
          <Input
            type="number"
            value={draft.startMinutes}
            onChange={(e) => setDraft((s) => ({ ...s, startMinutes: Number(e.target.value) }))}
            aria-label="Start minutes"
          />
          <Input
            type="number"
            value={draft.endMinutes}
            onChange={(e) => setDraft((s) => ({ ...s, endMinutes: Number(e.target.value) }))}
            aria-label="End minutes"
          />
        </div>
        <Button
          className="mt-4"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate([...slots, draft])}
        >
          Save availability
        </Button>
      </Card>
    </div>
  );
}
