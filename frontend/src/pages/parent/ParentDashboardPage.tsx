import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Sparkles, BookOpen, Bell, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { fetchParentDashboard } from "@/services/parentService";
import { Badge } from "@/components/ui/badge";
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
    return <Skeleton className="h-64 w-full rounded-[24px]" />;
  }

  return (
    <div className="page-shell space-y-8">
      <Card className="hero-shell p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <Badge variant="purple">Parent access</Badge>
            <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {firstName}</h1>
            <p className="section-copy">
              Monitor linked learners&apos; progress, sessions, and platform activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/parent/settings">
              <Button variant="outline">Account settings</Button>
            </Link>
            <Link to="/app/notifications">
              <Button variant="secondary">
                <Bell size={16} /> Notifications
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {learners.map((learner) => (
            <Card key={learner.id} className="surface-panel p-6">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={18} />
                <p className="font-semibold text-white">{learner.fullName}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <p>
                  Level {learner.level ?? 1} · {learner.xp ?? 0} XP
                </p>
                <p>
                  Lessons completed: {learner.lessonsCompleted} · Projects approved: {learner.approvedProjects}/
                  {learner.submissions}
                </p>
                <p>Enrolled tracks: {learner.enrolledTrackCount}</p>
              </div>
              <Link to="/app/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
                View learning hub
              </Link>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={18} />
            <p className="font-semibold">Access status</p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Parent accounts use role-based access and short-lived tokens.
          </p>
        </Card>
        <Card className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-secondary" size={18} />
            <p className="font-semibold">Progress</p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Lesson completion and project approvals update as learners work.
          </p>
        </Card>
        <Card className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-warning" size={18} />
            <p className="font-semibold">Support</p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Need to link another learner? Contact the platform team.
          </p>
          <Link to="/contact" className="mt-3 inline-block text-sm text-primary hover:underline">
            Get help
          </Link>
        </Card>
      </div>
    </div>
  );
}
