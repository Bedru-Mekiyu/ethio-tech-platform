import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAdminAnalytics, type AdminAnalyticsData } from "@/services/dashboardService";
import { StatCard } from "@/components/composites/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, MapPin, TrendingUp, Users, Zap } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const xpTrend = [
  { week: "W1", xp: 0 },
  { week: "W2", xp: 0 },
  { week: "W3", xp: 0 },
  { week: "W4", xp: 0 },
];

const enrollmentTrend = [
  { month: "Jan", students: 0 },
  { month: "Feb", students: 0 },
  { month: "Mar", students: 0 },
  { month: "Apr", students: 0 },
];

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-[28px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    </div>
  );
}

export function AdminPage() {
  usePageTitle("Admin Analytics");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const analytics = data as
    | (AdminAnalyticsData & {
        hubs?: Array<{ city?: string; availableSeats?: number; mentorInCharge?: { fullName?: string } }>;
      })
    | undefined;

  const metrics = analytics?.metrics;
  const trackData = useMemo(
    () =>
      analytics?.xpByTrack?.map((track) => ({
        name: (track.title ?? "Track").slice(0, 12),
        xp: track.xpTotal ?? 0,
      })) ?? [],
    [analytics?.xpByTrack],
  );

  const hubs = analytics?.hubs ?? [];
  const upcomingSessions = analytics?.upcomingSessions ?? [];

  if (isLoading) return <AdminSkeleton />;
  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="section-title text-2xl md:text-3xl">Platform overview</h1>
        <p className="text-[var(--text-secondary)]">Unable to load analytics data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="section-title">Platform overview</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Monitor learners, mentors, hub availability, and upcoming sessions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/operations">
              <Button variant="outline">Operations</Button>
            </Link>
            <Link to="/admin/moderation">
              <Button variant="outline">Review queue</Button>
            </Link>
            <Link to="/admin/users">
              <Button>Manage users</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active learners"
          value={metrics?.activeLearners ?? 0}
          icon={<Activity className="text-primary" size={20} />}
        />
        <StatCard
          label="Total students"
          value={metrics?.totalStudents ?? 0}
          icon={<Users className="text-secondary" size={20} />}
        />
        <StatCard
          label="Mentor network"
          value={metrics?.mentorNetwork ?? 0}
          icon={<TrendingUp className="text-success" size={20} />}
        />
        <StatCard
          label="XP earned (30d)"
          value={(metrics?.xpEarned30d ?? 0).toLocaleString()}
          icon={<Zap className="text-warning" size={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>XP growth trend</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xpTrend}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#111823",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="xp" stroke="#00d2ff" strokeWidth={2} dot={{ fill: "#7b61ff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>Enrollment by month</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentTrend}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#111823",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="students" fill="#7b61ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>XP by track</CardTitle>
          </CardHeader>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackData} layout="vertical">
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "#111823",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="xp" fill="#00d2ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>Top mentors</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-3">
            {(analytics?.topMentors ?? []).slice(0, 3).map((mentor, index) => (
              <div
                key={mentor.fullName ?? index}
                className="flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-white/5 p-3"
              >
                <div>
                  <p className="font-medium text-white">{mentor.fullName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{mentor.totalSessions ?? 0} sessions</p>
                </div>
                <span className="text-sm font-semibold text-primary">Score {Math.round(mentor.mentorScore ?? 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Hub availability</h2>
            </div>
            <Badge variant="success">{hubs.length} active</Badge>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {hubs.slice(0, 6).map((hub, index) => (
              <div key={hub.city ?? index} className="rounded-[22px] border border-[var(--border)] bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <p className="font-medium text-white">{hub.city ?? "Hub"}</p>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {hub.mentorInCharge?.fullName ?? "Mentor pending"}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{hub.availableSeats ?? 0} seats open</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <AlertTriangle size={14} />
            <span className="text-[10px] uppercase tracking-[0.22em]">Operational view</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Upcoming sessions</h2>
          <div className="mt-4 space-y-3">
            {upcomingSessions.slice(0, 4).map((session, index) => (
              <div key={session.title ?? index} className="rounded-[22px] border border-[var(--border)] bg-white/5 p-4">
                <p className="font-medium text-white">{session.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : "Scheduled soon"}
                </p>
                <Badge variant={session.status === "live" ? "success" : "purple"} className="mt-2">
                  {session.status ?? "scheduled"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
