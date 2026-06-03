import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { MentorDirectory } from "@/components/composites/MentorDirectory";
import { api } from "@/services/api";
import type { ApiResponse } from "@/services/api";

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
  const { data: mentors = [], isLoading } = useQuery<Mentor[]>({
    queryKey: ["mentors", "directory"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ mentors: Mentor[] }>>("/mentors");
      return data.data?.mentors || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mentor Directory</h1>
          </div>
          <p className="text-sm text-gray-400">Find and connect with expert mentors</p>
        </div>
        <MentorDirectory
          mentors={mentors}
          loading={isLoading}
          onStartConversation={(mentorId) => {
            window.location.href = `/app/messages?start=${mentorId}`;
          }}
        />
      </div>
    </div>
  );
}
