import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { api, type ApiResponse } from "@/services/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

interface Certificate {
  _id: string;
  track?: { title?: string };
  certificateUrl?: string;
  createdAt?: string;
}

const fetchMyCertificates = async () => {
  const { data } = await api.get<ApiResponse<{ certificates: Certificate[] }>>("/certificates");
  return data.data.certificates ?? [];
};

export function CertificatesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: fetchMyCertificates,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full rounded-[24px]" />;

  const certificates = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Certificates</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Track completions verified by mentors and admins.
        </p>
      </div>
      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Finish a learning track and earn mentor verification to unlock certificates."
          actionLabel="View tracks"
          actionHref="/app/tracks"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert._id} className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  {cert.track?.title ?? "Track certificate"}
                </CardTitle>
              </CardHeader>
              <Badge variant="success" className="mt-3">
                Verified
              </Badge>
              {cert.certificateUrl ? (
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  Download certificate
                </a>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">Certificate file pending upload.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
