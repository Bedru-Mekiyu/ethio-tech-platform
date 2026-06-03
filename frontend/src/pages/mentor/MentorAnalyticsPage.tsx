import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Flame,
  Star,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/composites/QueryError";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuthStore } from "@/store/authStore";
import { fetchMentorAnalytics } from "@/services/mentorControlService";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ---------- Helper Functions ---------- */
function formatMonthKey(key: string): string {
  if (key === "unknown") return "Unknown";
  try {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return key;
  }
}

/* ---------- Sub-components ---------- */
function MetricCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-4 transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

// Custom tooltip for premium aesthetics
function CustomChartTooltip({ active, payload, label, unit = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0B0F19]/90 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs text-primary font-bold">
          {payload[0].value} {unit}
        </p>
      </div>
    );
  }
  return null;
}

/* ---------- Main Component ---------- */
export function MentorAnalyticsPage() {
  usePageTitle("Mentor Analytics");
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["mentor-analytics"],
    queryFn: fetchMentorAnalytics,
    enabled: !!user,
  });

  // Format month keys for Recharts
  const monthlySessionsData = useMemo(() => {
    if (!data?.sessionsByMonth) return [];
    return Object.entries(data.sessionsByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        name: formatMonthKey(month),
        sessions: count,
      }));
  }, [data?.sessionsByMonth]);

  const studentGrowthData = useMemo(() => {
    if (!data?.studentGrowth) return [];
    return Object.entries(data.studentGrowth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        name: formatMonthKey(month),
        students: count,
      }));
  }, [data?.studentGrowth]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] rounded-[28px]" />
          <Skeleton className="h-[400px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : "Failed to load analytics"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Analytics board</Badge>
            <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">Mentor Insights</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Understand session execution, engagement frequency, and cohort attendance metrics to maximize your student outcomes.
            </p>
          </div>
          <Badge variant="success">Active circles</Badge>
        </div>
      </Card>

      {/* Grid of stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Sessions Hosted"
          value={data?.sessionsHosted ?? 0}
          icon={<Video size={18} />}
          subtitle="Total sessions scheduled"
        />
        <MetricCard
          label="Completion Rate"
          value={`${data?.completionRate ?? 0}%`}
          icon={<CalendarCheck size={18} />}
          subtitle="Completed / Cancelled"
        />
        <MetricCard
          label="Attendance Rate"
          value={`${data?.attendanceRate ?? 0}%`}
          icon={<Users size={18} />}
          subtitle="Average verified presence"
        />
        <MetricCard
          label="Engagement Score"
          value={data?.engagementRate ?? 0}
          icon={<Flame size={18} />}
          subtitle="Formula activity average"
        />
        <MetricCard
          label="Avg Rating"
          value={data?.avgRating ? `${(data.avgRating / 20).toFixed(1)} / 5.0` : "—"}
          icon={<Star size={18} />}
          subtitle={`From ${data?.totalFeedback ?? 0} feedback reviews`}
        />
        <MetricCard
          label="Active Learners"
          value={data?.activeLearners ?? 0}
          icon={<BookOpen size={18} />}
          subtitle="Unique participating students"
        />
        <MetricCard
          label="Student Growth"
          value={Object.keys(data?.studentGrowth || {}).length}
          icon={<TrendingUp size={18} />}
          subtitle="Tracking cycles active"
        />
        <MetricCard
          label="Feedback Received"
          value={data?.totalFeedback ?? 0}
          icon={<BarChart3 size={18} />}
          subtitle="Session summary reviews"
        />
      </div>

      {/* Dynamic charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions Per Month */}
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)]/90 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-2">Sessions Per Month</h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">Distribution of live classrooms hosted</p>
          {monthlySessionsData.length > 0 ? (
            <div className="relative w-full h-[300px] mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySessionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d2ff" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#00d2ff" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip unit="sessions" />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="sessions" fill="url(#sessionGrad)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-[var(--text-muted)]">No session data available</p>
            </div>
          )}
        </Card>

        {/* Student Growth */}
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)]/90 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-2">Student Activity Growth</h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">Total monthly student session participation count</p>
          {studentGrowthData.length > 0 ? (
            <div className="relative w-full h-[300px] mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip unit="participations" />} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#growthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-[var(--text-muted)]">No student growth data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Link to Session Overview */}
      <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)]/90 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Need granular session reports?</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Navigate to your sessions board to fetch analytics for specific virtual classrooms.</p>
          </div>
          <Link to="/mentor/sessions">
            <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-white hover:bg-white/5">
              Sessions Library <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
