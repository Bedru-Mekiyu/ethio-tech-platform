/* eslint-disable react-hooks/purity */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CalendarCheck,
  Filter,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */
interface StudentSummary {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: string;
  level?: number;
  xp?: number;
  enrolledTracks?: Array<{ _id: string; title: string }>;
  sessionsAttended?: number;
  totalSessions?: number;
  averageScore?: number;
  lastActiveAt?: string;
  engagementScore?: number;
  feedbackHistory?: Array<{
    sessionTitle: string;
    participationScore: number;
    communicationScore: number;
    professionalismScore: number;
    comment?: string;
    createdAt: string;
  }>;
}

interface MentorStudentsData {
  students: StudentSummary[];
  totalStudents: number;
  averageEngagement: number;
  averageAttendance: number;
}

/* ---------- Fetch ---------- */
async function fetchMentorStudents(): Promise<MentorStudentsData> {
  const { data } = await api.get("/mentor/students");
  return data.data ?? { students: [], totalStudents: 0, averageEngagement: 0, averageAttendance: 0 };
}

/* ---------- Sub-components ---------- */
function MentorStudentsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[24px]" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-[28px]" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  note,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "secondary";
  note?: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        : tone === "secondary"
          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";

  return (
    <Card className="border border-[#27272A] bg-[#0E0E11] p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={15} />
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</p>
      <p className="mt-1 text-xl font-bold text-white font-mono">{value}</p>
      {note && <p className="mt-0.5 text-xs text-zinc-400">{note}</p>}
    </Card>
  );
}

function StudentRow({
  student,
  isExpanded,
  onToggle,
}: {
  student: StudentSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const attendanceRate = student.totalSessions
    ? Math.round(((student.sessionsAttended ?? 0) / student.totalSessions) * 100)
    : 0;
  const avgScore = student.averageScore ?? 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#27272A] transition-all",
        isExpanded ? "bg-[#0E0E11] shadow-lg" : "bg-[#0E0E11] hover:border-zinc-700",
      )}
    >
      {/* Collapsed row */}
      <button
        type="button"
        className="flex w-full items-center gap-3.5 p-3.5 text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <Avatar src={student.avatar} name={student.fullName} userId={student._id} role="student" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{student.fullName}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Level {student.level ?? 1} · {student.xp ?? 0} XP
          </p>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <div className="text-center">
            <p className="text-xs font-semibold text-white">{student.sessionsAttended ?? 0}</p>
            <p className="text-[10px] text-zinc-500">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">{attendanceRate}%</p>
            <p className="text-[10px] text-zinc-500">Attendance</p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-xs font-semibold",
                avgScore >= 4 ? "text-emerald-400" : avgScore >= 3 ? "text-amber-400" : "text-white",
              )}
            >
              {avgScore ? avgScore.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] text-zinc-500">Avg Score</p>
          </div>
          <Badge
            variant={
              (student.engagementScore ?? 0) >= 75
                ? "success"
                : (student.engagementScore ?? 0) >= 40
                  ? "warning"
                  : "purple"
            }
            size="sm"
          >
            {student.engagementScore ?? 0}% Engaged
          </Badge>
        </div>

        <div className="shrink-0 text-zinc-500">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-[#27272A] p-4 space-y-4">
          {/* Quick stats grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Tracks Enrolled</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {student.enrolledTracks && student.enrolledTracks.length > 0 ? (
                  student.enrolledTracks.map((track) => (
                    <Badge key={track._id} variant="purple" size="sm">
                      {track.title}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No tracks</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Attendance Rate</p>
              <ProgressBar value={attendanceRate} max={100} className="mt-2 h-1" />
              <p className="mt-1.5 text-xs font-semibold text-white">
                {student.sessionsAttended ?? 0} / {student.totalSessions ?? 0} sessions
              </p>
            </div>
            <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Last Active</p>
              <p className="mt-1.5 text-xs font-semibold text-white">
                {student.lastActiveAt
                  ? new Date(student.lastActiveAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Unknown"}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {student.lastActiveAt
                  ? `${Math.round((Date.now() - Date.parse(student.lastActiveAt)) / (1000 * 60 * 60 * 24))} days ago`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Feedback history */}
          {student.feedbackHistory && student.feedbackHistory.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Feedback History
              </h4>
              {student.feedbackHistory.slice(0, 5).map((fb, idx) => (
                <div key={idx} className="rounded-lg border border-[#27272A] bg-[#141418] p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{fb.sessionTitle}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  {fb.comment && <p className="text-xs text-zinc-400">{fb.comment}</p>}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "sessions", label: "Sessions" },
  { value: "engagement", label: "Engagement" },
  { value: "score", label: "Score" },
  { value: "lastActive", label: "Recent" },
] as const;

type SortField = (typeof sortOptions)[number]["value"];

/* ---------- Main Page ---------- */
export function MentorStudentsPage() {
  usePageTitle("My Students");
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterEngagement, setFilterEngagement] = useState<"all" | "high" | "medium" | "low">("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mentor", "students"],
    queryFn: fetchMentorStudents,
    enabled: !!user,
  });

  const students = data?.students ?? [];

  const filtered = useMemo(() => {
    let list = [...students];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.enrolledTracks?.some((t) => t.title.toLowerCase().includes(q)),
      );
    }

    // Engagement filter
    if (filterEngagement !== "all") {
      list = list.filter((s) => {
        const eg = s.engagementScore ?? 0;
        if (filterEngagement === "high") return eg >= 75;
        if (filterEngagement === "medium") return eg >= 40 && eg < 75;
        return eg < 40;
      });
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case "sessions":
          cmp = (a.sessionsAttended ?? 0) - (b.sessionsAttended ?? 0);
          break;
        case "engagement":
          cmp = (a.engagementScore ?? 0) - (b.engagementScore ?? 0);
          break;
        case "score":
          cmp = (a.averageScore ?? 0) - (b.averageScore ?? 0);
          break;
        case "lastActive":
          cmp = Date.parse(a.lastActiveAt ?? "0") - Date.parse(b.lastActiveAt ?? "0");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, search, sortBy, sortDir, filterEngagement]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  if (isLoading) return <MentorStudentsSkeleton />;
  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Unable to load student data."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Your Learners Directory</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Track attendance, review engagement scores, and view feedback history for every student in your circle.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Users size={18} aria-hidden="true" />
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={data?.totalStudents ?? students.length}
          icon={Users}
          note="In your mentoring circle"
        />
        <StatCard
          label="Avg Engagement"
          value={`${Math.round(data?.averageEngagement ?? 0)}%`}
          icon={TrendingUp}
          tone="success"
          note="Across all sessions"
        />
        <StatCard
          label="Avg Attendance"
          value={`${Math.round(data?.averageAttendance ?? 0)}%`}
          icon={CalendarCheck}
          tone="warning"
          note="Session attendance rate"
        />
        <StatCard
          label="Feedback Given"
          value={students.reduce((acc, s) => acc + (s.feedbackHistory?.length ?? 0), 0)}
          icon={MessageSquare}
          tone="secondary"
          note="Total feedback entries"
        />
      </div>

      {/* Filters & Search */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search by name, email, or track..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs bg-[#141418] border-[#27272A] text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter size={12} className="text-zinc-500" />
              <span className="text-[11px] text-zinc-500">Engagement:</span>
            </div>
            {(["all", "high", "medium", "low"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterEngagement(f)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] capitalize transition font-medium",
                  filterEngagement === f
                    ? "bg-indigo-600 text-white"
                    : "border border-[#27272A] bg-[#141418] text-zinc-400 hover:text-white",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1">
              <ArrowUpDown size={12} className="text-zinc-500" />
              <span className="text-[11px] text-zinc-500">Sort:</span>
            </div>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleSort(opt.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] transition font-medium",
                  sortBy === opt.value
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "border border-[#27272A] bg-[#141418] text-zinc-400 hover:text-white",
                )}
              >
                {opt.label} {sortBy === opt.value && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Student list */}
      <div className="space-y-2.5">
        {filtered.length > 0 ? (
          filtered.map((student) => (
            <StudentRow
              key={student._id}
              student={student}
              isExpanded={expandedId === student._id}
              onToggle={() => setExpandedId(expandedId === student._id ? null : student._id)}
            />
          ))
        ) : (
          <Card className="border-[#27272A] bg-[#0E0E11] p-8 text-center">
            <EmptyState
              title={search ? "No students match your search" : "No students yet"}
              description={
                search
                  ? "Try adjusting your search or filter criteria."
                  : "Students will appear here once they attend your mentoring sessions."
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
