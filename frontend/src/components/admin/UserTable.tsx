import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, type AdminUser } from "@/services/adminUserService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import { EmptyState } from "@/components/composites/EmptyState";
import { useToast } from "@/components/composites/ToastProvider";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Eye,
  UserCheck,
  Filter,
  RefreshCw,
  Users,
  UserMinus,
  X,
} from "lucide-react";

const ROLE_VARIANTS: Record<string, "warning" | "outline" | "default" | "danger"> = {
  super_admin: "warning",
  admin: "warning",
  moderator: "outline",
  reviewer: "outline",
  support: "default",
  mentor: "outline",
  student: "default",
  parent: "outline",
};

const STATUS_VARIANTS: Record<string, "outline" | "warning" | "danger" | "default"> = {
  active: "outline",
  pending: "warning",
  inactive: "default",
  suspended: "danger",
  banned: "danger",
  rejected: "danger",
  deleted: "default",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "email_asc", label: "Email A-Z" },
  { value: "email_desc", label: "Email Z-A" },
  { value: "xp_desc", label: "Highest XP" },
  { value: "xp_asc", label: "Lowest XP" },
  { value: "last_login", label: "Last login" },
  { value: "sessions_desc", label: "Most sessions" },
  { value: "mentor_score", label: "Mentor score" },
];

interface UserTableProps {
  onSelectUser?: (user: AdminUser) => void;
  showActions?: boolean;
}

export function UserTable({ onSelectUser, showActions = true }: UserTableProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users", page, limit, search, roleFilter, statusFilter, sort],
    queryFn: () =>
      adminUserService.getUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sort,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.softDelete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("User deleted. You can restore them within 30 days.");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminUserService.bulkAction({ action: "soft_delete", userIds: ids }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      const failed = result.failed?.length ?? 0;
      const success = result.success?.length ?? 0;
      if (failed === 0) {
        toast.success(`${success} user${success === 1 ? "" : "s"} deleted`);
      } else if (success === 0) {
        toast.error(`Failed to delete ${failed} user${failed === 1 ? "" : "s"}`);
      } else {
        toast.warning(`Deleted ${success}, ${failed} failed`);
      }
    },
    onError: () => toast.error("Bulk delete failed"),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminUserService.suspendUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User suspended");
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminUserService.reactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User reactivated");
    },
    onError: () => toast.error("Failed to reactivate user"),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminUserService.verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User verified");
    },
    onError: () => toast.error("Failed to verify user"),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item._id ?? ""));

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i._id ?? "")));
    }
  }, [allSelected, items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle size={40} className="text-warning" />
        <p className="text-[var(--text-secondary)]">Failed to load users</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw size={16} className="mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="font-medium text-zinc-900">{selectedIds.size === 1 ? "user" : "users"} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="ml-2 h-7 px-2 text-zinc-600 hover:text-zinc-900"
            >
              <X size={14} className="mr-1" /> Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              loading={bulkDeleteMutation.isPending}
            >
              <UserMinus size={14} className="mr-2" />
              Delete selected
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, email, city, company..."
              className="pl-9 h-9 text-xs rounded-lg border-zinc-200 bg-white text-zinc-900"
              aria-label="Search users"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-pressed={showFilters}
            aria-label="Toggle filters"
            className="border-zinc-200 text-zinc-700 hover:text-zinc-900 h-9 text-xs"
          >
            <Filter size={14} className="mr-1.5" />
            Filters
            {(roleFilter || statusFilter) && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                {(roleFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            aria-label="Refresh"
            className="border-zinc-200 text-zinc-700 hover:text-zinc-900 h-9"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-xs"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort users"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params: Record<string, string> = {};
              if (sort) params.sort = sort;
              if (roleFilter) params.role = roleFilter;
              if (statusFilter) params.status = statusFilter;
              adminUserService.exportUsers(params);
            }}
            aria-label="Export users"
            className="border-zinc-200 text-zinc-700 hover:text-zinc-900"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Role</label>
            <select
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
              <option value="moderator">Moderator</option>
              <option value="reviewer">Reviewer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Status</label>
            <select
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-900"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {(roleFilter || statusFilter) && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900"
                onClick={() => {
                  setRoleFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75">
              <th className="w-10 px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">User</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Role</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">XP</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Track</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Joined</th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Last Login
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Verified
              </th>
              {showActions && (
                <th className="w-20 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className="p-20">
                  <div className="flex items-center justify-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className="p-0">
                  <EmptyState
                    eyebrow="Directory"
                    title="No users found"
                    description="Try adjusting your search or filters to see more results."
                    illustration={<Users size={26} className="text-zinc-400 opacity-80" />}
                    className="rounded-none border-0 bg-transparent py-16"
                  />
                </td>
              </tr>
            ) : (
              items.map((user) => {
                const id = user._id ?? user.id ?? "";
                return (
                  <tr
                    key={id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/70 cursor-pointer text-xs"
                    onClick={() => onSelectUser?.(user)}
                    role="row"
                  >
                    <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                        aria-label={`Select ${user.fullName}`}
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate text-xs">{user.fullName}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Badge variant={ROLE_VARIANTS[user.role] || "default"} size="sm">
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Badge variant={STATUS_VARIANTS[user.status ?? ""] || "default"} size="sm">
                        {user.status ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs font-medium text-zinc-700">
                      {(user.xp ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-zinc-600">{user.currentCompany || "-"}</td>
                    <td className="px-3.5 py-2.5 text-xs text-zinc-500">{formatDate(user.createdAt)}</td>
                    <td className="px-3.5 py-2.5 text-xs text-zinc-500">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-3.5 py-2.5">
                      {user.isVerified ? (
                        <CheckCircle size={15} className="text-zinc-900" />
                      ) : (
                        <XCircle size={15} className="text-zinc-400" />
                      )}
                    </td>
                    {showActions && (
                      <td className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {onSelectUser && (
                            <Tooltip content="View profile">
                              <button
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                                onClick={() => onSelectUser(user)}
                                aria-label={`View ${user.fullName}'s profile`}
                              >
                                <Eye size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {user.status === "active" && (
                            <Tooltip content="Suspend user">
                              <button
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                onClick={() => suspendMutation.mutate({ id })}
                                aria-label={`Suspend ${user.fullName}`}
                              >
                                <AlertTriangle size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {user.status === "suspended" && (
                            <Tooltip content="Reactivate user">
                              <button
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                onClick={() => reactivateMutation.mutate(id)}
                                aria-label={`Reactivate ${user.fullName}`}
                              >
                                <RotateCcw size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {!user.isVerified && (
                            <Tooltip content="Verify user">
                              <button
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                onClick={() => verifyMutation.mutate(id)}
                                aria-label={`Verify ${user.fullName}`}
                              >
                                <UserCheck size={14} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="Delete user">
                            <button
                              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              onClick={() => setDeleteTarget(user)}
                              aria-label={`Delete ${user.fullName}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {pagination ? `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <Button
                key={p}
                variant={p === page ? "primary" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.fullName ?? "user"}?`}
        description="The user will be soft-deleted and can be restored within 30 days from the Deleted Users tab."
        confirmLabel="Delete user"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const id = deleteTarget._id ?? deleteTarget.id ?? "";
            deleteMutation.mutate(id);
            setDeleteTarget(null);
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} user${selectedIds.size === 1 ? "" : "s"}?`}
        description="All selected users will be soft-deleted. You can restore them within 30 days from the Deleted Users tab."
        confirmLabel={`Delete ${selectedIds.size}`}
        variant="danger"
        loading={bulkDeleteMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
      />
    </div>
  );
}
