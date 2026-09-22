import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
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
  UserPlus,
  Pencil,
} from "lucide-react";

interface QuickActionDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

function QuickActionDrawer({ user, onClose, onUserUpdated }: QuickActionDrawerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);

  const canChangeRole = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const canDeleteUser = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const canForceLogout = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const canSuspendUser =
    currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.role === "moderator";
  const canVerifyUser = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || "student");
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editCity, setEditCity] = useState(user?.city || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editGradeLevel, setEditGradeLevel] = useState(user?.gradeLevel ? String(user.gradeLevel) : "");
  const [editCompany, setEditCompany] = useState(user?.currentCompany || "");
  const [editExpertise, setEditExpertise] = useState(user?.expertise ? user.expertise.join(", ") : "");

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

  const editMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        city: editCity.trim() || undefined,
        bio: editBio.trim() || undefined,
      };
      if (user?.role === "student" && editGradeLevel) {
        payload.gradeLevel = Number(editGradeLevel);
      }
      if (user?.role === "mentor") {
        if (editCompany.trim()) payload.currentCompany = editCompany.trim();
        if (editExpertise.trim()) {
          payload.expertise = editExpertise
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      return adminUserService.updateUser(userId, payload);
    },
    onSuccess: () => {
      toast.success(`Profile updated for ${editFullName}`);
      setEditOpen(false);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    },
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
        ? "outline"
        : user.role === "parent"
          ? "outline"
          : "default";

  const statusVariant = user.status === "active" ? "success" : user.status === "suspended" ? "danger" : "default";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />

      {/* Slide-Over Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="User Quick Action Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                (user.fullName?.charAt(0)?.toUpperCase() ?? "U")
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 truncate">{user.fullName}</h2>
                {user.isVerified && <CheckCircle2 size={16} className="text-zinc-900 shrink-0" />}
              </div>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
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
              <Badge variant="outline" className="gap-1">
                <GraduationCap size={12} /> Grade {user.gradeLevel}
              </Badge>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">XP & Level</span>
              <p className="mt-1 text-base font-bold text-zinc-900">{(user.xp ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500">Lvl {user.level ?? 1}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Sessions</span>
              <p className="mt-1 text-base font-bold text-zinc-900">{user.totalSessions ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Completed</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Rating</span>
              <p className="mt-1 text-base font-bold text-amber-600">
                {user.mentorRating ? `${user.mentorRating}/5` : "N/A"}
              </p>
              <p className="text-[10px] text-zinc-500">
                Score: {user.mentorScore ? Math.round(user.mentorScore) : "-"}
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900">Quick Management Actions</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {canVerifyUser &&
                (!user.isVerified ? (
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
                ))}

              {canSuspendUser &&
                (user.status === "suspended" ? (
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
                ))}

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

              {canForceLogout && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => forceLogoutMutation.mutate()}
                  disabled={forceLogoutMutation.isPending}
                  className="gap-1.5 text-xs w-full"
                >
                  <Lock size={14} /> Force Logout
                </Button>
              )}

              {canChangeRole && (
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
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditFullName(user.fullName || "");
                  setEditPhone(user.phone || "");
                  setEditCity(user.city || "");
                  setEditBio(user.bio || "");
                  setEditGradeLevel(user.gradeLevel ? String(user.gradeLevel) : "");
                  setEditCompany(user.currentCompany || "");
                  setEditExpertise(user.expertise ? user.expertise.join(", ") : "");
                  setEditOpen(true);
                }}
                className="gap-1.5 text-xs w-full"
              >
                <Pencil size={14} /> Edit Profile
              </Button>

              {canDeleteUser && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-1.5 text-xs w-full"
                >
                  <Trash2 size={14} /> Delete User
                </Button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-zinc-500">Profile Details</p>
            <div className="grid gap-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Mail size={13} /> Email
                </span>
                <span className="text-zinc-900 font-medium">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Phone size={13} /> Phone
                  </span>
                  <span className="text-zinc-900">{user.phone}</span>
                </div>
              )}
              {user.city && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <MapPin size={13} /> City
                  </span>
                  <span className="text-zinc-900">{user.city}</span>
                </div>
              )}
              {user.currentCompany && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Briefcase size={13} /> Company / Track
                  </span>
                  <span className="text-zinc-900">{user.currentCompany}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interests & Skills */}
          {((user.expertise ?? []).length > 0 || (user.learningInterests ?? []).length > 0) && (
            <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-zinc-500">Expertise & Interests</p>
              {(user.expertise ?? []).length > 0 && (
                <div className="space-y-1">
                  <span className="text-zinc-500">Expertise:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user.expertise!.map((exp) => (
                      <Badge key={exp} variant="outline" className="text-[10px]">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(user.learningInterests ?? []).length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-zinc-500">Interests:</span>
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
            <div className="space-y-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-zinc-500">Bio</p>
              <p className="text-zinc-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Security & Activity History */}
          <div className="space-y-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 text-xs">
            <p className="font-semibold uppercase tracking-wider text-zinc-500">Security & Activity</p>
            <div className="grid gap-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Last Login:</span>
                <span className="text-zinc-900 font-medium">{formatDate(user.lastLoginAt)}</span>
              </div>
              {user.lastLoginIp && (
                <div className="flex justify-between">
                  <span>Last IP:</span>
                  <span className="font-mono text-zinc-900">{user.lastLoginIp}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="text-zinc-900">{formatDate(user.createdAt)}</span>
              </div>
              {user.statusChangedAt && (
                <div className="flex justify-between">
                  <span>Status Updated:</span>
                  <span className="text-zinc-900">{formatDate(user.statusChangedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-4 bg-zinc-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </aside>

      {/* Suspend Confirmation Dialog */}
      {suspendOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setSuspendOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-200 bg-white p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Suspend {user.fullName}</h3>
                <p className="text-xs text-zinc-500">Revokes platform access and active tokens.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
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
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setResetPasswordOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Reset User Password</h3>
                <p className="text-xs text-zinc-500">Set a new temporary password for {user.fullName}.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">New Password</label>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter or generate password..."
                  className="font-mono text-sm"
                />
                <Button size="sm" variant="outline" onClick={copyPassword} className="shrink-0">
                  {copiedPassword ? <Check size={14} className="text-zinc-900" /> : <Copy size={14} />}
                </Button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-[#b91c1c] hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles size={12} /> Generate Secure Random Password
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
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

      {roleChangeOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setRoleChangeOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Change Role</h3>
                <p className="text-xs text-zinc-500">Assign a new permission role to {user.fullName}.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Select Platform Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
                <option value="moderator">Moderator</option>
                <option value="reviewer">Reviewer</option>
                <option value="support">Support</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
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

      {/* Edit User Profile Modal */}
      {editOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setEditOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit Profile for ${user.fullName}`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Edit User Profile</h3>
                  <p className="text-xs text-zinc-500">Update account attributes for {user.fullName}.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name *</label>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Abebe Bikila"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +251 911 000 000"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {user.role === "student" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Grade Level</label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">Select grade...</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              )}

              {user.role === "mentor" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Current Company</label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="e.g. Google, Safaricom, Ethio Telecom"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Expertise (comma separated)
                    </label>
                    <Input
                      value={editExpertise}
                      onChange={(e) => setEditExpertise(e.target.value)}
                      placeholder="e.g. Python, Cloud, Distributed Systems"
                      className="h-9 text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Professional background or student profile description..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!editFullName.trim() || editMutation.isPending}
                onClick={() => editMutation.mutate()}
                loading={editMutation.isPending}
              >
                Save Changes
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
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const canCreateUser = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const canExportUsers = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("student");
  const [createGradeLevel, setCreateGradeLevel] = useState("11");
  const [createCity, setCreateCity] = useState("Addis Ababa");
  const [createPhone, setCreatePhone] = useState("");
  const [createBio, setCreateBio] = useState("");
  const [createCompany, setCreateCompany] = useState("");
  const [createExpertise, setCreateExpertise] = useState("");
  const [createError, setCreateError] = useState("");

  const generateRandomPasswordForCreate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreatePassword(pwd);
  };

  const createUserMutation = useMutation({
    mutationFn: async () => {
      setCreateError("");
      if (!createName.trim() || createName.trim().length < 2) {
        throw new Error("Full name must be at least 2 characters.");
      }
      if (!createEmail.trim() || !createEmail.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }
      if (!createPassword || createPassword.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      const payload: {
        fullName: string;
        email: string;
        password: string;
        role: string;
        gradeLevel?: number;
        city?: string;
        phone?: string;
        bio?: string;
        currentCompany?: string;
        expertise?: string[];
      } = {
        fullName: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        password: createPassword,
        role: createRole,
      };
      if (createCity.trim()) payload.city = createCity.trim();
      if (createPhone.trim()) payload.phone = createPhone.trim();
      if (createBio.trim()) payload.bio = createBio.trim();
      if (createRole === "student" && createGradeLevel) {
        payload.gradeLevel = Number(createGradeLevel);
      }
      if (createRole === "mentor") {
        if (createCompany.trim()) payload.currentCompany = createCompany.trim();
        if (createExpertise.trim()) {
          payload.expertise = createExpertise
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      return adminUserService.createUser(payload);
    },
    onSuccess: (data) => {
      toast.success(`User ${data.user.fullName} (${data.user.role}) created successfully!`);
      setCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("student");
      setCreatePhone("");
      setCreateBio("");
      setCreateCompany("");
      setCreateExpertise("");
      setCreateError("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "analytics"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to create user. Please check your inputs.");
      setCreateError(msg);
      toast.error(msg);
    },
  });

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
      <Card className="border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">User Management Directory</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Search, filter, and execute administrative actions across all platform roles and accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreateUser && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCreateError("");
                  generateRandomPasswordForCreate();
                  setCreateOpen(true);
                }}
                className="text-xs text-white bg-zinc-900 hover:bg-zinc-800 gap-1.5 shadow-xs"
              >
                <UserPlus size={14} /> Create User
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "users", "analytics"] });
              }}
              className="text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200"
            >
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
            {canExportUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => adminUserService.exportUsers({})}
                className="text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200"
              >
                <Download size={12} className="mr-1" /> Export CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Analytics Overview Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Users</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{totalUsers.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{activeUsers} active</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-900 font-semibold">Students</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{studentCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Learners</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-900 font-semibold">Mentors</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{mentorCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Active guides</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-900 font-semibold">Parents</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{parentCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Family accounts</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Admins & Staff</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{adminCount.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Platform ops</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-900 font-semibold">Verified Rate</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{verifiedPercent}%</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{verifiedUsers} verified</p>
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
      {/* Create User Modal Dialog */}
      {createOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={() => setCreateOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label="Create New User Account"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Create New User Account</h3>
                  <p className="text-xs text-zinc-500">Provision a new account with active access.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <p className="font-medium">{createError}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@ethiotech.com"
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPasswordForCreate}
                    className="text-[11px] font-medium text-[#b91c1c] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={11} /> Generate Random
                  </button>
                </div>
                <Input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="At least 8 chars (letters & numbers)"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Platform Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="support">Support</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {createRole === "student" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Grade Level</label>
                    <select
                      value={createGradeLevel}
                      onChange={(e) => setCreateGradeLevel(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>
                )}

                {createRole === "mentor" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Current Company</label>
                    <Input
                      value={createCompany}
                      onChange={(e) => setCreateCompany(e.target.value)}
                      placeholder="e.g. Google, Safaricom"
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {createRole === "mentor" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Expertise (comma separated)</label>
                  <Input
                    value={createExpertise}
                    onChange={(e) => setCreateExpertise(e.target.value)}
                    placeholder="e.g. Python, Cloud, Distributed Systems"
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                  <Input
                    value={createCity}
                    onChange={(e) => setCreateCity(e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone</label>
                  <Input
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="e.g. +251 911 000 000"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Bio</label>
                <textarea
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  placeholder="Optional background or bio description..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => createUserMutation.mutate()}
                loading={createUserMutation.isPending}
                disabled={createUserMutation.isPending || !createName.trim() || !createEmail.trim() || !createPassword}
                className="text-white bg-zinc-900 hover:bg-zinc-800 gap-1.5"
              >
                <UserPlus size={14} /> Create User
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
