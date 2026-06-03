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

function StatCard({ label, value, icon: Icon, tone = "primary", note }: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "secondary";
  note?: string;
}) {
  const toneClass =
    tone === "success" ? "bg-success/10 text-success"
    : tone === "warning" ? "bg-warning/10 text-warning"
    : tone === "secondary" ? "bg-secondary/10 text-secondary"
    : "bg-primary/10 text-primary";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {note && <p className="mt-2 text-xs text-[var(--text-secondary)]">{note}</p>}
    </Card>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 4 ? "text-success" : score >= 3 ? "text-warning" : "text-danger";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn("text-lg font-bold", color)}>{score.toFixed(1)}</span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
    </div>
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
    <div className={cn(
      "rounded-[22px] border border-[var(--border)] transition-all duration-300",
      isExpanded ? "bg-[var(--bg-card)] shadow-lg shadow-black/20" : "bg-white/5 hover:bg-white/[0.07]"
    )}>
      {/* Collapsed row */}
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <Avatar src={student.avatar} name={student.fullName} userId={student._id} role="student" size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{student.fullName}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Level {student.level ?? 1} · {student.xp ?? 0} XP
          </p>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{student.sessionsAttended ?? 0}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{attendanceRate}%</p>
            <p className="text-[10px] text-[var(--text-muted)]">Attendance</p>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-sm font-semibold",
              avgScore >= 4 ? "text-success" : avgScore >= 3 ? "text-warning" : "text-white"
            )}>
              {avgScore ? avgScore.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Avg Score</p>
          </div>
          <Badge variant={
            (student.engagementScore ?? 0) >= 75 ? "success"
            : (student.engagementScore ?? 0) >= 40 ? "warning"
            : "purple"
          }>
            {student.engagementScore ?? 0}% Engaged
          </Badge>
        </div>

        <div className="shrink-0 text-[var(--text-muted)]">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-5 space-y-5 animate-in fade-in duration-300">
          {/* Quick stats grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Tracks Enrolled</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {student.enrolledTracks && student.enrolledTracks.length > 0 ? (
                  student.enrolledTracks.map((track) => (
                    <Badge key={track._id} variant="purple">{track.title}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">No tracks</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Attendance Rate</p>
              <ProgressBar value={attendanceRate} max={100} className="mt-3" />
              <p className="mt-2 text-sm font-semibold text-white">
                {student.sessionsAttended ?? 0} / {student.totalSessions ?? 0} sessions
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Last Active</p>
              <p className="mt-3 text-sm font-semibold text-white">
                {student.lastActiveAt
                  ? new Date(student.lastActiveAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                  : "Unknown"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {student.lastActiveAt
                  ? `${Math.round((Date.now() - Date.parse(student.lastActiveAt)) / (1000 * 60 * 60 * 24))} days ago`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Feedback history */}
          {student.feedbackHistory && student.feedbackHistory.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Feedback History
              </h4>
              {student.feedbackHistory.slice(0, 5).map((fb, idx) => (
                <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{fb.sessionTitle}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <ScoreBadge score={fb.participationScore} label="Participation" />
                      <ScoreBadge score={fb.communicationScore} label="Communication" />
                      <ScoreBadge score={fb.professionalismScore} label="Professionalism" />
                    </div>
                  </div>
                  {fb.comment && (
                    <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-[var(--text-secondary)] italic">
                      &ldquo;{fb.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">No feedback records for this student yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Sort options ---------- */
type SortField = "name" | "sessions" | "engagement" | "score" | "lastActive";
const sortOptions: Array<{ label: string; value: SortField }> = [
  { label: "Name", value: "name" },
  { label: "Sessions", value: "sessions" },
  { label: "Engagement", value: "engagement" },
  { label: "Avg Score", value: "score" },
  { label: "Last Active", value: "lastActive" },
];

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
          s.enrolledTracks?.some((t) => t.title.toLowerCase().includes(q))
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Student management</Badge>
            <h1 className="text-3xl font-bold text-white">Your Learners</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Track attendance, review engagement scores, and view feedback history for every student in your mentoring circle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data?.totalStudents ?? students.length}</p>
              <p className="text-xs text-[var(--text-muted)]">Total students</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search by name, email, or track..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Engagement:</span>
            </div>
            {(["all", "high", "medium", "low"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterEngagement(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs capitalize transition",
                  filterEngagement === f
                    ? "bg-primary text-[var(--bg-base)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Sort:</span>
            </div>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleSort(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition",
                  sortBy === opt.value
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                )}
              >
                {opt.label} {sortBy === opt.value && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Student list */}
      <div className="space-y-3">
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
          <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-8">
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
