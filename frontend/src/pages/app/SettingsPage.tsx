import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, LogOut, LayoutDashboard, Mail, UserCircle2 } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Account settings</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Manage your {scope} workspace, profile, and access preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile summary</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            <Avatar name={user?.fullName ?? "EthioTech user"} size="lg" />
            <div>
              <p className="text-lg font-semibold">{user?.fullName ?? "Learner"}</p>
              <p className="text-sm text-[var(--text-muted)]">{user?.email ?? "No email on file"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="purple">{scope}</Badge>
                <span className="text-xs text-[var(--text-muted)]">
                  {user?.level ? `Level ${user.level}` : "Level 1"}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {user?.xp ?? 0} XP
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace actions</CardTitle>
          </CardHeader>
          <div className="grid gap-3">
            <Link to={dashboardPath}>
              <Button className="w-full" variant="outline">
                <LayoutDashboard size={16} /> Return to dashboard
              </Button>
            </Link>
            <Button className="w-full" variant="secondary" type="button" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Sessions use short-lived access tokens and refresh rotation. Keep your account email
            current and report suspicious access immediately.
          </p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Important classroom, session, and achievement updates are delivered in-app. Email
            alerts can be enabled later without changing your learning flow.
          </p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p className="flex items-center gap-2">
              <Mail size={16} /> support@ethiotech.org
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck size={16} /> Account and classroom access are role-based.
            </p>
            <p className="flex items-center gap-2">
              <UserCircle2 size={16} /> Profile updates are saved from the user management API.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
