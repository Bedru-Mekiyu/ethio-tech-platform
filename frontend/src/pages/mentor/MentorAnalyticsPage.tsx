/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/preserve-manual-memoization */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, CalendarCheck, Flame, Star, TrendingUp, Users, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/composites/QueryError";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuthStore } from "@/store/authStore";
import { fetchMentorAnalytics } from "@/services/mentorControlService";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
    <Card className="border-[#27272A] bg-[#0E0E11] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{icon}</div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-white mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

// Custom tooltip for premium aesthetics
function CustomChartTooltip({ active, payload, label, unit = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#27272A] bg-[#0E0E11] p-2.5 shadow-xl">
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-indigo-400 font-bold">
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
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Header card */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Mentor Insights & Analytics</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Understand session execution, engagement frequency, and cohort attendance metrics to maximize student outcomes.
          </p>
        </div>
      </Card>

      {/* Grid of stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Sessions Hosted"
          value={data?.sessionsHosted ?? 0}
          icon={<Video size={16} />}
          subtitle="Total sessions scheduled"
        />
        <MetricCard
          label="Completion Rate"
          value={`${data?.completionRate ?? 0}%`}
          icon={<CalendarCheck size={16} />}
          subtitle="Completed vs cancelled"
        />
        <MetricCard
          label="Attendance Rate"
          value={`${data?.attendanceRate ?? 0}%`}
          icon={<Users size={16} />}
          subtitle="Average verified presence"
        />
        <MetricCard
          label="Engagement Score"
          value={data?.engagementRate ?? 0}
          icon={<Flame size={16} />}
          subtitle="Cohort activity score"
        />
        <MetricCard
          label="Avg Rating"
          value={data?.avgRating ? `${(data.avgRating / 20).toFixed(1)} / 5.0` : "—"}
          icon={<Star size={16} />}
          subtitle={`From ${data?.totalFeedback ?? 0} reviews`}
        />
        <MetricCard
          label="Active Learners"
          value={data?.activeLearners ?? 0}
          icon={<BookOpen size={16} />}
          subtitle="Participating students"
        />
        <MetricCard
          label="Growth Cycles"
          value={Object.keys(data?.studentGrowth || {}).length}
          icon={<TrendingUp size={16} />}
          subtitle="Tracking cycles active"
        />
        <MetricCard
          label="Feedback Received"
          value={data?.totalFeedback ?? 0}
          icon={<BarChart3 size={16} />}
          subtitle="Session summaries"
        />
      </div>

      {/* Dynamic charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions Per Month */}
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-white">Sessions Per Month</h2>
          <p className="text-xs text-zinc-400 mb-4">Distribution of live classrooms hosted</p>
          {monthlySessionsData.length > 0 ? (
            <div className="relative w-full h-[260px] mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySessionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip unit="sessions" />}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="sessions" fill="url(#sessionGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[260px]">
              <p className="text-xs text-zinc-500">No session data available</p>
            </div>
          )}
        </Card>

        {/* Student Growth */}
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-white">Student Activity Growth</h2>
          <p className="text-xs text-zinc-400 mb-4">Total monthly student session participation</p>
          {studentGrowthData.length > 0 ? (
            <div className="relative w-full h-[260px] mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip unit="students" />} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#growthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[260px]">
              <p className="text-xs text-zinc-500">No student growth data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Link to Session Overview */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-white">Need granular session reports?</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Navigate to your sessions board to fetch analytics for specific virtual classrooms.
            </p>
          </div>
          <Link to="/mentor/sessions">
            <Button variant="outline" size="sm" className="text-xs font-medium text-zinc-300 hover:text-white shrink-0">
              Sessions Library <ArrowRight size={13} className="ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
