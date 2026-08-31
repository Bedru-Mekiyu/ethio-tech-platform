import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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

import { Card } from "@/components/ui/card";

export default function MentorDirectoryPage() {
  const navigate = useNavigate();
  usePageTitle("Mentors");
  const { data: mentors = [], isLoading } = useQuery<Mentor[]>({
    queryKey: ["mentors", "directory"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ mentors: Mentor[] }>>("/mentors");
      return data.data?.mentors || [];
    },
  });

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mentor Directory</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Find and connect with industry engineering mentors across Ethiopia and worldwide.</p>
          </div>
        </div>
      </Card>
      <MentorDirectory
        mentors={mentors}
        loading={isLoading}
        onStartConversation={(mentorId) => navigate(`/app/messages?start=${mentorId}`)}
      />
    </div>
  );
}
