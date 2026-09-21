import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Star, Calendar, MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

interface MentorDirectoryProps {
  mentors: Mentor[];
  loading?: boolean;
  onStartConversation?: (mentorId: string) => void;
}

export function MentorDirectory({ mentors, loading, onStartConversation }: MentorDirectoryProps) {
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);

  const allExpertise = useMemo(() => {
    const set = new Set<string>();
    mentors.forEach((m) => m.expertise?.forEach((e) => set.add(e)));
    return [...set].sort();
  }, [mentors]);

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      const matchesSearch = !search || m.fullName.toLowerCase().includes(search.toLowerCase());
      const matchesExpertise = !selectedExpertise || m.expertise?.includes(selectedExpertise);
      return matchesSearch && matchesExpertise;
    });
  }, [mentors, search, selectedExpertise]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-zinc-100 skeleton-shimmer" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-100 rounded w-2/3 skeleton-shimmer" />
                <div className="h-3 bg-zinc-100 rounded w-1/2 skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-zinc-100 rounded skeleton-shimmer" />
              <div className="h-3 bg-zinc-100 rounded w-3/4 skeleton-shimmer" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search mentors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Search mentors"
            />
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter mentors by skill">
            <Button
              size="sm"
              variant={!selectedExpertise ? "primary" : "outline"}
              onClick={() => setSelectedExpertise(null)}
              aria-pressed={!selectedExpertise}
            >
              All
            </Button>
            {allExpertise.slice(0, 8).map((exp) => {
              const active = selectedExpertise === exp;
              return (
                <Button
                  key={exp}
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  onClick={() => setSelectedExpertise(active ? null : exp)}
                  aria-pressed={active}
                >
                  {exp}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mentor, i) => (
            <motion.div
              key={mentor._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={mentor.avatar}
                    name={mentor.fullName}
                    size="md"
                    className="h-12 w-12 border border-zinc-200"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">{mentor.fullName}</h3>
                    {mentor.rating != null ? (
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{mentor.rating.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                {mentor.bio ? <p className="text-xs text-zinc-600 line-clamp-2 mb-3">{mentor.bio}</p> : null}
                {mentor.expertise && mentor.expertise.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mentor.expertise.slice(0, 3).map((exp) => (
                      <span
                        key={exp}
                        className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-700"
                      >
                        {exp}
                      </span>
                    ))}
                    {mentor.expertise.length > 3 ? (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-[11px] font-medium text-zinc-500">
                        +{mentor.expertise.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                  {mentor.sessionCount != null ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {mentor.sessionCount} sessions
                    </span>
                  ) : null}
                  {mentor.studentCount != null ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {mentor.studentCount} students
                    </span>
                  ) : null}
                </div>
                {onStartConversation ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full"
                    onClick={() => onStartConversation(mentor._id)}
                    aria-label={`Message ${mentor.fullName}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Button>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-500">No mentors found matching your criteria.</p>
        </Card>
      )}
    </div>
  );
}
