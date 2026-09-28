import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { api, type ApiResponse } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { useAuthStore } from "@/store/authStore";

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
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: fetchMyCertificates,
    enabled: !!user,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-48 w-full rounded-[24px]" />;

  const certificates = data ?? [];

  return (
    <div className="space-y-6 text-slate-900">
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Verified Track Certificates</h1>
        <p className="mt-1 text-xs text-slate-500">
          Track completions and capstone deliverables verified by mentors and curriculum directors.
        </p>
      </Card>
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
            <Card
              key={cert._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100/80 shadow-2xs">
                    <Award size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{cert.track?.title ?? "Track Certificate"}</h3>
                </div>
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-end">
                {cert.certificateUrl ? (
                  <a
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[var(--primary-hover)] transition"
                  >
                    Download Certificate →
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">Certificate PDF generation in progress.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
