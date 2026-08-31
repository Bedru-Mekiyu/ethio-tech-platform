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
    return <Skeleton className="h-64 w-full rounded-[24px]" />;
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Welcome back, {firstName}</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Monitor linked learners&apos; progress, milestone completion, and platform learning engagement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/parent/settings">
              <Button variant="outline" size="sm" className="text-xs">Account settings</Button>
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
            <Card key={learner.id} className="border-[#27272A] bg-[#0E0E11] p-4.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Users size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{learner.fullName}</p>
                  <p className="text-[11px] text-zinc-500">Level {learner.level ?? 1} · {learner.xp ?? 0} XP</p>
                </div>
              </div>
              <div className="mt-3.5 space-y-1.5 rounded-lg border border-[#27272A] bg-[#141418] p-3 text-xs text-zinc-400">
                <p>Lessons completed: <span className="font-semibold text-white">{learner.lessonsCompleted}</span></p>
                <p>Projects approved: <span className="font-semibold text-emerald-400">{learner.approvedProjects}</span> / {learner.submissions}</p>
                <p>Enrolled tracks: <span className="font-semibold text-white">{learner.enrolledTrackCount}</span></p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#27272A]">
                <Link to="/app/dashboard" className="text-xs font-medium text-violet-400 hover:underline">
                  View Learning Hub →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="border-[#27272A] bg-[#0E0E11] p-4.5">
          <div className="flex items-center gap-2 text-violet-400">
            <ShieldCheck size={16} />
            <p className="text-xs font-semibold text-white">Access Status</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Parent accounts use role-based access and short-lived tokens for secure family oversight.
          </p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-4.5">
          <div className="flex items-center gap-2 text-violet-400">
            <BookOpen size={16} />
            <p className="text-xs font-semibold text-white">Live Progress</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Lesson completion and project approvals update dynamically as learners work through tracks.
          </p>
        </Card>
        <Card className="border-[#27272A] bg-[#0E0E11] p-4.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles size={16} />
            <p className="text-xs font-semibold text-white">Support & Inquiries</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Need to link another student? Our team is available 24/7.
          </p>
          <Link to="/contact" className="mt-2.5 inline-block text-xs font-medium text-violet-400 hover:underline">
            Contact Support →
          </Link>
        </Card>
      </div>
    </div>
  );
}
