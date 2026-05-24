import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles, BookOpen, Bell, Users, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/composites/EmptyState";

export function ParentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const firstName = user?.fullName?.split(" ")[0] ?? "Parent";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <Badge variant="purple">Parent access</Badge>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {firstName}</h1>
          <p className="text-[var(--text-secondary)]">
            Keep up with your learner&apos;s progress, session activity, and support updates from a role-aware
            dashboard built for families.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/parent/settings">
            <Button variant="outline">Account settings</Button>
          </Link>
          <Link to="/contact">
            <Button>Contact support</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={18} />
            <p className="font-semibold">Access status</p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Parent accounts are protected by role-based access and short-lived tokens.
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="text-secondary" size={18} />
            <p className="font-semibold">Linked learner</p>
          </div>
          <div className="mt-4">
            <EmptyState
              title="No student profile linked yet"
              description="Support can connect your account to a learner so progress, sessions, and alerts appear here."
              actionLabel="Request linkage"
              onAction={() => navigate("/contact")}
            />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-warning" size={18} />
            <p className="font-semibold">What you&apos;ll see</p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Progress, achievements, live sessions, and important notifications once linking is complete.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-primary" size={18} />
            <h2 className="text-xl font-semibold">Parent onboarding</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "1. Request linkage",
                body: "Ask support to connect your account to the learner you want to monitor.",
              },
              {
                title: "2. Review progress",
                body: "Check sessions, achievements, and learning progress once the profile is linked.",
              },
              {
                title: "3. Stay informed",
                body: "Use notifications, resources, and support to keep learning momentum steady.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <p className="font-medium text-white">{step.title}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/contact">
              <Button>Request linkage</Button>
            </Link>
            <Link to="/resources">
              <Button variant="outline">Browse resources</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Bell className="text-secondary" size={18} />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Live alerts, session summaries, and support replies will appear in your in-app inbox.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-success" size={18} />
              <h2 className="text-xl font-semibold">Why this matters</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Strong parent visibility reduces onboarding friction, improves retention, and makes it easier to
              support learners when they need help.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
