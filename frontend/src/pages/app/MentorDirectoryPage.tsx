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
    <div className="space-y-6 text-slate-900">
      <Card className="border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Mentor Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Find and connect with industry engineering mentors across Ethiopia and worldwide.
            </p>
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
