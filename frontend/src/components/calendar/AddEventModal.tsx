import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Video,
  AlertCircle,
  Award,
  MapPin,
  Tag,
  Check,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createCalendarEvent,
  EVENT_TYPE_COLORS,
  type CalendarEvent,
  type CalendarEventType,
} from "@/services/calendarService";
import { TRACKS_CATALOG } from "@/data/tracksCatalog";

export interface AddEventModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onEventCreated?: (event: CalendarEvent) => void;
  initialDate?: string;
  initialType?: CalendarEventType;
  initialTrack?: string;
  initialCapstone?: string;
}

const TYPE_OPTIONS: Array<{
  type: CalendarEventType;
  label: string;
  desc: string;
  icon: typeof BookOpen;
  defaultColor: string;
}> = [
  {
    type: "study_block",
    label: "Study Block",
    desc: "Dedicated deep-work study sprint",
    icon: BookOpen,
    defaultColor: "#18181b",
  },
  {
    type: "session",
    label: "Live Session",
    desc: "WebRTC lecture, squad sync, or mentor meeting",
    icon: Video,
    defaultColor: "#b91c1c",
  },
  {
    type: "deadline",
    label: "Assignment Deadline",
    desc: "Deliverable or quiz submission cutoff",
    icon: AlertCircle,
    defaultColor: "#b91c1c",
  },
  {
    type: "milestone",
    label: "Capstone Milestone",
    desc: "Key architectural checkpoint or MVP launch",
    icon: Award,
    defaultColor: "#27272a",
  },
  {
    type: "hub_visit",
    label: "Regional Hub Visit",
    desc: "In-person co-working at Addis, Hawassa, etc.",
    icon: MapPin,
    defaultColor: "#d97706",
  },
  {
    type: "custom",
    label: "Custom Reminder",
    desc: "Personal milestone or review note",
    icon: Tag,
    defaultColor: "#52525b",
  },
];

const COLOR_PRESETS = [
  { hex: "#18181b", label: "Carbon Neutral" },
  { hex: "#b91c1c", label: "Tech Vermilion" },
  { hex: "#d97706", label: "Muted Amber" },
  { hex: "#71717a", label: "Zinc Muted" },
  { hex: "#3f3f46", label: "Dark Zinc" },
  { hex: "#991b1b", label: "Dark Crimson" },
  { hex: "#b45309", label: "Deep Amber" },
  { hex: "#27272a", label: "Obsidian" },
];

export function AddEventModal({
  isOpen,
  open,
  onClose,
  onEventCreated,
  initialDate,
  initialType = "study_block",
  initialTrack = "",
  initialCapstone = "",
}: AddEventModalProps) {
  const isModalActive = isOpen ?? open ?? false;

  const titleInputId = useId();
  const descInputId = useId();
  const dateInputId = useId();
  const startInputId = useId();
  const endInputId = useId();
  const trackInputId = useId();
  const capstoneInputId = useId();
  const allDayInputId = useId();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CalendarEventType>(initialType);
  const [selectedColor, setSelectedColor] = useState(EVENT_TYPE_COLORS[initialType]?.hex ?? "#18181b");
  const [date, setDate] = useState(() => {
    if (initialDate) return initialDate;
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [targetTrack, setTargetTrack] = useState(initialTrack);
  const [capstoneProject, setCapstoneProject] = useState(initialCapstone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isModalActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalActive, onClose]);

  // Available capstones based on selected track
  const selectedTrackObj = TRACKS_CATALOG.find((t) => t.id === targetTrack || t.title === targetTrack);
  const availableCapstones = selectedTrackObj?.capstones ?? [];

  const handleTypeChange = (newType: CalendarEventType) => {
    setType(newType);
    const preset = TYPE_OPTIONS.find((t) => t.type === newType);
    if (preset) {
      setSelectedColor(preset.defaultColor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter an event or goal title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Construct ISO timestamp strings
      const startIso = isAllDay
        ? new Date(`${date}T00:00:00.000Z`).toISOString()
        : new Date(`${date}T${startTime}:00.000Z`).toISOString();
      const endIso = isAllDay
        ? new Date(`${date}T23:59:59.999Z`).toISOString()
        : new Date(`${date}T${endTime}:00.000Z`).toISOString();

      const newEvent = await createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        start: startIso,
        end: endIso,
        allDay: isAllDay,
        color: selectedColor,
        targetTrack: targetTrack || undefined,
        capstoneProject: capstoneProject || undefined,
        status: "pending",
      });

      if (onEventCreated) {
        onEventCreated(newEvent);
      }

      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : "Failed to create event. Please try again.";
      setErrorMessage(msg || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h2 id="add-event-modal-title" className="text-lg font-bold tracking-tight text-slate-900">
                  Schedule Event / Study Block
                </h2>
                <p className="text-xs text-slate-500">
                  Add focus sessions, sprint checkpoints, or mentor classes to your calendar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shadow-xs"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Event Title */}
            <div className="space-y-1.5">
              <label htmlFor={titleInputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Event Title <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id={titleInputId}
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Caching & Redis Architecture Sprint"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition shadow-xs"
              />
            </div>

            {/* Event Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Event Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = type === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => handleTypeChange(opt.type)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition shadow-xs ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
                          style={{
                            backgroundColor: `${opt.defaultColor}25`,
                            color: opt.defaultColor,
                          }}
                        >
                          <Icon size={13} />
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 truncate">{opt.label}</span>
                      </div>
                      <span className="mt-1 text-[10px] text-zinc-500 line-clamp-1">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                  <Clock size={14} className="text-[#b91c1c]" />
                  Schedule & Timing
                </span>
                <label htmlFor={allDayInputId} className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                  <input
                    id={allDayInputId}
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span>All-day event</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor={dateInputId} className="text-[11px] text-zinc-500">
                    Date
                  </label>
                  <input
                    id={dateInputId}
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                  />
                </div>

                {!isAllDay && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor={startInputId} className="text-[11px] text-zinc-500">
                        Start Time
                      </label>
                      <input
                        id={startInputId}
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={endInputId} className="text-[11px] text-zinc-500">
                        End Time
                      </label>
                      <input
                        id={endInputId}
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Target Track & Capstone Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor={trackInputId} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                  <Layers size={13} className="text-[#b91c1c]" />
                  Target Track
                </label>
                <select
                  id={trackInputId}
                  value={targetTrack}
                  onChange={(e) => {
                    setTargetTrack(e.target.value);
                    setCapstoneProject("");
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                >
                  <option value="">General / Independent Study</option>
                  {TRACKS_CATALOG.map((track) => (
                    <option key={track.id} value={track.title}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={capstoneInputId}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700"
                >
                  <Layers size={13} className="text-[#b91c1c]" />
                  Target Capstone / Project
                </label>
                {availableCapstones.length > 0 ? (
                  <select
                    id={capstoneInputId}
                    value={capstoneProject}
                    onChange={(e) => setCapstoneProject(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                  >
                    <option value="">None / Custom Scope</option>
                    {availableCapstones.map((cap) => (
                      <option key={cap.id} value={cap.title}>
                        {cap.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={capstoneInputId}
                    type="text"
                    value={capstoneProject}
                    onChange={(e) => setCapstoneProject(e.target.value)}
                    placeholder="e.g. Microservices Auth Gateway"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none transition shadow-xs"
                  />
                )}
              </div>
            </div>

            {/* Description & Goals */}
            <div className="space-y-1.5">
              <label htmlFor={descInputId} className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Description & Learning Objectives
              </label>
              <textarea
                id={descInputId}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What topics, code exercises, or deliverables will you complete during this block?"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition resize-none shadow-xs"
              />
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                <Tag size={13} className="text-[#b91c1c]" />
                Color Theme Tag
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => setSelectedColor(preset.hex)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      selectedColor === preset.hex
                        ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#b91c1c] hover:bg-[#991b1b] text-white font-semibold shadow-xs px-5"
              >
                {isSubmitting ? (
                  "Scheduling..."
                ) : (
                  <>
                    <Check size={14} className="mr-1.5" />
                    {type === "study_block" ? "Add Study Block" : "Schedule Event"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
