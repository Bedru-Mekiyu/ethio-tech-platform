import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Sparkles, BookOpen, Bell, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { fetchParentDashboard } from "@/services/parentService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent", "dashboard"],
    queryFn: fetchParentDashboard,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "Parent";
  const learners = data?.learners ?? [];

  if (isError) {
    return <QueryError onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6 text-slate-900">
      <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Welcome back, {firstName}</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor linked learners&apos; progress, milestone completion, and platform learning engagement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/parent/settings">
              <Button variant="outline" size="sm" className="text-xs">
                Account settings
              </Button>
            </Link>
            <Link to="/app/notifications">
              <Button variant="secondary" size="sm" className="gap-1 text-xs">
                <Bell size={13} /> Notifications
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {!data?.hasLinkedStudents ? (
        <EmptyState
          title="No student profile linked yet"
          description="Support can connect your account to a learner so progress and alerts appear here."
          actionLabel="Contact support"
          onAction={() => navigate("/contact")}
        />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {learners.map((learner) => (
            <Card key={learner.id} className="border-slate-200 bg-white p-4.5 shadow-xs hover:border-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Users size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{learner.fullName}</p>
                  <p className="text-[11px] text-slate-500">
                    Level {learner.level ?? 1} · {learner.xp ?? 0} XP
                  </p>
                </div>
              </div>
              <div className="mt-3.5 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p>
                  Lessons completed: <span className="font-semibold text-slate-900">{learner.lessonsCompleted}</span>
                </p>
                <p>
                  Projects approved: <span className="font-semibold text-emerald-600">{learner.approvedProjects}</span>{" "}
                  / {learner.submissions}
                </p>
                <p>
                  Enrolled tracks: <span className="font-semibold text-slate-900">{learner.enrolledTrackCount}</span>
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100">
                <Link to="/app/dashboard" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  View Learning Hub →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck size={16} />
            <p className="text-xs font-semibold text-slate-900">Access Status</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Parent accounts use role-based access and short-lived tokens for secure family oversight.
          </p>
        </Card>
        <Card className="border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen size={16} />
            <p className="text-xs font-semibold text-slate-900">Live Progress</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Lesson completion and project approvals update dynamically as learners work through tracks.
          </p>
        </Card>
        <Card className="border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles size={16} />
            <p className="text-xs font-semibold text-slate-900">Support & Inquiries</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Need to link another student? Our team is available 24/7.
          </p>
          <Link to="/contact" className="mt-2.5 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Contact Support →
          </Link>
        </Card>
      </div>
    </div>
  );
}
