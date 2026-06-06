import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { MentorDirectory } from "@/components/composites/MentorDirectory";
import { api } from "@/services/api";
import type { ApiResponse } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Mentor {
  _id: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  rating?: number;
  sessionCount?: number;
  studentCount?: number;
}

export default function MentorDirectoryPage() {
  usePageTitle("Mentors");
  const { data: mentors = [], isLoading } = useQuery<Mentor[]>({
    queryKey: ["mentors", "directory"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ mentors: Mentor[] }>>("/mentors");
      return data.data?.mentors || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white">Mentors</h1>
          <p className="text-sm text-[var(--text-secondary)]">Find and connect with expert mentors.</p>
        </div>
      </div>
      <MentorDirectory
        mentors={mentors}
        loading={isLoading}
        onStartConversation={(mentorId) => {
          window.location.href = `/app/messages?start=${mentorId}`;
        }}
      />
    </div>
  );
}
