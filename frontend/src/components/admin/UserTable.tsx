import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, type AdminUser } from "@/services/adminUserService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip } from "@/components/ui/tooltip";
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
} from "lucide-react";

const ROLE_VARIANTS: Record<string, "warning" | "purple" | "success" | "default" | "danger"> = {
  super_admin: "warning",
  admin: "warning",
  moderator: "purple",
  reviewer: "purple",
  support: "default",
  mentor: "success",
  student: "default",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "default" | "purple"> = {
  active: "success",
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
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedIds(new Set());
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminUserService.suspendUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminUserService.reactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminUserService.verifyUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item._id ?? ""));

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setSearch(value);
        setPage(1);
      }, 400);
    },
    []
  );

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
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, email, city, company..."
              className="pl-10 h-10"
              aria-label="Search users"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-pressed={showFilters}
            aria-label="Toggle filters"
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(roleFilter || statusFilter) && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {(roleFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedIds.size} selected
            </span>
          )}
          <select
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            aria-label="Sort users"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-muted)]">Role</label>
            <select
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="reviewer">Reviewer</option>
              <option value="support">Support</option>
              <option value="mentor">Mentor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-muted)]">Status</label>
            <select
              className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
                onClick={() => { setRoleFilter(""); setStatusFilter(""); setPage(1); }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <th className="w-10 p-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[var(--border)]"
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                />
              </th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">User</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Role</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">XP</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Track</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Joined</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Last Login</th>
              <th className="p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Verified</th>
              {showActions && <th className="w-20 p-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Actions</th>}
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
                <td colSpan={showActions ? 10 : 9} className="p-20 text-center text-[var(--text-muted)]">
                  <Users size={40} className="mx-auto mb-4 opacity-40" />
                  <p>No users found</p>
                  <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              items.map((user) => {
                const id = user._id ?? user.id ?? "";
                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => onSelectUser?.(user)}
                    role="row"
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="h-4 w-4 rounded border-[var(--border)]"
                        aria-label={`Select ${user.fullName}`}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{user.fullName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={ROLE_VARIANTS[user.role] || "default"}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANTS[user.status ?? ""] || "default"}>
                        {user.status ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {(user.xp ?? 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {user.currentCompany || "-"}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="p-4">
                      {user.isVerified ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <XCircle size={16} className="text-[var(--text-muted)]" />
                      )}
                    </td>
                    {showActions && (
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {onSelectUser && (
                            <Tooltip content="View profile">
                              <button
                                className="rounded-lg p-2 transition-colors hover:bg-white/10"
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
                                className="rounded-lg p-2 transition-colors hover:bg-red-500/10 hover:text-red-500"
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
                                className="rounded-lg p-2 transition-colors hover:bg-green-500/10 hover:text-green-500"
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
                                className="rounded-lg p-2 transition-colors hover:bg-green-500/10 hover:text-green-500"
                                onClick={() => verifyMutation.mutate(id)}
                                aria-label={`Verify ${user.fullName}`}
                              >
                                <UserCheck size={14} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="Delete user">
                            <button
                              className="rounded-lg p-2 transition-colors hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => {
                                if (window.confirm(`Delete ${user.fullName}? This can be undone.`)) {
                                  deleteMutation.mutate(id);
                                }
                              }}
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
        <p className="text-sm text-[var(--text-muted)]">
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
    </div>
  );
}
