import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, LogOut, LayoutDashboard, Mail, UserCircle2, MoonStar, Lock, BellRing } from "lucide-react";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { logoutApi } from "@/services/authService";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage({ scope }: { scope: "student" | "mentor" | "admin" | "parent" }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const dashboardPath = getDashboardPath(scope);

  return (
    <div className="space-y-8">
      <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="mb-1">Account settings</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Manage your workspace and access</h1>
            <p className="text-[var(--text-secondary)]">
              Keep role-based access, profile details, and support links in one calm control panel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={dashboardPath}>
              <Button variant="outline">
                <LayoutDashboard size={16} /> Return to dashboard
              </Button>
            </Link>
            <Button variant="secondary" type="button" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <div>
              <Badge variant="purple">Profile summary</Badge>
              <CardTitle className="mt-3">Identity and workspace status</CardTitle>
            </div>
          </CardHeader>
          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
            <Avatar name={user?.fullName ?? "EthioTech user"} size="lg" />
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-white">{user?.fullName ?? "Learner"}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email ?? "No email on file"}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="purple">{scope}</Badge>
                <Badge variant="success">{user?.level ? `Level ${user.level}` : "Level 1"}</Badge>
                <Badge variant="warning">{user?.xp ?? 0} XP</Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/5 p-4">
              <ShieldCheck size={16} className="text-primary" />
              <p className="mt-3 text-sm font-medium text-white">Protected access</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Short-lived tokens and role checks.</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/5 p-4">
              <BellRing size={16} className="text-secondary" />
              <p className="mt-3 text-sm font-medium text-white">Realtime alerts</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Sessions, projects, and mentor updates.</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-white/5 p-4">
              <MoonStar size={16} className="text-warning" />
              <p className="mt-3 text-sm font-medium text-white">Focused UI</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Built for calm, low-distraction use.</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <div>
              <Badge variant="purple">Support</Badge>
              <CardTitle className="mt-3">Quick actions</CardTitle>
            </div>
          </CardHeader>
          <div className="mt-6 grid gap-3">
            <Button className="w-full justify-start" variant="outline" type="button">
              <Mail size={16} /> Update email preferences
            </Button>
            <Button className="w-full justify-start" variant="outline" type="button">
              <Lock size={16} /> Review account security
            </Button>
            <Button className="w-full justify-start" variant="outline" type="button">
              <UserCircle2 size={16} /> Manage profile details
            </Button>
          </div>
          <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Support</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              For access issues or role changes, contact the platform team or your program lead.
            </p>
            <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <p className="flex items-center gap-2">
                <Mail size={14} /> support@ethiotech.org
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={14} /> Role-based permissions stay enforced server-side.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Sessions use short-lived access tokens and refresh rotation. Keep your account email current and report suspicious access immediately.
          </p>
        </Card>
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            In-app alerts cover classroom activity, mentor replies, and project review loops so the learning flow stays visible.
          </p>
        </Card>
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle>Workspace reset</CardTitle>
          </CardHeader>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Need a fresh start? Log out safely and sign back in to rehydrate your current role and dashboard.
          </p>
        </Card>
      </div>
    </div>
  );
}
