import { useQuery } from "@tanstack/react-query";
import { Activity, Database, FileClock, RadioTower, Server, ShieldCheck } from "lucide-react";
import {
  fetchAdminAuditLogs,
  fetchPlatformHealth,
  type AdminAuditLog,
  type PlatformHealthData,
} from "@/services/dashboardService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";

function statusVariant(status?: string): "default" | "success" | "warning" | "purple" {
  if (status === "ready" || status === "OK") return "success";
  if (status === "not_ready") return "warning";
  return "default";
}

function HealthCard({
  title,
  value,
  detail,
  status,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  status?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <Badge variant={statusVariant(status)}>{status ?? "unknown"}</Badge>
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{detail}</p>
    </Card>
  );
}

function AuditRow({ log }: { log: AdminAuditLog }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-4 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-white">{log.action}</p>
        <p className="text-xs text-[var(--text-muted)]">{log.resource}</p>
      </div>
      <div>
        <p className="text-sm text-white">{log.actor?.fullName ?? "System"}</p>
        <p className="text-xs text-[var(--text-muted)]">{log.actor?.role ?? "unknown role"}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-[var(--text-secondary)]">
          {log.metadata?.method ?? "ACTION"} {log.metadata?.path ?? log.resourceId ?? "resource"}
        </p>
        <p className="text-xs text-[var(--text-muted)]">{log.ip ?? "no ip captured"}</p>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "recent"}
      </p>
    </div>
  );
}

export function AdminOperationsPage() {
  const healthQuery = useQuery({
    queryKey: ["admin", "operations", "health"],
    queryFn: fetchPlatformHealth,
    refetchInterval: 30_000,
  });
  const auditQuery = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: fetchAdminAuditLogs,
  });

  if (healthQuery.isError || auditQuery.isError) {
    return (
      <QueryError
        message="Unable to load platform operations data."
        onRetry={() => {
          void healthQuery.refetch();
          void auditQuery.refetch();
        }}
      />
    );
  }

  const health = (healthQuery.data ?? {}) as PlatformHealthData;
  const logs = auditQuery.data?.logs ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(14,20,32,0.98),rgba(7,12,20,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Operations</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Platform Health & Audit Trail</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              Monitor readiness, realtime load, and privileged admin activity from one launch console.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void healthQuery.refetch();
              void auditQuery.refetch();
            }}
          >
            <Activity size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {healthQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
          <Skeleton className="h-44 rounded-[24px]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <HealthCard
            title="API liveness"
            value={health.live?.version ?? "v1"}
            detail={health.live?.mission ?? "HTTP API is responding."}
            status={health.live?.status}
            icon={<Server size={20} />}
          />
          <HealthCard
            title="Database readiness"
            value={health.ready?.database ?? "unknown"}
            detail="Readiness controls traffic routing and deploy promotion."
            status={health.ready?.status}
            icon={<Database size={20} />}
          />
          <HealthCard
            title="Realtime system"
            value={`${health.realtime?.activeSockets ?? 0} sockets`}
            detail={`${health.realtime?.rooms ?? 0} active rooms, ${health.realtime?.uptimeSeconds ?? 0}s uptime.`}
            status={health.realtime?.status}
            icon={<RadioTower size={20} />}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <Badge variant="purple">Launch controls</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-white">Production readiness posture</h2>
          <div className="mt-5 space-y-3">
            {[
              { label: "Admin actions are audit logged", done: logs.length > 0 },
              { label: "MongoDB readiness is exposed", done: health.ready?.status === "ready" },
              { label: "Socket runtime is observable", done: typeof health.realtime?.activeSockets === "number" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <span className="text-sm font-medium text-white">{item.label}</span>
                <Badge variant={item.done ? "success" : "warning"}>{item.done ? "active" : "needs data"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="success">Audit logs</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Recent privileged activity</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <FileClock size={16} />
              {logs.length} events
            </div>
          </div>

          {auditQuery.isLoading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : logs.length ? (
            <div className="mt-5 space-y-3">
              {logs.slice(0, 10).map((log) => (
                <AuditRow key={log._id} log={log} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
              <ShieldCheck className="mx-auto text-primary" size={28} />
              <h3 className="mt-3 text-lg font-semibold text-white">No audit events yet</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Mentor reviews, moderation actions, and other privileged changes will appear here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
