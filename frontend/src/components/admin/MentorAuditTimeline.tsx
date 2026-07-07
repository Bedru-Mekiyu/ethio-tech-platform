import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApplicationAuditLog, type AuditLogEntry } from "@/services/mentorApplicationService";

function formatAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

function AuditItem({ log }: { log: AuditLogEntry }) {
  return (
    <div className="relative border-l border-[var(--border)] pl-4 pb-4 last:pb-0">
      <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border border-primary bg-[var(--bg)]" />
      <p className="text-sm font-medium capitalize text-white">{formatAction(log.action)}</p>
      <p className="text-xs text-[var(--text-muted)]">
        {log.actor?.fullName ?? "System"} · {new Date(log.createdAt).toLocaleString()}
      </p>
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {JSON.stringify(log.metadata)}
        </p>
      )}
    </div>
  );
}

export function MentorAuditTimeline({ applicationId }: { applicationId: string }) {
  const auditQuery = useQuery({
    queryKey: ["admin", "mentor-application", applicationId, "audit"],
    queryFn: () => fetchApplicationAuditLog(applicationId),
  });

  if (auditQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const logs = auditQuery.data?.logs ?? [];
  if (!logs.length) {
    return <p className="text-sm text-[var(--text-muted)]">No audit events yet.</p>;
  }

  return (
    <div className="space-y-0">
      {logs.map((log) => (
        <AuditItem key={log._id} log={log} />
      ))}
    </div>
  );
}
