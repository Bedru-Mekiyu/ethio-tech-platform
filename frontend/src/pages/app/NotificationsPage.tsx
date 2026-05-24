import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyNotifications, markNotificationRead } from "@/services/notificationsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchMyNotifications,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;

  const notifications = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : notifications.length === 0 ? (
        <EmptyState title="All caught up" description="Session and mentor updates will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n._id} className={`p-4 ${n.isRead ? "opacity-70" : ""}`}>
              <p className="font-medium">{n.message}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</p>
              {!n.isRead ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => markRead.mutate(n._id)}
                >
                  Mark read
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
