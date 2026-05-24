import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAdminAnalytics } from "@/services/dashboardService";
import { StatCard } from "@/components/composites/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Users, Zap } from "lucide-react";

const xpTrend = [
  { week: "W1", xp: 12000 },
  { week: "W2", xp: 18500 },
  { week: "W3", xp: 22100 },
  { week: "W4", xp: 28400 },
];

const enrollmentTrend = [
  { month: "Jan", students: 420 },
  { month: "Feb", students: 580 },
  { month: "Mar", students: 710 },
  { month: "Apr", students: 890 },
];

export function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const analytics = data as {
    metrics?: {
      activeLearners?: number;
      totalStudents?: number;
      mentorNetwork?: number;
      xpEarned30d?: number;
      sessionFillRate?: number;
    };
    topMentors?: Array<{ fullName?: string; mentorScore?: number; totalSessions?: number }>;
    xpByTrack?: Array<{ title?: string; xpTotal?: number }>;
  } | undefined;

  const metrics = analytics?.metrics;
  const trackData =
    analytics?.xpByTrack?.map((t) => ({
      name: (t.title ?? "Track").slice(0, 12),
      xp: t.xpTotal ?? 0,
    })) ?? [
      { name: "Full-Stack", xp: 4200 },
      { name: "AI/Data", xp: 3100 },
      { name: "Cyber", xp: 2800 },
      { name: "Cloud", xp: 1900 },
    ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Platform analytics</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Monitor learner growth, XP trends, and mentor network health.
          </p>
        </div>
        <Link to="/admin/users">
          <Button variant="outline">Manage users</Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active learners"
            value={metrics?.activeLearners ?? 890}
            trend="+12% vs last week"
            icon={<Activity className="text-primary" size={20} />}
          />
          <StatCard
            label="Total students"
            value={metrics?.totalStudents ?? 2500}
            icon={<Users className="text-secondary" size={20} />}
          />
          <StatCard
            label="Mentor network"
            value={metrics?.mentorNetwork ?? 120}
            icon={<TrendingUp className="text-success" size={20} />}
          />
          <StatCard
            label="XP earned (30d)"
            value={(metrics?.xpEarned30d ?? 28400).toLocaleString()}
            icon={<Zap className="text-warning" size={20} />}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XP growth trend</CardTitle>
          </CardHeader>
          <div className="h-64">
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

        <Card>
          <CardHeader>
            <CardTitle>Enrollment by month</CardTitle>
          </CardHeader>
          <div className="h-64">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XP by track</CardTitle>
          </CardHeader>
          <div className="h-64">
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

        <Card>
          <CardHeader>
            <CardTitle>Top mentors</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {(analytics?.topMentors ?? [
              { fullName: "Elias M.", mentorScore: 4.9, totalSessions: 48 },
              { fullName: "Betelihem A.", mentorScore: 4.8, totalSessions: 36 },
              { fullName: "Yonas D.", mentorScore: 4.7, totalSessions: 29 },
            ]).map((mentor, i) => (
              <div
                key={mentor.fullName ?? i}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
              >
                <div>
                  <p className="font-medium">{mentor.fullName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {mentor.totalSessions ?? 0} sessions
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  Score {Math.round(mentor.mentorScore ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
