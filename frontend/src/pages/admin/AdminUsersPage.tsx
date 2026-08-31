import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, type AdminUser, type AdminUserAnalytics } from "@/services/adminUserService";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import { useToast } from "@/components/composites/ToastProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  AlertTriangle,
  Trash2,
  RotateCcw,
  Lock,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Key,
  Shield,
  Briefcase,
  GraduationCap,
  Sparkles,
  Download,
  RefreshCw,
  X,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

interface QuickActionDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

function QuickActionDrawer({ user, onClose, onUserUpdated }: QuickActionDrawerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || "student");

  const userId = user?._id ?? user?.id ?? "";

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "users", "analytics"] });
    onUserUpdated();
  };

  const verifyMutation = useMutation({
    mutationFn: () => adminUserService.verifyUser(userId),
    onSuccess: () => {
      toast.success(`${user?.fullName} marked as verified`);
      invalidate();
    },
    onError: () => toast.error("Failed to verify user"),
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminUserService.suspendUser(userId, suspendReason || undefined),
    onSuccess: () => {
      toast.success(`${user?.fullName} has been suspended`);
      setSuspendOpen(false);
      setSuspendReason("");
      invalidate();
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => adminUserService.reactivateUser(userId),
    onSuccess: () => {
      toast.success(`${user?.fullName} reactivated successfully`);
      invalidate();
    },
    onError: () => toast.error("Failed to reactivate user"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => adminUserService.resetPassword(userId, newPassword),
    onSuccess: () => {
      toast.success(`Password reset for ${user?.fullName}`);
      setResetPasswordOpen(false);
      setNewPassword("");
      invalidate();
    },
    onError: () => toast.error("Failed to reset password"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: () => adminUserService.changeRole(userId, selectedRole),
    onSuccess: () => {
      toast.success(`Role updated to ${selectedRole.replace("_", " ")}`);
      setRoleChangeOpen(false);
      invalidate();
    },
    onError: () => toast.error("Failed to change user role"),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: () => adminUserService.forceLogout(userId),
    onSuccess: () => {
      toast.success(`Active sessions revoked for ${user?.fullName}`);
    },
    onError: () => toast.error("Failed to force logout"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminUserService.softDelete(userId),
    onSuccess: () => {
      toast.success("User soft-deleted (recoverable for 30 days)");
      setDeleteOpen(false);
      onClose();
      invalidate();
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  const roleVariant =
    user.role === "admin" || user.role === "super_admin"
      ? "warning"
      : user.role === "mentor"
        ? "success"
        : user.role === "parent"
          ? "purple"
          : "default";

  const statusVariant =
    user.status === "active" ? "success" : user.status === "suspended" ? "danger" : "default";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />

      {/* Slide-Over Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="User Quick Action Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--bg)]/80">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                user.fullName?.charAt(0)?.toUpperCase() ?? "U"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">{user.fullName}</h2>
                {user.isVerified && <CheckCircle2 size={16} className="text-success shrink-0" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Badges Ribbon */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={roleVariant} className="capitalize">
              {user.role?.replace(/_/g, " ")}
            </Badge>
            <Badge variant={statusVariant} className="capitalize">
              {user.status ?? "Active"}
            </Badge>
            {user.isVerified ? (
              <Badge variant="success" className="gap-1">
                <UserCheck size={12} /> Verified
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1">
                <UserX size={12} /> Unverified
              </Badge>
            )}
            {user.gradeLevel !== undefined && (
              <Badge variant="purple" className="gap-1">
                <GraduationCap size={12} /> Grade {user.gradeLevel}
              </Badge>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">XP & Level</span>
              <p className="mt-1 text-base font-bold text-primary">{(user.xp ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Lvl {user.level ?? 1}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Sessions</span>
              <p className="mt-1 text-base font-bold text-white">{user.totalSessions ?? 0}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Completed</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Rating</span>
              <p className="mt-1 text-base font-bold text-warning">{user.mentorRating ? `${user.mentorRating}/5` : "N/A"}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Score: {user.mentorScore ? Math.round(user.mentorScore) : "-"}</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quick Management Actions</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {!user.isVerified ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  className="gap-1.5 text-xs w-full"
                >
                  <UserCheck size={14} /> Verify User
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  className="gap-1.5 text-xs w-full text-success"
                >
                  <CheckCircle2 size={14} /> Verified
                </Button>
              )}

              {user.status === "suspended" ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                  className="gap-1.5 text-xs w-full text-black"
                >
                  <RotateCcw size={14} /> Reactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setSuspendOpen(true)}
                  className="gap-1.5 text-xs w-full"
                >
                  <AlertTriangle size={14} /> Suspend
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewPassword("");
                  generateRandomPassword();
                  setResetPasswordOpen(true);
                }}
                className="gap-1.5 text-xs w-full"
              >
                <Key size={14} /> Reset Password
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => forceLogoutMutation.mutate()}
                disabled={forceLogoutMutation.isPending}
                className="gap-1.5 text-xs w-full"
              >
                <Lock size={14} /> Force Logout
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedRole(user.role || "student");
                  setRoleChangeOpen(true);
                }}
                className="gap-1.5 text-xs w-full"
              >
                <Shield size={14} /> Change Role
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteOpen(true)}
                className="gap-1.5 text-xs w-full"
              >
                <Trash2 size={14} /> Delete User
              </Button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">Profile Details</p>
            <div className="grid gap-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Mail size={13} /> Email
                </span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <Phone size={13} /> Phone
                  </span>
                  <span className="text-white">{user.phone}</span>
                </div>
              )}
              {user.city && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <MapPin size={13} /> City
                  </span>
                  <span className="text-white">{user.city}</span>
                </div>
              )}
              {user.currentCompany && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <Briefcase size={13} /> Company / Track
                  </span>
                  <span className="text-white">{user.currentCompany}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interests & Skills */}
          {((user.expertise ?? []).length > 0 || (user.learningInterests ?? []).length > 0) && (
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">Expertise & Interests</p>
              {(user.expertise ?? []).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[var(--text-muted)]">Expertise:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user.expertise!.map((exp) => (
                      <Badge key={exp} variant="purple" className="text-[10px]">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(user.learningInterests ?? []).length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[var(--text-muted)]">Interests:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user.learningInterests!.map((int) => (
                      <Badge key={int} variant="default" className="text-[10px]">
                        {int}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="space-y-1.5 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bio</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Security & Activity History */}
          <div className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">Security & Activity</p>
            <div className="grid gap-2 text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Last Login:</span>
                <span className="text-white font-medium">{formatDate(user.lastLoginAt)}</span>
              </div>
              {user.lastLoginIp && (
                <div className="flex justify-between">
                  <span>Last IP:</span>
                  <span className="font-mono text-white">{user.lastLoginIp}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="text-white">{formatDate(user.createdAt)}</span>
              </div>
              {user.statusChangedAt && (
                <div className="flex justify-between">
                  <span>Status Updated:</span>
                  <span className="text-white">{formatDate(user.statusChangedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </aside>

      {/* Suspend Confirmation Dialog */}
      {suspendOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setSuspendOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-500/30 bg-[var(--bg-card)] p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Suspend {user.fullName}</h3>
                <p className="text-xs text-[var(--text-muted)]">Revokes platform access and active tokens.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Reason for suspension (optional)
              </label>
              <Input
                placeholder="e.g. Terms violation or requested by moderator..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSuspendOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => suspendMutation.mutate()}
                loading={suspendMutation.isPending}
              >
                Confirm Suspend
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Reset Password Dialog */}
      {resetPasswordOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setResetPasswordOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset User Password</h3>
                <p className="text-xs text-[var(--text-muted)]">Set a new temporary password for {user.fullName}.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                New Password
              </label>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter or generate password..."
                  className="font-mono text-sm"
                />
                <Button size="sm" variant="outline" onClick={copyPassword} className="shrink-0">
                  {copiedPassword ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </Button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Generate Secure Random Password
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setResetPasswordOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newPassword || resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate()}
                loading={resetPasswordMutation.isPending}
              >
                Apply Password
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Role Change Dialog */}
      {roleChangeOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setRoleChangeOpen(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Role</h3>
                <p className="text-xs text-[var(--text-muted)]">Assign a new permission role to {user.fullName}.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Select Platform Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
                <option value="moderator">Moderator</option>
                <option value="reviewer">Reviewer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setRoleChangeOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => changeRoleMutation.mutate()}
                loading={changeRoleMutation.isPending}
              >
                Update Role
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title={`Soft Delete ${user.fullName}?`}
        description="The user account will be moved to the deleted registry and can be restored within 30 days."
        confirmLabel="Soft Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}

export function AdminUsersPage() {
  usePageTitle("User Management");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const analyticsQuery = useQuery<AdminUserAnalytics>({
    queryKey: ["admin", "users", "analytics"],
    queryFn: () => adminUserService.getAnalytics(),
  });

  const analytics = analyticsQuery.data;

  const totalUsers = analytics?.metrics?.totalUsers ?? 0;
  const verifiedUsers = analytics?.metrics?.verifiedUsers ?? 0;
  const activeUsers = analytics?.metrics?.activeUsers ?? 0;
  const studentCount = analytics?.byRole?.student ?? 0;
  const mentorCount = analytics?.byRole?.mentor ?? 0;
  const parentCount = analytics?.byRole?.parent ?? 0;
  const adminCount = (analytics?.byRole?.admin ?? 0) + (analytics?.byRole?.super_admin ?? 0);

  const verifiedPercent = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">User Management Directory</h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Search, filter, and execute administrative actions across all platform roles and accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "users", "analytics"] });
              }}
              className="text-xs text-zinc-300 hover:text-white"
            >
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adminUserService.exportUsers({})}
              className="text-xs text-zinc-300 hover:text-white"
            >
              <Download size={12} className="mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Analytics Overview Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Users</p>
          <p className="mt-1 text-xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{activeUsers} active</p>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Students</p>
          <p className="mt-1 text-xl font-bold text-white">{studentCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Learners</p>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Mentors</p>
          <p className="mt-1 text-xl font-bold text-white">{mentorCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Active guides</p>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Parents</p>
          <p className="mt-1 text-xl font-bold text-white">{parentCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Family accounts</p>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Admins & Staff</p>
          <p className="mt-1 text-xl font-bold text-white">{adminCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Platform ops</p>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">Verified Rate</p>
          <p className="mt-1 text-xl font-bold text-white">{verifiedPercent}%</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{verifiedUsers} verified</p>
        </div>
      </div>

      {/* Main Table with Quick Action Trigger */}
      <UserTable onSelectUser={(user) => setSelectedUser(user)} />

      {/* Quick Action Slide-over Drawer */}
      {selectedUser && (
        <QuickActionDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
          }}
        />
      )}
    </div>
  );
}
