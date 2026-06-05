import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Trash2, Plus } from "lucide-react";
import { api, type ApiResponse } from "@/services/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/composites/QueryError";

interface Slot {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

function minutesToHm(totalMinutes: number): { hour: number; minute: number; period: "AM" | "PM" } {
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const hours24 = Math.floor(clamped / 60);
  const minute = clamped % 60;
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return { hour: hour12, minute, period };
}

function hmToMinutes(hour12: number, minute: number, period: "AM" | "PM"): number {
  const hours24 = period === "AM" && hour12 === 12 ? 0 : period === "PM" && hour12 !== 12 ? hour12 + 12 : hour12;
  return hours24 * 60 + minute;
}

function formatTime(totalMinutes: number): string {
  const { hour, minute, period } = minutesToHm(totalMinutes);
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

interface TimePickerProps {
  value: number;
  onChange: (minutes: number) => void;
  label: string;
}

function TimePicker({ value, onChange, label }: TimePickerProps) {
  const { hour, minute, period } = minutesToHm(value);

  const setHour = (h: number) => onChange(hmToMinutes(h, minute, period));
  const setMinute = (m: number) => onChange(hmToMinutes(hour, m, period));
  const setPeriod = (p: "AM" | "PM") => onChange(hmToMinutes(hour, minute, p));

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <div className="flex gap-1.5">
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="h-9 rounded-xl border border-white/10 bg-[#0B0F19] px-2 text-xs text-white outline-none"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-[var(--text-muted)]">:</span>
        <select
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="h-9 rounded-xl border border-white/10 bg-[#0B0F19] px-2 text-xs text-white outline-none"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
          className="h-9 rounded-xl border border-white/10 bg-[#0B0F19] px-2 text-xs text-white outline-none"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

const fetchAvailability = async () => {
  const { data } = await api.get<ApiResponse<{ slots: Slot[] }>>("/mentor-availability/me");
  return data.data.slots ?? [];
};

export function MentorAvailabilityPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Slot>({ dayOfWeek: 1, startMinutes: 540, endMinutes: 1020 });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor", "availability"],
    queryFn: fetchAvailability,
  });

  const saveMutation = useMutation({
    mutationFn: async (slots: Slot[]) => {
      const { data: res } = await api.put<ApiResponse<unknown>>("/mentor-availability/me", { slots });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "availability"] });
      setShowForm(false);
      setDraft({ dayOfWeek: 1, startMinutes: 540, endMinutes: 1020 });
    },
  });

  const handleRemove = (index: number) => {
    const current = data ?? [];
    const updated = current.filter((_, i) => i !== index);
    if (updated.length === 0) {
      saveMutation.mutate([{ dayOfWeek: 0, startMinutes: 0, endMinutes: 60 }]);
    } else {
      saveMutation.mutate(updated);
    }
  };

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
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarClock size={18} /> Weekly slots
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="h-8 gap-1.5 text-xs">
              <Plus size={14} /> Add slot
            </Button>
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading...</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {slots.map((slot, index) => (
              <li
                key={`${slot.dayOfWeek}-${index}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm text-white">
                  <span className="inline-block w-24 font-medium">{DAYS[slot.dayOfWeek]}</span>
                  <span className="text-[var(--text-muted)]">
                    {formatTime(slot.startMinutes)} — {formatTime(slot.endMinutes)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-red-400"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
            {!slots.length ? (
              <li className="py-4 text-center text-sm text-[var(--text-secondary)]">
                No slots configured. Click "Add slot" to get started.
              </li>
            ) : null}
          </ul>
        )}
      </Card>

      {showForm && (
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium text-white">New availability slot</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Day</label>
              <select
                value={draft.dayOfWeek}
                onChange={(e) => setDraft((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}
                className="h-9 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 text-xs text-white outline-none"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TimePicker
                value={draft.startMinutes}
                onChange={(m) => setDraft((s) => ({ ...s, startMinutes: m }))}
                label="Start time"
              />
              <TimePicker
                value={draft.endMinutes}
                onChange={(m) => setDraft((s) => ({ ...s, endMinutes: m }))}
                label="End time"
              />
            </div>
            {draft.endMinutes <= draft.startMinutes && (
              <p className="text-xs text-amber-400">End time must be after start time.</p>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              disabled={saveMutation.isPending || draft.endMinutes <= draft.startMinutes}
              onClick={() => saveMutation.mutate([...slots, draft])}
            >
              {saveMutation.isPending ? "Saving..." : "Save slot"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setDraft({ dayOfWeek: 1, startMinutes: 540, endMinutes: 1020 });
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
