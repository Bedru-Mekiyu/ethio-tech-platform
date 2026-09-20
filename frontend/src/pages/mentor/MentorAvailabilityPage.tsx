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
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex gap-1.5">
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-zinc-900"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-slate-400">:</span>
        <select
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-zinc-900"
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
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-zinc-900"
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
    <div className="space-y-6 text-slate-900">
      <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
            Mentor Availability & Office Hours
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Set weekly recurring windows when students can book 1-on-1 consultations and project reviews.
          </p>
        </div>
      </Card>

      <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100 pb-3.5">
          <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-900">
            <span className="flex items-center gap-2">
              <CalendarClock size={15} className="text-[#b91c1c]" /> Weekly Availability Slots
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-7 gap-1 text-xs font-medium text-slate-700"
            >
              <Plus size={13} /> Add Slot
            </Button>
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <p className="mt-4 text-xs text-slate-400">Loading availability...</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {slots.map((slot, index) => (
              <li
                key={`${slot.dayOfWeek}-${index}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3 text-xs text-slate-900">
                  <span className="inline-block w-24 font-semibold text-slate-900">{DAYS[slot.dayOfWeek]}</span>
                  <span className="text-slate-600 font-mono">
                    {formatTime(slot.startMinutes)} — {formatTime(slot.endMinutes)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-transparent"
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
            {!slots.length ? (
              <li className="py-4 text-center text-xs text-slate-400">
                No slots configured. Click &quot;Add Slot&quot; to configure your office hours.
              </li>
            ) : null}
          </ul>
        )}
      </Card>

      {showForm && (
        <Card className="border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Availability Slot</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Day of Week</label>
              <select
                value={draft.dayOfWeek}
                onChange={(e) => setDraft((s) => ({ ...s, dayOfWeek: Number(e.target.value) }))}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-zinc-900"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TimePicker
                value={draft.startMinutes}
                onChange={(m) => setDraft((s) => ({ ...s, startMinutes: m }))}
                label="Start Time"
              />
              <TimePicker
                value={draft.endMinutes}
                onChange={(m) => setDraft((s) => ({ ...s, endMinutes: m }))}
                label="End Time"
              />
            </div>
            {draft.endMinutes <= draft.startMinutes && (
              <p className="text-xs text-amber-600 font-medium">End time must be after start time.</p>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="primary"
              disabled={saveMutation.isPending || draft.endMinutes <= draft.startMinutes}
              onClick={() => saveMutation.mutate([...slots, draft])}
              className="text-xs font-medium"
            >
              {saveMutation.isPending ? "Saving..." : "Save Slot"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-slate-700"
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
