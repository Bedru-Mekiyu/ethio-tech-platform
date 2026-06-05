import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, type AdminUser } from "@/services/adminUserService";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { TabsManual, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, AlertTriangle, Trash2, RotateCcw, Lock, Award, Activity, UserCheck, Users } from "lucide-react";
import { useToast } from "@/components/composites/ToastProvider";

function UserDetailPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const suspendMutation = useMutation({
    mutationFn: () => adminUserService.suspendUser(user._id ?? "", suspendReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowSuspend(false);
    },
    onError: () => {
      toast.error("Failed to suspend user");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => adminUserService.reactivateUser(user._id ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: () => {
      toast.error("Failed to reactivate user");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => adminUserService.verifyUser(user._id ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: () => {
      toast.error("Failed to verify user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminUserService.softDelete(user._id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

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

  return (
    <Card className="rounded-2xl border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--text-muted)]">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{user.fullName}</h2>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge
                variant={
                  user.role === "admin" || user.role === "super_admin"
                    ? "warning"
                    : user.role === "mentor"
                      ? "success"
                      : "default"
                }
              >
                {user.role?.replace("_", " ")}
              </Badge>
              <Badge
                variant={user.status === "active" ? "success" : user.status === "suspended" ? "danger" : "default"}
              >
                {user.status}
              </Badge>
              {user.isVerified ? (
                <Badge variant="success">Verified</Badge>
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

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">XP & Level</p>
          <p className="text-lg font-semibold">{user.xp?.toLocaleString()} XP</p>
          <p className="text-sm text-[var(--text-secondary)]">Level {user.level ?? 1}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Sessions</p>
          <p className="text-lg font-semibold">{user.totalSessions ?? 0}</p>
          <p className="text-sm text-[var(--text-secondary)]">Total sessions</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Mentor Score</p>
          <p className="text-lg font-semibold">{user.mentorScore ? Math.round(user.mentorScore) : "-"}</p>
          <p className="text-sm text-[var(--text-secondary)]">{user.mentorRating ? `${user.mentorRating}/5` : "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity size={14} /> Activity
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Last login</span>
              <span>{formatDate(user.lastLoginAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Joined</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Status changed</span>
              <span>{formatDate(user.statusChangedAt)}</span>
            </div>
            {user.lastLoginIp && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Last IP</span>
                <span className="font-mono text-xs">{user.lastLoginIp}</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Award size={14} /> Performance
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Attendance rate</span>
              <span>{user.attendanceRate ?? 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Feedback score</span>
              <span>{user.feedbackScore ?? 0}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Mentor rating</span>
              <span>{user.mentorRating ?? 0}/5</span>
            </div>
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold mb-2">Bio</h3>
          <p className="text-sm text-[var(--text-secondary)]">{user.bio}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
        {user.status === "active" && (
          <>
            <Button variant="danger" size="sm" onClick={() => setShowSuspend(!showSuspend)}>
              <AlertTriangle size={14} className="mr-2" /> Suspend
            </Button>
          </>
        )}
        {user.status === "suspended" && (
          <Button variant="primary" size="sm" onClick={() => reactivateMutation.mutate()}>
            <RotateCcw size={14} className="mr-2" /> Reactivate
          </Button>
        )}
        {!user.isVerified && (
          <Button variant="primary" size="sm" onClick={() => verifyMutation.mutate()}>
            <UserCheck size={14} className="mr-2" /> Verify
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => adminUserService.forceLogout(user._id ?? "")}>
          <Lock size={14} className="mr-2" /> Force Logout
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
          <Trash2 size={14} className="mr-2" /> Delete
        </Button>
      </div>

      {showSuspend && (
        <div className="mt-4 space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-500">Suspend {user.fullName}</p>
          <Input
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension (optional)"
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={() => suspendMutation.mutate()}>
              Confirm Suspend
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSuspend(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="mt-4 space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-500">
            Are you sure you want to delete {user.fullName}? This action can be undone within 30 days.
          </p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate()}>
              Confirm Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
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
          <h1 className="text-2xl font-bold md:text-3xl">User Management</h1>
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

      <TabsManual defaultValue="active" variant="pill">
        <TabsList>
          <TabsTrigger value="active">
            <Users size={14} className="mr-2" /> Active Users
          </TabsTrigger>
          <TabsTrigger value="deleted">
            <Trash2 size={14} className="mr-2" /> Deleted Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <UserTable onSelectUser={(user) => setSelectedUser(user)} />
        </TabsContent>
        <TabsContent value="deleted" className="mt-6">
          <DeletedUsersTable onSelectUser={(user) => setSelectedUser(user)} />
        </TabsContent>
      </TabsManual>
    </div>
  );
}

function DeletedUsersTable({ onSelectUser }: { onSelectUser: (user: AdminUser) => void }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", "deleted", page],
    queryFn: () => adminUserService.getDeletedUsers(page, 20),
  });

  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminUserService.restoreUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users", "deleted"] }),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.permanentDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users", "deleted"] }),
  });

  if (isLoading) return <Spinner />;
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
        <Trash2 size={40} className="mb-4 opacity-40" />
        <p>No deleted users</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">User</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Deleted At</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Days Ago</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => {
              const id = user._id ?? user.id ?? "";
              return (
                <tr key={id} className="border-b border-[var(--border)] transition-colors hover:bg-white/[0.02]">
                  <td className="p-4 cursor-pointer" onClick={() => onSelectUser(user)}>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-[var(--text-primary)]">{user.fullName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-4 text-sm">{user.daysSinceDeletion ?? 0}d</td>
                  <td className="p-4">
                    <Badge variant={user.canBePermanentlyDeleted ? "warning" : "default"}>
                      {user.canBePermanentlyDeleted ? "Ready for cleanup" : "Within retention"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(id)}>
                        <RotateCcw size={14} className="mr-1" /> Restore
                      </Button>
                      {user.canBePermanentlyDeleted && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) {
                              permanentDeleteMutation.mutate(id);
                            }
                          }}
                        >
                          <Trash2 size={14} className="mr-1" /> Purge
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex justify-between text-sm text-[var(--text-muted)]">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
