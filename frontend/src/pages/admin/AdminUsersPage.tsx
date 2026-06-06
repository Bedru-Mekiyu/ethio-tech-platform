import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, type AdminUser } from "@/services/adminUserService";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import { useToast } from "@/components/composites/ToastProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Lock,
  Award,
  Activity,
  UserCheck,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

function UserDetailPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const suspendMutation = useMutation({
    mutationFn: () => adminUserService.suspendUser(user._id ?? "", suspendReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${user.fullName} suspended`);
      setSuspendOpen(false);
      setSuspendReason("");
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => adminUserService.reactivateUser(user._id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${user.fullName} reactivated`);
    },
    onError: () => toast.error("Failed to reactivate user"),
  });

  const verifyMutation = useMutation({
    mutationFn: () => adminUserService.verifyUser(user._id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${user.fullName} verified`);
    },
    onError: () => toast.error("Failed to verify user"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminUserService.softDelete(user._id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted. You can restore them within 30 days.");
      onClose();
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const forceLogout = async () => {
    try {
      await adminUserService.forceLogout(user._id ?? "");
      toast.success(`Force-logged-out ${user.fullName}`);
    } catch {
      toast.error("Failed to force logout");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const roleVariant =
    user.role === "admin" || user.role === "super_admin" ? "warning" : user.role === "mentor" ? "success" : "default";
  const statusVariant = user.status === "active" ? "success" : user.status === "suspended" ? "danger" : "default";

  return (
    <Card className="rounded-2xl border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-[var(--border-strong)]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{user.fullName}</h2>
            <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={roleVariant}>{user.role?.replace("_", " ")}</Badge>
              <Badge variant={statusVariant}>{user.status}</Badge>
              {user.isVerified ? (
                <Badge variant="success" showDot>
                  Verified
                </Badge>
              ) : (
                <Badge variant="default">Unverified</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatBlock
          label="XP & Level"
          value={`${(user.xp ?? 0).toLocaleString()} XP`}
          sub={`Level ${user.level ?? 1}`}
        />
        <StatBlock label="Sessions" value={String(user.totalSessions ?? 0)} sub="Total sessions" />
        <StatBlock
          label="Mentor Score"
          value={user.mentorScore ? Math.round(user.mentorScore).toString() : "-"}
          sub={user.mentorRating ? `${user.mentorRating}/5` : "N/A"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Activity" icon={<Activity size={14} />}>
          <Field label="Last login" value={formatDate(user.lastLoginAt)} />
          <Field label="Joined" value={formatDate(user.createdAt)} />
          <Field label="Status changed" value={formatDate(user.statusChangedAt)} />
          {user.lastLoginIp && <Field label="Last IP" value={user.lastLoginIp} mono />}
        </Section>
        <Section title="Performance" icon={<Award size={14} />}>
          <Field label="Attendance rate" value={`${user.attendanceRate ?? 0}%`} />
          <Field label="Feedback score" value={`${user.feedbackScore ?? 0}/100`} />
          <Field label="Mentor rating" value={`${user.mentorRating ?? 0}/5`} />
        </Section>
      </div>

      {(user.phone || user.city || user.bio || user.expertise?.length) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Profile" icon={<Users size={14} />}>
            {user.phone && (
              <Field label="Phone" value={user.phone} icon={<Phone size={12} className="text-[var(--text-muted)]" />} />
            )}
            {user.email && (
              <Field label="Email" value={user.email} icon={<Mail size={12} className="text-[var(--text-muted)]" />} />
            )}
            {user.city && (
              <Field label="City" value={user.city} icon={<MapPin size={12} className="text-[var(--text-muted)]" />} />
            )}
            {user.gradeLevel !== undefined && <Field label="Grade level" value={String(user.gradeLevel)} />}
            {user.currentCompany && <Field label="Company" value={user.currentCompany} />}
          </Section>
          <Section title="Engagement" icon={<Calendar size={14} />}>
            {user.expertise && user.expertise.length > 0 && (
              <Field label="Expertise" value={user.expertise.join(", ")} />
            )}
            {user.learningInterests && user.learningInterests.length > 0 && (
              <Field label="Interests" value={user.learningInterests.join(", ")} />
            )}
            {!user.expertise?.length && !user.learningInterests?.length && (
              <p className="text-sm text-[var(--text-muted)]">No interests listed.</p>
            )}
          </Section>
        </div>
      )}

      {user.bio && (
        <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold mb-2 text-[var(--text-primary)]">Bio</h3>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{user.bio}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
        {user.status === "active" && (
          <Button variant="danger" size="sm" onClick={() => setSuspendOpen(true)} disabled={suspendMutation.isPending}>
            <AlertTriangle size={14} className="mr-2" /> Suspend
          </Button>
        )}
        {user.status === "suspended" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => reactivateMutation.mutate()}
            loading={reactivateMutation.isPending}
          >
            <RotateCcw size={14} className="mr-2" /> Reactivate
          </Button>
        )}
        {!user.isVerified && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => verifyMutation.mutate()}
            loading={verifyMutation.isPending}
          >
            <UserCheck size={14} className="mr-2" /> Verify
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={forceLogout}>
          <Lock size={14} className="mr-2" /> Force Logout
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 size={14} className="mr-2" /> Delete
        </Button>
      </div>

      {suspendOpen && (
        <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-500">Suspend {user.fullName}</p>
          <Input
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension (optional)"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => suspendMutation.mutate()}
              loading={suspendMutation.isPending}
            >
              Confirm Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSuspendOpen(false);
                setSuspendReason("");
              }}
              disabled={suspendMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${user.fullName}?`}
        description="The user will be soft-deleted and can be restored within 30 days from the Deleted Users tab."
        confirmLabel="Delete user"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Card>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="text-sm text-[var(--text-secondary)]">{sub}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-primary)]">
        {icon} {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
        {icon} {label}
      </span>
      <span className={mono ? "font-mono text-xs text-[var(--text-primary)]" : "text-[var(--text-primary)]"}>
        {value}
      </span>
    </div>
  );
}

export function AdminUsersPage() {
  usePageTitle("User Management");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl text-[var(--text-primary)]">User Management</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Search, filter, and manage all platform users from one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => adminUserService.exportUsers({})}>
            <Users size={16} className="mr-2" /> Export All
          </Button>
        </div>
      </div>

      <UserTable onSelectUser={(user) => setSelectedUser(user)} />
    </div>
  );
}
