import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminUsers } from "@/services/dashboardService";
import { Link } from "react-router-dom";

export function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">User management</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Review platform users, roles, and progress from the admin surface.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to analytics</Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((user) => (
            <Card key={user.id ?? user._id ?? user.email}>
              <CardHeader>
                <CardTitle>{user.fullName}</CardTitle>
                <Badge variant={user.role === "admin" ? "warning" : user.role === "mentor" ? "purple" : "default"}>
                  {user.role}
                </Badge>
              </CardHeader>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>{user.email}</p>
                <p>
                  Level {user.level ?? 1} · {user.xp ?? 0} XP
                </p>
                {user.bio && <p>{user.bio}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
